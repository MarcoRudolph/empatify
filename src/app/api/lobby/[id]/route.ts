import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { lobbies, lobbyParticipants, songs, ratings, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getClientCredentialsToken } from "@/lib/spotify/client-credentials"

/**
 * GET /api/lobby/[id]
 * Fetches lobby data including participants, songs, ratings, and leaderboard
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

    // Get lobby with error handling
    let lobby
    try {
      const lobbyResult = await db
        .select()
        .from(lobbies)
        .where(eq(lobbies.id, id))
        .limit(1)
      
      lobby = lobbyResult[0]
    } catch (dbError: any) {
      console.error("Database error fetching lobby in GET API:", {
        lobbyId: id,
        error: dbError?.message,
        cause: dbError?.cause,
        query: dbError?.query,
        params: dbError?.params,
        stack: dbError?.stack,
      })
      
      // Check for max clients error
      const errorMessage = dbError?.message || dbError?.cause?.message || ""
      const isMaxClientsError =
        errorMessage.includes("MaxClientsInSessionMode") ||
        errorMessage.includes("max clients reached") ||
        errorMessage.includes("too many clients")
      
      if (isMaxClientsError) {
        return NextResponse.json(
          {
            error: {
              code: "MAX_CLIENTS_REACHED",
              message: "Database connection limit reached. Please wait a moment and try again.",
              status: 503,
            },
          },
          { status: 503 }
        )
      }
      
      // Re-throw to be caught by outer catch
      throw dbError
    }

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

    // Get songs with suggested by user name
    const lobbySongs = await db
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
    
    // Get Spotify access token for fetching track details
    const spotifyToken = await getClientCredentialsToken()

    // Get ratings for all songs in this lobby
    const lobbyRatings = await db
      .select({
        songId: ratings.songId,
        givenBy: ratings.givenBy,
        ratingValue: ratings.ratingValue,
      })
      .from(ratings)
      .innerJoin(songs, eq(ratings.songId, songs.id))
      .where(eq(songs.lobbyId, id))

    // Calculate leaderboard
    const leaderboardMap = new Map<
      string,
      { 
        userId: string
        name: string
        avatarUrl: string | null
        totalRating: number
        count: number
        songsSuggested: number
        bestSongId: string | null
        bestSongAverageRating: number
      }
    >()

    // Initialize leaderboard entries for all participants
    participants.forEach((participant) => {
      leaderboardMap.set(participant.id, {
        userId: participant.id,
        name: participant.name,
        avatarUrl: participant.avatarUrl,
        totalRating: 0,
        count: 0,
        songsSuggested: 0,
        bestSongId: null,
        bestSongAverageRating: 0,
      })
    })

    // Calculate ratings per user and find best song
    lobbySongs.forEach((song) => {
      const entry = leaderboardMap.get(song.suggestedBy)
      if (entry) {
        entry.songsSuggested++
      }

      const songRatings = lobbyRatings.filter((r) => r.songId === song.id)
      if (songRatings.length > 0) {
        const songAverageRating = songRatings.reduce((sum, r) => sum + r.ratingValue, 0) / songRatings.length
        
        const entry = leaderboardMap.get(song.suggestedBy)
        if (entry) {
          // Update best song if this one is better
          if (songAverageRating > entry.bestSongAverageRating) {
            entry.bestSongId = song.spotifyTrackId
            entry.bestSongAverageRating = songAverageRating
          }
        }
      }
      
      songRatings.forEach((rating) => {
        const entry = leaderboardMap.get(song.suggestedBy)
        if (entry) {
          entry.totalRating += rating.ratingValue
          entry.count++
        }
      })
    })

    // Convert to array and calculate averages
    const leaderboard = Array.from(leaderboardMap.values())
      .map((entry) => ({
        userId: entry.userId,
        name: entry.name,
        avatarUrl: entry.avatarUrl,
        averageRating: entry.count > 0 ? entry.totalRating / entry.count : 0,
        songsSuggested: entry.songsSuggested,
        bestSongId: entry.bestSongId,
        bestSongAverageRating: entry.bestSongAverageRating,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
    
    // Fetch track details for best songs with rate limiting to avoid overwhelming the API
    // Process in batches to avoid too many concurrent requests
    const batchSize = 3 // Process 3 tracks at a time
    const leaderboardWithBestSongs = []
    
    for (let i = 0; i < leaderboard.length; i += batchSize) {
      const batch = leaderboard.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (entry) => {
          if (!entry.bestSongId || !spotifyToken) {
            return {
              ...entry,
              bestSong: null,
            }
          }
          
          try {
            const trackResponse = await fetch(
              `https://api.spotify.com/v1/tracks/${entry.bestSongId}`,
              {
                headers: {
                  Authorization: `Bearer ${spotifyToken}`,
                },
              }
            )
            
            if (trackResponse.ok) {
              const trackData = await trackResponse.json()
              return {
                ...entry,
                bestSong: {
                  name: trackData.name,
                  artist: trackData.artists?.[0]?.name || "Unknown Artist",
                  rating: entry.bestSongAverageRating,
                },
              }
            }
          } catch (error) {
            console.error(`Error fetching track ${entry.bestSongId}:`, error)
          }
          
          return {
            ...entry,
            bestSong: null,
          }
        })
      )
      leaderboardWithBestSongs.push(...batchResults)
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < leaderboard.length) {
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      }
    }

    return NextResponse.json({
      lobby: {
        id: lobby.id,
        hostId: lobby.hostId,
        maxRounds: lobby.maxRounds,
        category: lobby.category,
        gameMode: lobby.gameMode,
        createdAt: lobby.createdAt.toISOString(),
      },
      participants: participants.map((p) => ({
        ...p,
        joinedAt: p.joinedAt.toISOString(),
      })),
      songs: lobbySongs.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      ratings: lobbyRatings,
      leaderboard: leaderboardWithBestSongs,
    })
  } catch (error: any) {
    console.error("Error fetching lobby data:", error)
    
    // Check for max clients error
    const errorMessage = error?.message || error?.cause?.message || ""
    const isMaxClientsError =
      errorMessage.includes("MaxClientsInSessionMode") ||
      errorMessage.includes("max clients reached") ||
      errorMessage.includes("too many clients")
    
    if (isMaxClientsError) {
      return NextResponse.json(
        {
          error: {
            code: "MAX_CLIENTS_REACHED",
            message: "Database connection limit reached. Please wait a moment and try again.",
            status: 503, // Service Unavailable
          },
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch lobby data",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/lobby/[id]
 * Deletes a lobby if user is host and no participants exist
 */
