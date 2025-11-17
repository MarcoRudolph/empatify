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

    // Handle OAuth errors
    if (error) {
      console.error("Spotify OAuth error:", error)
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=${error}`, requestUrl.origin)
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
    const redirectUri = `${requestUrl.origin}/api/spotify/callback`
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

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
      console.error("Spotify token exchange error:", errorData)
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard?spotify_error=token_exchange_failed`, requestUrl.origin)
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

