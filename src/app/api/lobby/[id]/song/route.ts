import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { songs, users, ratings, lobbies } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getClientCredentialsToken } from "@/lib/spotify/client-credentials"

/**
 * POST /api/lobby/[id]/song
 * Saves a song suggestion for the current user in the specified round
 * Includes AI-powered category validation if a category is set for the lobby
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lobbyId } = await params
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

    const body = await request.json()
    const { spotifyTrackId, roundNumber } = body

    if (!spotifyTrackId || !roundNumber) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "spotifyTrackId and roundNumber are required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Get lobby to check if category is set
    const [lobby] = await db
      .select({ category: lobbies.category })
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1)

    if (!lobby) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Lobby not found",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // If category is set (and not "all"), validate the song matches the category
    // Skip validation if category is null or "all" (alle kategorien erlaubt)
    if (lobby.category && lobby.category !== 'all') {
      console.log(`Category validation enabled for category: ${lobby.category}`)
      try {
        // Fetch track details from Spotify to get song name
        // Uses Client Credentials Flow (no user Spotify linking required)
        const accessToken = await getClientCredentialsToken()
        if (!accessToken) {
          console.warn("Could not get Spotify token for track details, skipping validation")
        } else {
          const trackResponse = await fetch(
            `https://api.spotify.com/v1/tracks/${spotifyTrackId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )

          if (trackResponse.ok) {
            const trackData = await trackResponse.json()
            const songName = trackData.name
            const artistName = trackData.artists?.[0]?.name || ""
            // Format: "Song Name - Artist Name" for better context
            const fullSongName = artistName ? `${songName} - ${artistName}` : songName

            // Call AI validation API
            const validationResponse = await fetch(
              `${request.nextUrl.origin}/api/ai/validate-song-category`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  songName: fullSongName,
                  category: lobby.category,
                }),
              }
            )

            if (validationResponse.ok) {
              const validationData = await validationResponse.json()
              
              // Only block if validation explicitly returns false (Nein)
              if (validationData.valid === false) {
                return NextResponse.json(
                  {
                    error: {
                      code: "CATEGORY_MISMATCH",
                      message: `Der Song passt nicht. Die festgelegte Kategorie für dieses Spiel lautet: ${lobby.category}.`,
                      category: lobby.category,
                      status: 400,
                    },
                  },
                  { status: 400 }
                )
              }
            } else {
              // If validation API fails, log but don't block (fail open)
              console.warn("AI validation failed, allowing song:", await validationResponse.text())
            }
          } else {
            // If Spotify API fails, log but don't block (fail open)
            console.warn("Could not fetch track details for validation, allowing song")
          }
        }
      } catch (validationError: any) {
        // If validation fails for any reason, log but don't block (fail open)
        console.warn("Error during category validation, allowing song:", validationError?.message)
      }
    } else {
      console.log(`Skipping category validation: category is ${lobby.category || 'null'} (all categories allowed)`)
    }

    // Get user's database ID
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!dbUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found in database",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Check if user already suggested a song for this round
    const existingSong = await db
      .select()
      .from(songs)
      .where(
        and(
          eq(songs.lobbyId, lobbyId),
          eq(songs.suggestedBy, dbUser.id),
          eq(songs.roundNumber, roundNumber)
        )
      )
      .limit(1)

    if (existingSong.length > 0) {
      // Check if song has ratings - if yes, don't allow update
      const songRatings = await db
        .select()
        .from(ratings)
        .where(eq(ratings.songId, existingSong[0].id))
        .limit(1)

      if (songRatings.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: "SONG_HAS_RATINGS",
              message: "Cannot edit song that has ratings",
              status: 400,
            },
          },
          { status: 400 }
        )
      }

      // Update existing song
      await db
        .update(songs)
        .set({
          spotifyTrackId,
        })
        .where(eq(songs.id, existingSong[0].id))
    } else {
      // Create new song
      await db.insert(songs).values({
        spotifyTrackId,
        lobbyId,
        suggestedBy: dbUser.id,
        roundNumber,
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error saving song:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to save song",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/lobby/[id]/song
 * Deletes a song suggestion for the current user in the specified round
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lobbyId } = await params
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

    const requestUrl = new URL(request.url)
    const roundNumber = requestUrl.searchParams.get("roundNumber")

    if (!roundNumber) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "roundNumber query parameter is required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Get user's database ID
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!dbUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found in database",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Find and delete the song
    const existingSong = await db
      .select()
      .from(songs)
      .where(
        and(
          eq(songs.lobbyId, lobbyId),
          eq(songs.suggestedBy, dbUser.id),
          eq(songs.roundNumber, parseInt(roundNumber))
        )
      )
      .limit(1)

    if (existingSong.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "SONG_NOT_FOUND",
            message: "Song not found",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Check if song has ratings - if yes, don't allow deletion
    const songRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.songId, existingSong[0].id))
      .limit(1)

    if (songRatings.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "SONG_HAS_RATINGS",
            message: "Cannot delete song that has ratings",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    await db.delete(songs).where(eq(songs.id, existingSong[0].id))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting song:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to delete song",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}