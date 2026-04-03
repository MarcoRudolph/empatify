// src/app/[locale]/dashboard/fetchDashboardData.ts
import { db } from '@/lib/db'
import { users, lobbies, lobbyParticipants, songs, ratings, friends } from '@/lib/db/schema'
import { eq, or, desc, and, inArray } from 'drizzle-orm'

export interface TopPlayer {
  userId: string
  name: string
  avatarUrl: string | null
  averageRating: number
}

export interface EnrichedLobby {
  id: string
  hostId: string
  category: string | null
  maxRounds: number
  gameMode: string
  createdAt: Date
  averageRating: number
  status: 'not_started' | 'running' | 'finished'
  currentRound: number
  needsSongSelection: boolean
  participantCount: number
  topPlayers: TopPlayer[]
  roundToRate: number | null
}

export interface FriendUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface MiniStats {
  gamesPlayed: number
  averageRating: number
  songsSuggested: number
}

export interface DashboardData {
  userLobbies: EnrichedLobby[]
  userFriends: FriendUser[]
  miniStats: MiniStats
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // ── Round 1: 4 independent queries in parallel ────────────────────────────
  const [hostedLobbies, participantLobbyRows, friendships, userSongsForStats] =
    await Promise.all([
      // Lobbies where user is host
      db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbies)
        .where(eq(lobbies.hostId, userId))
        .orderBy(desc(lobbies.createdAt)),

      // Lobbies where user is a participant (not necessarily host)
      db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbyParticipants)
        .innerJoin(lobbies, eq(lobbyParticipants.lobbyId, lobbies.id))
        .where(eq(lobbyParticipants.userId, userId))
        .orderBy(desc(lobbies.createdAt)),

      // All friendships involving this user
      db
        .select({ userId: friends.userId, friendId: friends.friendId })
        .from(friends)
        .where(or(eq(friends.userId, userId), eq(friends.friendId, userId))),

