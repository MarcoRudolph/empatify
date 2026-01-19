import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { routing } from "@/i18n/routing"

/**
 * GET /api/spotify/callback
 * Handles Spotify OAuth callback
 * Exchanges authorization code for access token and stores it in database
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const state = requestUrl.searchParams.get("state")
    const error = requestUrl.searchParams.get("error")

    // Handle OAuth errors - capture ALL error details from Spotify
    if (error) {
      const errorDescription = requestUrl.searchParams.get("error_description") || "No description provided"
      const errorUri = requestUrl.searchParams.get("error_uri") || null
      
      // Log comprehensive error details
      console.error("=".repeat(80))
      console.error("❌ SPOTIFY OAUTH ERROR DETECTED")
      console.error("=".repeat(80))
      console.error("Error Code:", error)
      console.error("Error Description:", errorDescription)
      if (errorUri) console.error("Error URI:", errorUri)
      console.error("Full Request URL:", requestUrl.toString())
      console.error("All Query Parameters:", Object.fromEntries(requestUrl.searchParams.entries()))
      console.error("=".repeat(80))
      
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      
      // Include error description in redirect for debugging
      const errorParam = `${error}${errorDescription ? `:${encodeURIComponent(errorDescription)}` : ""}`
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=${errorParam}`, requestUrl.origin)
      )
    }

    if (!code || !state) {
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=missing_params`, requestUrl.origin)
      )
    }

    // Decode state to get userId
    let userId: string
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString())
      userId = decodedState.userId
    } catch (e) {
      console.error("Invalid state parameter:", e)
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=invalid_state`, requestUrl.origin)
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=unauthorized`, requestUrl.origin)
      )
    }

    // Exchange authorization code for access token
    // Build redirect URI - must match the one used in /api/spotify/auth
    // Spotify requires 127.0.0.1 (not localhost) for HTTP redirects
    const hostHeader = request.headers.get("host")
    
    // Extract port from host header or request URL
    let port = requestUrl.port
    if (!port && hostHeader) {
      const hostPortMatch = hostHeader.match(/:(\d+)$/)
      if (hostPortMatch) {
        port = hostPortMatch[1]
      }
    }
    // Default to 3000 for development if no port found
    if (!port) {
      port = requestUrl.protocol === "https:" ? "443" : "3000"
    }
    
    let baseUrl: string
    
    // If host header contains localhost or 0.0.0.0, convert to 127.0.0.1
    if (hostHeader && (hostHeader.includes("localhost") || hostHeader.includes("0.0.0.0"))) {
      // Extract port from host header if present
      const hostPortMatch = hostHeader.match(/:(\d+)$/)
      const extractedPort = hostPortMatch ? hostPortMatch[1] : port
      baseUrl = `http://127.0.0.1:${extractedPort}`
    } else if (hostHeader && !hostHeader.includes("0.0.0.0") && !hostHeader.includes("localhost")) {
      // Use the Host header as-is for non-localhost addresses
      const protocol = requestUrl.protocol || "http:"
      baseUrl = `${protocol}//${hostHeader}`
    } else {
      // Fallback: use 127.0.0.1 with extracted port
      baseUrl = `http://127.0.0.1:${port}`
    }
    
    // Final safety check: ensure no localhost or 0.0.0.0 remains
    if (baseUrl.includes("localhost")) {
      const portMatch = baseUrl.match(/:(\d+)/)
      const finalPort = portMatch ? portMatch[1] : port
      baseUrl = `http://127.0.0.1:${finalPort}`
    }
    
    if (baseUrl.includes("0.0.0.0")) {
      const portMatch = baseUrl.match(/:(\d+)/)
      const finalPort = portMatch ? portMatch[1] : port
      baseUrl = `http://127.0.0.1:${finalPort}`
    }
    
    const redirectUri = `${baseUrl}/api/spotify/callback`
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    
    // Log for debugging
    console.log("🟢 Spotify Callback Configuration:", {
      redirectUri,
      hostHeader,
      requestOrigin: requestUrl.origin,
      baseUrl,
    })

    if (!clientId || !clientSecret) {
      console.error("Spotify credentials not configured")
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=config_error`, requestUrl.origin)
      )
    }

    // Request access token from Spotify
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      const statusCode = tokenResponse.status
      const statusText = tokenResponse.statusText
      
      // Log comprehensive error details
      console.error("=".repeat(80))
      console.error("❌ SPOTIFY TOKEN EXCHANGE FAILED")
      console.error("=".repeat(80))
      console.error("Status Code:", statusCode)
      console.error("Status Text:", statusText)
      console.error("Response Body:", errorData)
      console.error("Request Details:", {
        redirectUri,
        clientId: clientId?.substring(0, 10) + "...",
        clientIdFull: clientId,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0,
      })
      console.error("Full Request URL:", requestUrl.toString())
      console.error("=".repeat(80))
      
      let errorMessage = "token_exchange_failed"
      let errorDetails: any = {}
      
      try {
        const errorJson = JSON.parse(errorData)
        errorDetails = errorJson
        errorMessage = errorJson.error || "unknown_error"
        
        console.error("Parsed Error JSON:", JSON.stringify(errorJson, null, 2))
        
        if (errorJson.error === "invalid_client") {
          errorMessage = "invalid_client_secret"
          console.error("❌ DIAGNOSIS: Invalid Client")
          console.error("   This usually means:")
          console.error("   1. SPOTIFY_CLIENT_SECRET is incorrect")
          console.error("   2. Client ID and Secret don't match")
          console.error("   3. Check your .env file for typos")
          console.error("   4. Client Secret might have been reset in Spotify Dashboard")
        } else if (errorJson.error === "invalid_grant") {
          errorMessage = "invalid_grant"
          console.error("❌ DIAGNOSIS: Invalid Grant")
          console.error("   This usually means:")
          console.error("   1. Authorization code expired or already used")
          console.error("   2. Redirect URI mismatch between auth and callback")
          console.error("   3. Code was already exchanged")
        } else if (errorJson.error === "invalid_request") {
          errorMessage = "invalid_request"
          console.error("❌ DIAGNOSIS: Invalid Request")
          console.error("   Error Description:", errorJson.error_description)
        }
        
        if (errorJson.error_description) {
          console.error("   Error Description:", errorJson.error_description)
        }
      } catch (e) {
        console.error("❌ Could not parse error response as JSON")
        console.error("   Raw error data:", errorData)
      }
      
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      
      // Include detailed error in URL for debugging
      const errorParam = `${errorMessage}${errorDetails.error_description ? `:${encodeURIComponent(errorDetails.error_description)}` : ""}`
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=${errorParam}&status=${statusCode}`, baseUrl)
      )
    }

    const tokenData = await tokenResponse.json()
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = tokenData

    // Get Spotify user info
    const userInfoResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    let spotifyUserId: string | null = null
    if (userInfoResponse.ok) {
      const spotifyUser = await userInfoResponse.json()
      spotifyUserId = spotifyUser.id
    }

    // Calculate token expiration time
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

    // Store tokens in database
    // First, get the user's database record ID (might be different from Supabase auth ID)
    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    // If user doesn't exist in database, create them
    if (userRecord.length === 0) {
      const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User"
      const [newUser] = await db
        .insert(users)
        .values({
          email: user.email!,
          name: displayName,
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
        .returning()
      userRecord = [newUser]
    }

    // Update user record with Spotify tokens
    await db
      .update(users)
      .set({
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyTokenExpiresAt: expiresAt,
        spotifyUserId: spotifyUserId,
      })
      .where(eq(users.id, userRecord[0].id))

    // Redirect back to dashboard with success
    const cookieStore = await cookies()
    const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard?spotify_linked=true`, requestUrl.origin)
    )
  } catch (error: any) {
    console.error("Unexpected error in Spotify callback:", error)
    const cookieStore = await cookies()
    const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard?spotify_error=unexpected_error`, requestUrl.origin)
    )
  }
}

