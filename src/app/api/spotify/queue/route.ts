import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createSpotifyClient } from "@/lib/spotify/client"

/**
 * POST /api/spotify/queue
 * Adds multiple tracks to the user's Spotify playback queue
 * Requires Spotify Premium account
 */
export async function POST(request: NextRequest) {
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

    // Get track IDs from request body
    const body = await request.json()
    const { trackIds } = body

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "trackIds array is required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Get user's Spotify tokens from database
    const [dbUser] = await db
      .select({
        id: users.id,
        spotifyAccessToken: users.spotifyAccessToken,
        spotifyRefreshToken: users.spotifyRefreshToken,
        spotifyTokenExpiresAt: users.spotifyTokenExpiresAt,
      })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!dbUser || !dbUser.spotifyAccessToken || !dbUser.spotifyRefreshToken) {
      return NextResponse.json(
        {
          error: {
            code: "SPOTIFY_NOT_LINKED",
            message: "Spotify account not linked. Please link your Spotify account in settings.",
            status: 403,
          },
        },
        { status: 403 }
      )
    }

    // Check if token is expired and refresh if needed
    let accessToken = dbUser.spotifyAccessToken
    const tokenExpiresAt = dbUser.spotifyTokenExpiresAt
    const isExpired = tokenExpiresAt ? new Date(tokenExpiresAt) <= new Date() : false

    if (isExpired) {
      // Refresh token
      const refreshResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: dbUser.spotifyRefreshToken,
        }),
      })

      if (!refreshResponse.ok) {
        return NextResponse.json(
          {
            error: {
              code: "TOKEN_REFRESH_FAILED",
              message: "Failed to refresh Spotify token. Please re-link your account.",
              status: 401,
            },
          },
          { status: 401 }
        )
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)

      // Update token in database
      await db
        .update(users)
        .set({
          spotifyAccessToken: accessToken,
          spotifyTokenExpiresAt: newExpiresAt,
        })
        .where(eq(users.id, dbUser.id))
    }

    // Create Spotify client with access token
    const spotifyClient = createSpotifyClient(accessToken)

    // Start playback with first track, then add rest to queue
    try {
      // First, start playback with the first track
      await spotifyClient.play({
        uris: [`spotify:track:${trackIds[0]}`],
      })

      // Add remaining tracks to queue
      for (let i = 1; i < trackIds.length; i++) {
        await spotifyClient.addToQueue(`spotify:track:${trackIds[i]}`)
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return NextResponse.json({
        success: true,
        message: `Started playback with ${trackIds.length} tracks`,
        tracksAdded: trackIds.length,
      })
    } catch (spotifyError: any) {
      console.error("Spotify API error:", spotifyError)
      
      // Check for specific error codes
      if (spotifyError.statusCode === 403) {
        return NextResponse.json(
          {
            error: {
              code: "PREMIUM_REQUIRED",
              message: "Spotify Premium account is required for playback control",
              status: 403,
            },
          },
          { status: 403 }
        )
      }

      if (spotifyError.statusCode === 404) {
        return NextResponse.json(
          {
            error: {
              code: "NO_ACTIVE_DEVICE",
              message: "No active Spotify device found. Please open Spotify on a device and try again.",
              status: 404,
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          error: {
            code: "SPOTIFY_ERROR",
            message: spotifyError.message || "Failed to add tracks to queue",
            status: 500,
          },
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error adding tracks to Spotify queue:", error)
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
