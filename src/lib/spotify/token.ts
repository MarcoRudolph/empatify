import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Refreshes Spotify access token if expired
 * Returns the valid access token
 */
export async function getValidSpotifyToken(userEmail: string): Promise<string | null> {
  try {
    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (userRecord.length === 0 || !userRecord[0].spotifyRefreshToken) {
      return null
    }

    const user = userRecord[0]
    const expiresAt = user.spotifyTokenExpiresAt
      ? new Date(user.spotifyTokenExpiresAt)
      : null

    // Check if token is still valid (with 5 minute buffer)
    if (expiresAt && expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return user.spotifyAccessToken || null
    }

    // Token expired, refresh it
    if (!user.spotifyRefreshToken) {
      return null
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("Spotify credentials not configured")
      return null
    }

    // Request new access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.spotifyRefreshToken,
      }),
    })

    if (!tokenResponse.ok) {
      console.error("Failed to refresh Spotify token")
      return null
    }

    const tokenData = await tokenResponse.json()
    const { access_token: accessToken, expires_in: expiresIn } = tokenData

    // Calculate new expiration time
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expiresIn)

    // Update database with new token
    await db
      .update(users)
      .set({
        spotifyAccessToken: accessToken,
        spotifyTokenExpiresAt: newExpiresAt,
      })
      .where(eq(users.id, user.id))

    return accessToken
  } catch (error) {
    console.error("Error refreshing Spotify token:", error)
    return null
  }
}

