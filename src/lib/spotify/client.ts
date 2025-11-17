import SpotifyWebApi from 'spotify-web-api-node';

/**
 * Spotify Web API client
 * Used for searching tracks and managing playback
 */
export function createSpotifyClient(accessToken?: string) {
  const client = new SpotifyWebApi({
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  if (accessToken) {
    client.setAccessToken(accessToken);
  }

  return client;
}

