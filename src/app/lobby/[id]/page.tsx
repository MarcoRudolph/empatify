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
    const [lobby] = await db
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

    if (!lobby) {
      redirect("/de/dashboard")
    }

    // Get or create current user's database record
    let currentDbUserId: string | null = null
    let currentDbUser = await db
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

    // Check if user is already a participant (using database ID)
    const isParticipant = currentDbUserId ? participants.some((p) => p.id === currentDbUserId) : false

    // If not a participant, add them
    if (!isParticipant) {
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
            createdAt: lobby.createdAt.toISOString(),
          }}
          participants={participants.map((p) => ({
            ...p,
            joinedAt: p.joinedAt.toISOString(),
          }))}
          currentUserId={user.id}
        />
      </NextIntlClientProvider>
    )
  } catch (error) {
    console.error("Error loading lobby:", error)
    redirect("/de/dashboard")
  }
}

