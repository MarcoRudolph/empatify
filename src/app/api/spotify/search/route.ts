import { NextRequest, NextResponse } from "next/server"
import { getClientCredentialsToken } from "@/lib/spotify/client-credentials"

/**
 * GET /api/spotify/search
 * Searches for tracks on Spotify using Client Credentials flow (no user login required)
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

