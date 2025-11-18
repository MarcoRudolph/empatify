import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { lobbies, lobbyParticipants, users, songs, ratings } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"

/**
 * GET /api/lobby/[id]
 * Gets lobby details including participants, songs, and ratings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get lobby
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, id))
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

    // Get participants with user details
    const participants = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        joinedAt: lobbyParticipants.joinedAt,
      })
      .from(lobbyParticipants)
      .innerJoin(users, eq(lobbyParticipants.userId, users.id))
      .where(eq(lobbyParticipants.lobbyId, id))

    // Get songs with ratings for all rounds
    const songsData = await db
      .select({
        id: songs.id,
        spotifyTrackId: songs.spotifyTrackId,
        suggestedBy: songs.suggestedBy,
        suggestedByName: users.name,
        roundNumber: songs.roundNumber,
        createdAt: songs.createdAt,
      })
      .from(songs)
      .innerJoin(users, eq(songs.suggestedBy, users.id))
      .where(eq(songs.lobbyId, id))

    // Get ratings for songs
    let ratingsData: any[] = []
    if (songsData.length > 0) {
      const songIds = songsData.map((s) => s.id)
      ratingsData = await db
        .select({
          songId: ratings.songId,
          givenBy: ratings.givenBy,
          ratingValue: ratings.ratingValue,
        })
        .from(ratings)
        .where(inArray(ratings.songId, songIds))
    }

    // Calculate average ratings and leaderboard
    const leaderboard = participants.map((participant) => {
      const participantSongs = songsData.filter(
        (s) => s.suggestedBy === participant.id
      )
      const participantRatings = participantSongs.flatMap((song) =>
        ratingsData
          .filter((r) => r.songId === song.id)
          .map((r) => r.ratingValue)
      )
      const averageRating =
        participantRatings.length > 0
          ? participantRatings.reduce((a, b) => a + b, 0) /
            participantRatings.length
          : 0

      return {
        userId: participant.id,
        name: participant.name,
        avatarUrl: participant.avatarUrl,
        averageRating,
        songsSuggested: participantSongs.length,
      }
    })

    return NextResponse.json(
      {
        lobby: {
          id: lobby.id,
          hostId: lobby.hostId,
          category: lobby.category,
          maxRounds: lobby.maxRounds,
          gameMode: lobby.gameMode || "multi-device",
          createdAt: lobby.createdAt,
        },
        participants,
        songs: songsData,
        ratings: ratingsData,
        leaderboard: leaderboard.sort((a, b) => b.averageRating - a.averageRating),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching lobby:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch lobby",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

