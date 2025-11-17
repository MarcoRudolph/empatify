import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/spotify/auth
 * Initiates Spotify OAuth flow
 * Redirects user to Spotify authorization page
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

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "Spotify Client ID not configured",
            status: 500,
          },
        },
        { status: 500 }
      )
    }

    // Build redirect URI
    const requestUrl = new URL(request.url)
    const redirectUri = `${requestUrl.origin}/api/spotify/callback`

    // Spotify OAuth scopes needed for the app
    const scopes = [
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "playlist-read-private",
      "playlist-read-collaborative",
      "streaming",
    ].join(" ")

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64")

    // Build Spotify authorization URL
    const authUrl = new URL("https://accounts.spotify.com/authorize")
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("show_dialog", "false")

    // Redirect to Spotify
    return NextResponse.redirect(authUrl.toString())
  } catch (error: any) {
    console.error("Error initiating Spotify OAuth:", error)
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

