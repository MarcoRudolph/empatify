import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db, postgresClient } from "@/lib/db"
import { lobbies, lobbyParticipants, users, songs, ratings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { LobbyPageClient } from "@/app/lobby/[id]/LobbyPageClient"

interface LobbyPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function LocalizedLobbyPage({ params }: LobbyPageProps) {
  const { locale, id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/login?redirect=/${locale}/lobby/${id}`)
  }

  const messages = await getMessages({ locale })

  try {
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
      const errorMessage = dbError?.message || dbError?.cause?.message || ""
      if (errorMessage.includes("MaxClientsInSessionMode") || errorMessage.includes("max clients")) {
        redirect(`/${locale}/dashboard?error=connection_limit`)
      }
      throw dbError
    }

    if (!lobby) {
      redirect(`/${locale}/dashboard`)
    }

    let currentDbUserId: string | null = null
    const currentDbUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (currentDbUser.length === 0) {
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

    const isParticipant = currentDbUserId ? participants.some((p) => p.id === currentDbUserId) : false

    if (!isParticipant && !isGameFinished) {
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

      await postgresClient`
        INSERT INTO lobby_participants (lobby_id, user_id)
        VALUES (${id}::uuid, ${dbUser[0].id}::uuid)
        ON CONFLICT (lobby_id, user_id) DO NOTHING
      `

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

    const errorMessage = error?.message || error?.cause?.message || ""
    const isMaxClientsError =
      errorMessage.includes("MaxClientsInSessionMode") ||
      errorMessage.includes("max clients reached") ||
      errorMessage.includes("too many clients")

    if (isMaxClientsError) {
      redirect(`/${locale}/dashboard?error=connection_limit`)
    }

    redirect(`/${locale}/dashboard`)
  }
}
