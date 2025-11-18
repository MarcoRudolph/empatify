import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * GET /api/spotify/search
 * Searches for tracks on Spotify using the user's access token
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const query = requestUrl.searchParams.get("q")

    if (!query) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameter 'q' is required",
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

    // Check if token is expired and refresh if needed
    let accessToken = dbUser.spotifyAccessToken
    if (dbUser.spotifyTokenExpiresAt && new Date(dbUser.spotifyTokenExpiresAt) <= new Date()) {
      // TODO: Implement token refresh
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

    // Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error("Spotify API error:", errorText)
      return NextResponse.json(
        {
          error: {
            code: "SPOTIFY_API_ERROR",
            message: "Failed to search Spotify",
            status: searchResponse.status,
          },
        },
        { status: searchResponse.status }
      )
    }

    const data = await searchResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error searching Spotify:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to search Spotify",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

