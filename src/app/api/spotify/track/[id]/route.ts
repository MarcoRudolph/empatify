import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * GET /api/spotify/track/[id]
 * Fetches track details from Spotify API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackId } = await params

    if (!trackId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Track ID is required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

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

    // Get user's Spotify access token
    const [dbUser] = await db
      .select({
        spotifyAccessToken: users.spotifyAccessToken,
        spotifyTokenExpiresAt: users.spotifyTokenExpiresAt,
      })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!dbUser?.spotifyAccessToken) {
      return NextResponse.json(
        {
          error: {
            code: "SPOTIFY_NOT_LINKED",
            message: "Spotify account not linked",
            status: 403,
          },
        },
        { status: 403 }
      )
    }

    // Check if token is expired
    if (dbUser.spotifyTokenExpiresAt && new Date(dbUser.spotifyTokenExpiresAt) <= new Date()) {
      return NextResponse.json(
        {
          error: {
            code: "TOKEN_EXPIRED",
            message: "Spotify token expired. Please reconnect your account.",
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    // Fetch track details from Spotify
    const trackResponse = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${dbUser.spotifyAccessToken}`,
        },
      }
    )

    if (!trackResponse.ok) {
      const errorText = await trackResponse.text()
      console.error("Spotify API error:", errorText)
      return NextResponse.json(
        {
          error: {
            code: "SPOTIFY_API_ERROR",
            message: "Failed to fetch track from Spotify",
            status: trackResponse.status,
          },
        },
        { status: trackResponse.status }
      )
    }

    const trackData = await trackResponse.json()
    return NextResponse.json(trackData)
  } catch (error: any) {
    console.error("Error fetching track:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to fetch track",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
