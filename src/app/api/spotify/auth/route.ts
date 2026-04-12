import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeSpotifyOAuthReturnTo } from "@/lib/spotify/sanitizeReturnTo"

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
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    
    if (!clientId) {
      console.error("❌ NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set")
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "Spotify Client ID not configured. Please set NEXT_PUBLIC_SPOTIFY_CLIENT_ID in your .env file.",
            status: 500,
          },
        },
        { status: 500 }
      )
    }
    
    if (!clientSecret) {
      console.error("❌ SPOTIFY_CLIENT_SECRET is not set")
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "Spotify Client Secret not configured. Please set SPOTIFY_CLIENT_SECRET in your .env file.",
            status: 500,
          },
        },
        { status: 500 }
      )
    }
    
    // Validate client ID format (should be 32 characters)
    if (clientId.length !== 32) {
      console.error("❌ Invalid Client ID format. Expected 32 characters, got:", clientId.length)
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "Invalid Spotify Client ID format. Please check your NEXT_PUBLIC_SPOTIFY_CLIENT_ID.",
            status: 500,
          },
        },
        { status: 500 }
      )
    }

    // Build redirect URI
    const requestUrl = new URL(request.url)
    const returnToRaw = requestUrl.searchParams.get("return_to")
    const returnTo = returnToRaw ? sanitizeSpotifyOAuthReturnTo(returnToRaw) : null

    const hostHeader = request.headers.get("host") ?? ""
    const isLocalDev = hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1") || hostHeader.includes("0.0.0.0")

    let baseUrl: string

    if (isLocalDev) {
      // Dev: use 127.0.0.1 (Spotify rejects localhost for HTTP)
      const portMatch = hostHeader.match(/:(\d+)$/)
      const port = portMatch ? portMatch[1] : (requestUrl.port || "3000")
      baseUrl = `http://127.0.0.1:${port}`
    } else {
      // Production: derive from the actual request host so the URI always
      // matches whatever the user typed in the browser (www or non-www)
      baseUrl = `${requestUrl.protocol}//${hostHeader}`
    }

    const redirectUri = `${baseUrl}/api/spotify/callback`
    
    // Log for debugging - IMPORTANT: This shows what Redirect URI you need to register in Spotify Dashboard
    console.log("🔵 Spotify OAuth Configuration:", {
      clientId: clientId.substring(0, 10) + "...",
      redirectUri,
      hostHeader,
      requestOrigin: requestUrl.origin,
      baseUrl,
    })
    console.log("⚠️ IMPORTANT: Make sure this Redirect URI is registered in Spotify Dashboard:")
    console.log("   ", redirectUri)
    console.log("   Go to: https://developer.spotify.com/dashboard")
    console.log("   → Your App → Edit Settings → Redirect URIs")

    // Spotify OAuth scopes needed for the app
    const scopes = [
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-public",
      "playlist-modify-private",
      "streaming",
    ].join(" ")

    // Generate state parameter for CSRF protection (+ optional post-auth path)
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        ...(returnTo ? { returnTo } : {}),
      })
    ).toString("base64")

    // Build Spotify authorization URL
    const authUrl = new URL("https://accounts.spotify.com/authorize")
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("show_dialog", "false")

    // Log the full URL for debugging (without sensitive data)
    console.log("=".repeat(80))
    console.log("🔵 SPOTIFY OAUTH INITIATION")
    console.log("=".repeat(80))
    console.log("Full Authorization URL:", authUrl.toString())
    console.log("Configuration:", {
      base: authUrl.origin + authUrl.pathname,
      client_id: clientId.substring(0, 10) + "...",
      client_id_full: clientId,
      redirect_uri: redirectUri,
      redirect_uri_encoded: encodeURIComponent(redirectUri),
      scopes: scopes.split(" ").length + " scopes",
      scopes_list: scopes.split(" "),
      state_length: state.length,
    })
    console.log("Request Details:", {
      hostHeader,
      requestOrigin: requestUrl.origin,
      requestUrl: requestUrl.toString(),
      baseUrl,
    })
    console.log("=".repeat(80))
    console.log("⚠️  IMPORTANT: Make sure this Redirect URI is registered in Spotify Dashboard:")
    console.log("   ", redirectUri)
    console.log("   Go to: https://developer.spotify.com/dashboard")
    console.log("   → Your App → Edit Settings → Redirect URIs")
    console.log("=".repeat(80))

    // Check if debug mode is requested (add ?debug=true to URL)
    const debugMode = requestUrl.searchParams.get("debug") === "true"
    if (debugMode) {
      // Return JSON with all details instead of redirecting
      return NextResponse.json({
        debug: true,
        message: "Debug mode: Spotify OAuth configuration details",
        configuration: {
          clientId: clientId,
          clientIdLength: clientId.length,
          hasClientSecret: !!clientSecret,
          redirectUri,
          redirectUriEncoded: encodeURIComponent(redirectUri),
          baseUrl,
          hostHeader,
          requestOrigin: requestUrl.origin,
        },
        authorizationUrl: authUrl.toString(),
        authorizationUrlDecoded: {
          base: authUrl.origin + authUrl.pathname,
          response_type: authUrl.searchParams.get("response_type"),
          client_id: authUrl.searchParams.get("client_id"),
          scope: authUrl.searchParams.get("scope"),
          redirect_uri: authUrl.searchParams.get("redirect_uri"),
          state_length: authUrl.searchParams.get("state")?.length || 0,
          show_dialog: authUrl.searchParams.get("show_dialog"),
        },
        validation: {
          clientIdValid: clientId.length === 32,
          redirectUriUsesLoopback: redirectUri.includes("127.0.0.1") || redirectUri.includes("[::1]"),
          redirectUriNotLocalhost: !redirectUri.includes("localhost"),
          redirectUriFormat: redirectUri.startsWith("http://127.0.0.1:") || redirectUri.startsWith("https://"),
        },
        instructions: {
          step1: "Copy the redirectUri value below",
          step2: "Go to https://developer.spotify.com/dashboard",
          step3: "Select your app → Edit Settings",
          step4: `Add this EXACT Redirect URI: ${redirectUri}`,
          step5: "Save and remove ?debug=true from the URL to try again",
        },
      }, { status: 200 })
    }

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

