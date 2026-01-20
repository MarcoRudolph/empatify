/**
 * Spotify Client Credentials Flow
 * Gets an access token using only app credentials (no user login required)
 * Used for public API access like searching tracks
 */

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Gets a valid access token using Client Credentials flow
 * Caches the token until it expires
 */
export async function getClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error("Spotify credentials not configured")
    return null
  }

  // Check if cached token is still valid (with 5 minute buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token
  }

  try {
    // Request access token using Client Credentials flow
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Failed to get client credentials token:", errorText)
      return null
    }

    const tokenData = await tokenResponse.json()
    const { access_token: accessToken, expires_in: expiresIn } = tokenData

    // Cache the token
    cachedToken = {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    }

    return accessToken
  } catch (error) {
    console.error("Error getting client credentials token:", error)
    return null
  }
}
