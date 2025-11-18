import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/Navbar"
import { SettingsPageClient } from "./SettingsPageClient"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Settings page - User profile and account management
 * Features: Name editing, Spotify connection management, Account deletion
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get or create user record from database to check Spotify status
  // Select only basic columns first to avoid Spotify column errors
  let dbUser: any = null;
  let isSpotifyLinked = false;

  try {
    // First, try to get basic user info
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        proPlan: users.proPlan,
        createdAt: users.createdAt,
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
          avatarUrl: users.avatarUrl,
          proPlan: users.proPlan,
          createdAt: users.createdAt,
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
          })
          .from(users)
          .where(eq(users.id, dbUser.id))
          .limit(1);

        if (spotifyRecord.length > 0 && spotifyRecord[0]) {
          const spotify = spotifyRecord[0];
          // User is linked if they have both access and refresh tokens
          isSpotifyLinked =
            !!spotify.spotifyAccessToken && !!spotify.spotifyRefreshToken;
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
          isSpotifyLinked = false;
        } else {
          // Re-throw other errors
          throw spotifyError;
        }
      }
    }
  } catch (error: any) {
    // If error is about missing columns, try to continue without them
    if (error.message?.includes("spotify") || error.message?.includes("column")) {
      console.warn("Database error:", error.message);
      // Try to get user without Spotify columns
      try {
        const userRecord = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            proPlan: users.proPlan,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        dbUser = userRecord.length > 0 ? userRecord[0] : null;
        isSpotifyLinked = false;
      } catch (retryError) {
        console.error("Failed to fetch user:", retryError);
        throw retryError;
      }
    } else {
      // Re-throw other errors
      throw error;
    }
  }

  return (
    <>
      <Navbar locale={locale} />
      <SettingsPageClient 
        locale={locale} 
        user={user} 
        isSpotifyLinked={isSpotifyLinked}
      />
    </>
  )
}

