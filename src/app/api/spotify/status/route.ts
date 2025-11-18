import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * GET /api/spotify/status
 * Returns the Spotify connection status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    // Get or create user record from database
    // Select only basic columns first to avoid Spotify column errors
    let dbUser: any = null;
    let isLinked = false;
    let spotifyUserId: string | null = null;
    let tokenExpiresAt: Date | null = null;

    try {
      // First, try to get basic user info
      const userRecord = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1);

      if (userRecord.length === 0) {
        // If user doesn't exist in database, create them
        const displayName =
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User";
        const [newUser] = await db
          .insert(users)
          .values({
            email: user.email!,
            name: displayName,
            avatarUrl: user.user_metadata?.avatar_url || null,
          })
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
          });
        dbUser = newUser;
      } else {
        dbUser = userRecord[0];
      }

      // Try to check Spotify columns separately (they might not exist)
      if (dbUser) {
        try {
          const spotifyRecord = await db
            .select({
              spotifyAccessToken: users.spotifyAccessToken,
              spotifyRefreshToken: users.spotifyRefreshToken,
              spotifyUserId: users.spotifyUserId,
              spotifyTokenExpiresAt: users.spotifyTokenExpiresAt,
            })
            .from(users)
            .where(eq(users.id, dbUser.id))
            .limit(1);

          if (spotifyRecord.length > 0 && spotifyRecord[0]) {
            const spotify = spotifyRecord[0];
            // User is linked if they have both access and refresh tokens
            isLinked =
              !!spotify.spotifyAccessToken && !!spotify.spotifyRefreshToken;
            spotifyUserId = spotify.spotifyUserId || null;
            tokenExpiresAt = spotify.spotifyTokenExpiresAt || null;
          }
        } catch (spotifyError: any) {
          // Spotify columns don't exist, so Spotify is not linked
          if (
            spotifyError.message?.includes("spotify") ||
            spotifyError.message?.includes("column")
          ) {
            console.warn(
              "Spotify columns not found. Please run the migration."
            );
            isLinked = false;
          } else {
            // Re-throw other errors
            throw spotifyError;
          }
        }
      }
    } catch (error: any) {
      // If error is about missing columns, return not linked
      if (error.message?.includes("spotify") || error.message?.includes("column")) {
        console.warn("Database error:", error.message);
        return NextResponse.json({
          linked: false,
          spotifyUserId: null,
          tokenExpiresAt: null,
          needsRefresh: false,
        });
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    return NextResponse.json({
      linked: isLinked,
      spotifyUserId: spotifyUserId,
      tokenExpiresAt: tokenExpiresAt,
      needsRefresh:
        isLinked && tokenExpiresAt
          ? new Date(tokenExpiresAt) <= new Date()
          : false,
    });
  } catch (error: any) {
    console.error("Error checking Spotify status:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

