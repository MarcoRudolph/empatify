import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/spotify/select-song
 * Opens Spotify (app on mobile, web player on desktop) for song selection
 * Redirects back to lobby after selection
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const lobbyId = requestUrl.searchParams.get("lobbyId")
    const roundNumber = requestUrl.searchParams.get("roundNumber")

    if (!lobbyId || !roundNumber) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "lobbyId and roundNumber are required",
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

    // Build callback URL
    const callbackUrl = `${requestUrl.origin}/api/spotify/song-callback?lobbyId=${lobbyId}&roundNumber=${roundNumber}`

    // Detect if mobile device
    const userAgent = request.headers.get("user-agent") || ""
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent)

    // Spotify URLs
    // Mobile: Try to open Spotify app, fallback to web
    // Desktop: Open Spotify Web Player
    let spotifyUrl: string
    if (isMobile) {
      // Try Spotify app first, fallback to web
      spotifyUrl = `https://open.spotify.com/search`
    } else {
      // Desktop: Open Spotify Web Player
      spotifyUrl = `https://open.spotify.com/search`
    }

    // Add callback URL as state parameter
    const spotifyUrlWithCallback = new URL(spotifyUrl)
    spotifyUrlWithCallback.searchParams.set("callback", callbackUrl)

    // Redirect to Spotify
    return NextResponse.redirect(spotifyUrlWithCallback.toString())
  } catch (error: any) {
    console.error("Error opening Spotify:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to open Spotify",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