      // Songs suggested by this user (for stats)
      db
        .select({ id: songs.id })
        .from(songs)
        .where(eq(songs.suggestedBy, userId)),
    ])

  // Deduplicate lobbies (user may be both host and participant)
  const lobbyMap = new Map<string, (typeof hostedLobbies)[0]>()
  hostedLobbies.forEach((l) => lobbyMap.set(l.id, l))
  participantLobbyRows.forEach((l) => { if (!lobbyMap.has(l.id)) lobbyMap.set(l.id, l) })
  const userLobbiesRaw = Array.from(lobbyMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const lobbyIds = userLobbiesRaw.map((l) => l.id)

  // Derive IDs needed for Round 2
  const friendIds = friendships.map((f) => (f.userId === userId ? f.friendId : f.userId))
  const statSongIds = userSongsForStats.map((s) => s.id)

  // ── Round 2: 4 bulk queries in parallel ──────────────────────────────────
  const [allSongs, allParticipants, friendDetails, statRatings] = await Promise.all([
    // All songs across all user lobbies
    lobbyIds.length > 0
      ? db
          .select({
            id: songs.id,
            lobbyId: songs.lobbyId,
            roundNumber: songs.roundNumber,
            suggestedBy: songs.suggestedBy,
          })
          .from(songs)
          .where(inArray(songs.lobbyId, lobbyIds))
      : Promise.resolve([] as Array<{ id: string; lobbyId: string; roundNumber: number; suggestedBy: string }>),

    // All participants with user details across all lobbies
    lobbyIds.length > 0
      ? db
          .select({
            lobbyId: lobbyParticipants.lobbyId,
            userId: lobbyParticipants.userId,
            userName: users.name,
            userAvatarUrl: users.avatarUrl,
          })
          .from(lobbyParticipants)
          .innerJoin(users, eq(lobbyParticipants.userId, users.id))
          .where(inArray(lobbyParticipants.lobbyId, lobbyIds))
      : Promise.resolve([] as Array<{ lobbyId: string; userId: string; userName: string; userAvatarUrl: string | null }>),

    // Friend user details
    friendIds.length > 0
      ? db
          .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
          .from(users)
          .where(inArray(users.id, friendIds))
      : Promise.resolve([] as FriendUser[]),

    // Ratings for user's own songs (for mini stats)
    statSongIds.length > 0
      ? db
          .select({ ratingValue: ratings.ratingValue })
          .from(ratings)
          .where(inArray(ratings.songId, statSongIds))
      : Promise.resolve([] as Array<{ ratingValue: number }>),
  ])

  // ── Round 3: ratings for all lobby songs (depends on allSongs from Round 2) ──
  const allSongIds = allSongs.map((s) => s.id)
  const allRatings =
    allSongIds.length > 0
      ? await db
          .select({
            songId: ratings.songId,
            ratingValue: ratings.ratingValue,
            givenBy: ratings.givenBy,
          })
          .from(ratings)
          .where(inArray(ratings.songId, allSongIds))
      : []

  // ── Group in JS (zero extra DB calls) ────────────────────────────────────
  const songsByLobby = new Map<string, typeof allSongs>()
  allSongs.forEach((s) => {
    const arr = songsByLobby.get(s.lobbyId) ?? []
    arr.push(s)
    songsByLobby.set(s.lobbyId, arr)
  })

  const participantsByLobby = new Map<string, typeof allParticipants>()
  allParticipants.forEach((p) => {
    const arr = participantsByLobby.get(p.lobbyId) ?? []
    arr.push(p)
    participantsByLobby.set(p.lobbyId, arr)
  })

  const ratingsBySongId = new Map<string, typeof allRatings>()
  allRatings.forEach((r) => {
    const arr = ratingsBySongId.get(r.songId) ?? []
    arr.push(r)
    ratingsBySongId.set(r.songId, arr)
  })

  function enrichLobby(lobby: (typeof userLobbiesRaw)[0]): EnrichedLobby {
    const lobbySongs = songsByLobby.get(lobby.id) ?? []
    const lobbyParticipantsList = participantsByLobby.get(lobby.id) ?? []
    const lobbyRatings = lobbySongs.flatMap((s) => ratingsBySongId.get(s.id) ?? [])

    const averageRating =
      lobbyRatings.length > 0
        ? lobbyRatings.reduce((sum, r) => sum + r.ratingValue, 0) / lobbyRatings.length
        : 0

    const participantCount = lobbyParticipantsList.length

    // Leaderboard
    const leaderboardMap = new Map<
      string,
      { userId: string; name: string; avatarUrl: string | null; totalRating: number; count: number }
    >()
    lobbyParticipantsList.forEach((p) => {
      leaderboardMap.set(p.userId, {
        userId: p.userId,
        name: p.userName,
        avatarUrl: p.userAvatarUrl,
        totalRating: 0,
        count: 0,
      })
    })
    lobbySongs.forEach((song) => {
      const songRatings = ratingsBySongId.get(song.id) ?? []
      songRatings.forEach((r) => {
        const entry = leaderboardMap.get(song.suggestedBy)
        if (entry) {
          entry.totalRating += r.ratingValue
          entry.count++
        }
      })
    })
    const leaderboard = Array.from(leaderboardMap.values())
      .map((e) => ({
        userId: e.userId,
        name: e.name,
        avatarUrl: e.avatarUrl,
        averageRating: e.count > 0 ? e.totalRating / e.count : 0,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)

    const topPlayers =
      participantCount >= 3
        ? leaderboard.slice(0, 3)
        : participantCount >= 2
        ? leaderboard.slice(0, 2)
        : []

    // roundToRate
    let roundToRate: number | null = null
    if (lobbySongs.length > 0 && participantCount > 1) {
      const userRatingSet = new Set(
        lobbyRatings.filter((r) => r.givenBy === userId).map((r) => r.songId)
      )
      for (let round = 1; round <= lobby.maxRounds; round++) {
        const roundSongs = lobbySongs.filter((s) => s.roundNumber === round)
        const songsToRate = roundSongs.filter(
          (s) => !userRatingSet.has(s.id) && s.suggestedBy !== userId
        )
        if (songsToRate.length > 0) {
          roundToRate = round
          break
        }
      }
    }

    // Status + currentRound
    let currentRound = 1
    let status: 'not_started' | 'running' | 'finished' = 'not_started'
    let needsSongSelection = false

    if (lobbySongs.length === 0 || participantCount <= 1) {
      status = 'not_started'
      currentRound = 1
      needsSongSelection = true
    } else {
      status = 'running'
      for (let round = 1; round <= lobby.maxRounds; round++) {
        const roundSongs = lobbySongs.filter((s) => s.roundNumber === round)
        const participantsWithSongs = new Set(roundSongs.map((s) => s.suggestedBy))

        if (!participantsWithSongs.has(userId)) {
          currentRound = round
          needsSongSelection = true
          break
        }

        if (participantsWithSongs.size === participantCount) {
          if (round === lobby.maxRounds) {
            const expectedPerSong = participantCount - 1
            const ratingsPerSong = new Map<string, number>()
            lobbyRatings.forEach((r) => {
              ratingsPerSong.set(r.songId, (ratingsPerSong.get(r.songId) ?? 0) + 1)
            })
            const allRated = lobbySongs.every(
              (s) => (ratingsPerSong.get(s.id) ?? 0) >= expectedPerSong
            )
            status = allRated ? 'finished' : 'running'
            currentRound = round
            needsSongSelection = false
            break
          } else {
            currentRound = round + 1
            const nextSongs = lobbySongs.filter((s) => s.roundNumber === round + 1)
            const nextParticipants = new Set(nextSongs.map((s) => s.suggestedBy))
            if (!nextParticipants.has(userId)) {
              needsSongSelection = true
              break
            }
          }
        } else {
          currentRound = round
          if (!participantsWithSongs.has(userId)) needsSongSelection = true
          break
        }
      }

      // Final finished check
      if (
        status === 'running' &&
        (currentRound > lobby.maxRounds ||
          (currentRound === lobby.maxRounds && !needsSongSelection))
      ) {
        const expectedPerSong = participantCount - 1
        const ratingsPerSong = new Map<string, number>()
        lobbyRatings.forEach((r) => {
          ratingsPerSong.set(r.songId, (ratingsPerSong.get(r.songId) ?? 0) + 1)
        })
        if (lobbySongs.every((s) => (ratingsPerSong.get(s.id) ?? 0) >= expectedPerSong)) {
          status = 'finished'
          needsSongSelection = false
        }
      }
    }

    return {
      ...lobby,
      averageRating,
      status,
      currentRound,
      needsSongSelection,
      participantCount,
      topPlayers,
      roundToRate,
    }
  }

  const userLobbies = userLobbiesRaw.map(enrichLobby)

  // Mini stats
  const finishedLobbies = userLobbies.filter((l) => l.status === 'finished')
  const totalRatingSum = statRatings.reduce((sum, r) => sum + r.ratingValue, 0)
  const miniStats: MiniStats = {
    gamesPlayed: finishedLobbies.length,
    averageRating: statRatings.length > 0 ? totalRatingSum / statRatings.length : 0,
    songsSuggested: userSongsForStats.length,
  }

  return {
    userLobbies,
    userFriends: friendDetails as FriendUser[],
    miniStats,
  }
}
