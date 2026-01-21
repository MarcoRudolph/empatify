import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db, postgresClient } from "@/lib/db"
import { lobbies, lobbyParticipants, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { LobbyPageClient } from "./LobbyPageClient"

interface LobbyPageProps {
  params: Promise<{ id: string }>
}

/**
 * Lobby page - displays lobby with cards for UserList, Songs, and Leaderboard
 * URL: /lobby/{uuid}
 * This route is NOT internationalized (no locale prefix) as it's an invite link
 */
export default async function LobbyPage({ params }: LobbyPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If not authenticated, redirect to login with return URL
  if (authError || !user) {
    redirect(`/de/login?redirect=/lobby/${id}`)
  }

  // Get messages for default locale (German) to support translations
  const messages = await getMessages({ locale: routing.defaultLocale })

  try {
    // Get lobby (including gameMode)
    let lobby
    try {
      const lobbyResult = await db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbies)
        .where(eq(lobbies.id, id))
        .limit(1)
      
      lobby = lobbyResult[0]
    } catch (dbError: any) {
      console.error("Database error fetching lobby:", {
        lobbyId: id,
        error: dbError?.message,
        cause: dbError?.cause,
        query: dbError?.query,
        params: dbError?.params,
      })
      // Check if it's a connection error
      const errorMessage = dbError?.message || dbError?.cause?.message || ""
      if (errorMessage.includes("MaxClientsInSessionMode") || errorMessage.includes("max clients")) {
        // Return a user-friendly error page or redirect with error message
        redirect("/de/dashboard?error=connection_limit")
      }
      throw dbError
    }

    if (!lobby) {
      redirect("/de/dashboard")
    }

    // Get or create current user's database record
    let currentDbUserId: string | null = null
    const currentDbUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)
    
    if (currentDbUser.length === 0) {
      // Create user if doesn't exist
      const displayName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User"
      const [newUser] = await db
        .insert(users)
        .values({
          email: user.email!,
          name: displayName,
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
        .returning({ id: users.id })
      currentDbUserId = newUser.id
    } else {
      currentDbUserId = currentDbUser[0].id
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

    // Check if game is finished before adding new participants
    // Game is finished when ALL songs have been rated by ALL current participants
    const lobbySongs = await db
      .select({
        id: songs.id,
        suggestedBy: songs.suggestedBy,
        roundNumber: songs.roundNumber,
      })
      .from(songs)
      .where(eq(songs.lobbyId, id))

    const lobbyRatings = await db
      .select({
        songId: ratings.songId,
      })
      .from(ratings)
      .innerJoin(songs, eq(ratings.songId, songs.id))
      .where(eq(songs.lobbyId, id))

    let isGameFinished = false
    if (lobbySongs.length > 0 && participants.length > 1) {
      const songsPerRound = new Map<number, Set<string>>()
      lobbySongs.forEach((song) => {
        if (!songsPerRound.has(song.roundNumber)) {
          songsPerRound.set(song.roundNumber, new Set())
        }
        songsPerRound.get(song.roundNumber)!.add(song.suggestedBy)
      })

      const lastRoundParticipants = songsPerRound.get(lobby.maxRounds)
      const lastRoundComplete = lastRoundParticipants && lastRoundParticipants.size === participants.length

      const expectedRatingsPerSong = participants.length - 1
      const ratingsPerSong = new Map<string, number>()
      lobbyRatings.forEach((rating) => {
        const count = ratingsPerSong.get(rating.songId) || 0
        ratingsPerSong.set(rating.songId, count + 1)
      })

      const allSongsRated = lobbySongs.every((song) => {
        const ratingCount = ratingsPerSong.get(song.id) || 0
        return ratingCount >= expectedRatingsPerSong
      })

      if (lastRoundComplete && allSongsRated) {
        isGameFinished = true
      }
    }

    // Check if user is already a participant (using database ID)
    const isParticipant = currentDbUserId ? participants.some((p) => p.id === currentDbUserId) : false

    // If not a participant and game is NOT finished, add them
    if (!isParticipant && !isGameFinished) {
      // Ensure user exists in database
      let dbUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1)

      if (dbUser.length === 0) {
        const displayName =
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User"
        const [newUser] = await db
          .insert(users)
          .values({
            email: user.email!,
            name: displayName,
            avatarUrl: user.user_metadata?.avatar_url || null,
          })
          .returning()
        dbUser = [newUser]
      }

      // Use raw SQL to avoid Drizzle's default value handling issues
      await postgresClient`
        INSERT INTO lobby_participants (lobby_id, user_id)
        VALUES (${id}::uuid, ${dbUser[0].id}::uuid)
        ON CONFLICT (lobby_id, user_id) DO NOTHING
      `

      // Refetch participants
      const updatedParticipants = await db
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

      return (
        <NextIntlClientProvider messages={messages}>
          <LobbyPageClient
            lobby={{
              id: lobby.id,
              hostId: lobby.hostId,
              category: lobby.category,
              maxRounds: lobby.maxRounds,
              gameMode: lobby.gameMode || "multi-device",
              createdAt: lobby.createdAt.toISOString(),
            }}
            participants={updatedParticipants.map((p) => ({
              ...p,
              joinedAt: p.joinedAt.toISOString(),
            }))}
            currentUserId={currentDbUserId || ""}
            isViewer={false}
          />
        </NextIntlClientProvider>
      )
    }

    return (
      <NextIntlClientProvider messages={messages}>
        <LobbyPageClient
          lobby={{
            id: lobby.id,
            hostId: lobby.hostId,
            category: lobby.category,
            maxRounds: lobby.maxRounds,
            gameMode: lobby.gameMode || "multi-device",
            createdAt: lobby.createdAt.toISOString(),
          }}
          participants={participants.map((p) => ({
            ...p,
            joinedAt: p.joinedAt.toISOString(),
          }))}
          currentUserId={currentDbUserId || ""}
          isViewer={!isParticipant && isGameFinished}
        />
      </NextIntlClientProvider>
    )
  } catch (error: any) {
    console.error("Error loading lobby:", {
      lobbyId: id,
      error: error?.message,
      cause: error?.cause,
      query: error?.query,
      params: error?.params,
      fullError: error,
    })
    
    // Check for max clients error
    const errorMessage = error?.message || error?.cause?.message || ""
    const isMaxClientsError =
      errorMessage.includes("MaxClientsInSessionMode") ||
      errorMessage.includes("max clients reached") ||
      errorMessage.includes("too many clients")
    
    if (isMaxClientsError) {
      redirect("/de/dashboard?error=connection_limit")
    }
    
    redirect("/de/dashboard")
  }
}

