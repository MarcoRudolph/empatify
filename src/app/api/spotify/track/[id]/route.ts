import { NextRequest, NextResponse } from "next/server"
import { getClientCredentialsToken } from "@/lib/spotify/client-credentials"

/**
 * GET /api/spotify/track/[id]
 * Fetches track details from Spotify API using Client Credentials flow
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

    // Get access token using Client Credentials flow
    const accessToken = await getClientCredentialsToken()
    
    if (!accessToken) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "Spotify credentials not configured. Please set NEXT_PUBLIC_SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.",
            status: 500,
          },
        },
        { status: 500 }
      )
    }

    // Fetch track details from Spotify
    const trackResponse = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
