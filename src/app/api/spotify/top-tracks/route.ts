import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getValidSpotifyToken } from "@/lib/spotify/token"

/**
 * GET /api/spotify/top-tracks
 * Fetches user's top 5 tracks from Spotify
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

    // Get user's Spotify access token (with refresh if needed)
    const accessToken = await getValidSpotifyToken(user.email!)
    
    if (!accessToken) {
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

    // Fetch top tracks from Spotify API
    // time_range: long_term (calculated from several years), medium_term (approximately last 6 months), short_term (approximately last 4 weeks)
    const topTracksResponse = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!topTracksResponse.ok) {
      const errorText = await topTracksResponse.text()
      console.error("Spotify API error:", errorText)
      
      if (topTracksResponse.status === 401) {
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
      
      return NextResponse.json(
        {
          error: {
            code: "SPOTIFY_API_ERROR",
            message: "Failed to fetch top tracks from Spotify",
            status: topTracksResponse.status,
          },
        },
        { status: topTracksResponse.status }
      )
    }

    const data = await topTracksResponse.json()
    return NextResponse.json({
      tracks: data.items || [],
    })
  } catch (error: any) {
    console.error("Error fetching top tracks:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to fetch top tracks",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
