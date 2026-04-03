// src/lib/spotify/client-credentials.ts
import { withCache } from '@/lib/cache'

/**
 * Gets a valid Spotify Client Credentials access token.
 * Cached in Redis for 3500 s (token expires after 3600 s).
 * Falls back to a direct fetch if Redis is unavailable.
 */
export async function getClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Spotify credentials not configured')
    return null
  }

  return withCache('spotify:token:cc', 3500, async () => {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get client credentials token:', errorText)
      throw new Error(`Spotify token fetch failed: ${tokenResponse.status}`)
    }

    const { access_token } = await tokenResponse.json()
    return access_token as string
  })
}