export async function DELETE(
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

    // Get lobby with error handling
    let lobby
    try {
      const lobbyResult = await db
        .select()
        .from(lobbies)
        .where(eq(lobbies.id, id))
        .limit(1)
      
      lobby = lobbyResult[0]
    } catch (dbError: any) {
      console.error("Database error fetching lobby in DELETE API:", {
        lobbyId: id,
        error: dbError?.message,
        cause: dbError?.cause,
        query: dbError?.query,
        params: dbError?.params,
        stack: dbError?.stack,
      })
      
      // Check for max clients error
      const errorMessage = dbError?.message || dbError?.cause?.message || ""
      const isMaxClientsError =
        errorMessage.includes("MaxClientsInSessionMode") ||
        errorMessage.includes("max clients reached") ||
        errorMessage.includes("too many clients")
      
      if (isMaxClientsError) {
        return NextResponse.json(
          {
            error: {
              code: "MAX_CLIENTS_REACHED",
              message: "Database connection limit reached. Please wait a moment and try again.",
              status: 503,
            },
          },
          { status: 503 }
        )
      }
      
      // Re-throw to be caught by outer catch
      throw dbError
    }

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

    // Get user's database ID
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!dbUser || lobby.hostId !== dbUser.id) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Only the host can delete the lobby",
            status: 403,
          },
        },
        { status: 403 }
      )
    }

    // Check participant count (excluding host)
    const participants = await db
      .select()
      .from(lobbyParticipants)
      .where(eq(lobbyParticipants.lobbyId, id))

    // Only allow deletion if no participants (or only host)
    if (participants.length > 1) {
      return NextResponse.json(
        {
          error: {
            code: "CANNOT_DELETE",
            message: "Lobby cannot be deleted because it has participants",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Delete lobby (cascade will delete participants, songs, ratings)
    await db.delete(lobbies).where(eq(lobbies.id, id))

    return NextResponse.json(
      {
        success: true,
        message: "Lobby deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting lobby:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete lobby",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
