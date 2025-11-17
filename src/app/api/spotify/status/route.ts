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

    // Get user record from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (userRecord.length === 0) {
      return NextResponse.json({
        linked: false,
        spotifyUserId: null,
      })
    }

    const dbUser = userRecord[0]
    const isLinked =
      !!dbUser.spotifyAccessToken &&
      !!dbUser.spotifyRefreshToken &&
      dbUser.spotifyTokenExpiresAt &&
      new Date(dbUser.spotifyTokenExpiresAt) > new Date()

    return NextResponse.json({
      linked: isLinked,
      spotifyUserId: dbUser.spotifyUserId || null,
      tokenExpiresAt: dbUser.spotifyTokenExpiresAt || null,
    })
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

