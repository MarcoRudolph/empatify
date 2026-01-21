"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import { UserListCard } from "./UserListCard"
import { SongsCard } from "./SongsCard"
import { LeaderboardCard } from "./LeaderboardCard"

interface Participant {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  joinedAt: string
}

interface Lobby {
  id: string
  hostId: string
  category: string | null
  maxRounds: number
  gameMode: string
  createdAt: string
}

interface LobbyPageClientProps {
  lobby: Lobby
  participants: Participant[]
  currentUserId: string
}

/**
 * Client component for the lobby page
 * Displays cards for UserList, Songs, and Leaderboard on mobile devices
 */
export function LobbyPageClient({
  lobby,
  participants: initialParticipants,
  currentUserId,
}: LobbyPageClientProps) {
  const router = useRouter()
  const t = useTranslations("common")
  const tDashboard = useTranslations("dashboard")
  const tLobby = useTranslations("lobby")
  const [participants, setParticipants] = useState(initialParticipants)
  const [songs, setSongs] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isGameFinished, setIsGameFinished] = useState(false)

  // Get locale from cookie or default to 'de'
  const getLocale = () => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      if (localeCookie) {
        return localeCookie.split('=')[1] || 'de'
      }
    }
    return 'de'
  }

  // Fetch lobby data immediately on mount and when returning from navigation
  const fetchLobbyData = useCallback(async () => {
    try {
      const response = await fetch(`/api/lobby/${lobby.id}`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants)
        setSongs(data.songs || [])
        setRatings(data.ratings || [])
        setLeaderboard(data.leaderboard || [])
        
        // Check if game is finished (must match Dashboard logic)
        // Game is finished when ALL songs have been rated by ALL participants (except the song creator)
        const songsData = data.songs || []
        const ratingsData = data.ratings || []
        const participantsData = data.participants || []
        
        let isFinished = false
        
        if (songsData.length > 0 && participantsData.length > 1) {
          // Group songs by round
          const songsPerRound = new Map<number, Set<string>>()
          songsData.forEach((song: any) => {
            if (!songsPerRound.has(song.roundNumber)) {
              songsPerRound.set(song.roundNumber, new Set())
            }
            songsPerRound.get(song.roundNumber)!.add(song.suggestedBy)
          })
          
          // Check if the last round (maxRounds) has songs from all participants
          const lastRoundParticipants = songsPerRound.get(lobby.maxRounds)
          const lastRoundComplete = lastRoundParticipants && lastRoundParticipants.size === participantsData.length
          
          // Calculate expected number of ratings
          // For each song: (number of participants - 1) ratings
          // (everyone except the song creator should rate it)
          const expectedRatingsPerSong = participantsData.length - 1
          const totalExpectedRatings = songsData.length * expectedRatingsPerSong
          
          // Create a map of actual ratings per song
          const ratingsPerSong = new Map<string, number>()
          ratingsData.forEach((rating: any) => {
            const count = ratingsPerSong.get(rating.songId) || 0
            ratingsPerSong.set(rating.songId, count + 1)
          })
          
          // Check if ALL songs have been rated by ALL participants (except creator)
          const allSongsRated = songsData.every((song: any) => {
            const ratingCount = ratingsPerSong.get(song.id) || 0
            return ratingCount >= expectedRatingsPerSong
          })
          
          // Game is finished if:
          // - Last round has all participants' songs
          // - ALL songs have been rated by ALL participants (except creator)
          if (lastRoundComplete && allSongsRated) {
            isFinished = true
          }
          
          // Debug logging
          console.log("🎮 Game Finished Check:", {
            isFinished,
            lastRoundComplete,
            allSongsRated,
            maxRounds: lobby.maxRounds,
            lastRoundParticipantCount: lastRoundParticipants?.size || 0,
            expectedParticipants: participantsData.length,
            totalSongs: songsData.length,
            totalRatings: ratingsData.length,
            expectedRatingsPerSong,
            totalExpectedRatings,
            actualRatings: ratingsData.length,
            ratingsPerSong: Array.from(ratingsPerSong.entries()).map(([songId, count]) => ({
              songId,
              count,
              expected: expectedRatingsPerSong
            })),
            songsPerRound: Array.from(songsPerRound.entries()).map(([round, participants]) => ({
              round,
              participantCount: participants.size
            }))
          })
        }
        
        setIsGameFinished(isFinished)
      }
    } catch (error) {
      console.error("Error fetching lobby data:", error)
    }
  }, [lobby.id, lobby.maxRounds])

  // Fetch immediately on mount
  useEffect(() => {
    fetchLobbyData()
  }, [fetchLobbyData])

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(fetchLobbyData, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [fetchLobbyData])

  const handleBackToDashboard = () => {
    const locale = getLocale()
    router.push(`/${locale}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 p-4 md:p-8">
      <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Back Button */}
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200 mb-4 group"
          aria-label={t("back")}
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>{t("back")} {tDashboard("title")}</span>
        </button>

        {/* Header */}
        <div className="text-center">
          {isGameFinished ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
                🎮 {tLobby("gameResults")} 🎮
              </h1>
              {leaderboard.length > 0 && (
                <h2 
                  className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Pacifico', cursive" }}
                >
                  🏆 Congratulations, {leaderboard[0].name}! 🏆
                </h2>
              )}
              <p className="text-sm md:text-base text-neutral-600">
                {lobby.category || "Alle Kategorien"} • {lobby.maxRounds} Runden
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                Lobby
              </h1>
              <p className="text-sm md:text-base text-neutral-600">
                {lobby.category || "Alle Kategorien"} • {lobby.maxRounds} Runden
              </p>
            </>
          )}
        </div>

        {/* Cards - Mobile: dynamic order based on game state, Desktop: fixed grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Leaderboard Card 
              Mobile: order-1 when finished, order-2 when running
              Desktop: always same position (order-3)
          */}
          <div className={`md:col-span-2 lg:col-span-4 ${isGameFinished ? 'order-1 md:order-3' : 'order-2 md:order-3'}`}>
            <LeaderboardCard 
              leaderboard={leaderboard} 
              hasScores={leaderboard.some(entry => entry.averageRating > 0)}
              isGameFinished={isGameFinished}
            />
          </div>

          {/* Songs Card 
              Mobile: order-2 when finished, order-1 when running
              Desktop: always same position (order-2)
          */}
          <div className={`md:col-span-1 lg:col-span-3 ${isGameFinished ? 'order-2 md:order-2' : 'order-1 md:order-2'}`}>
            <SongsCard
              lobby={lobby}
              participants={participants}
              songs={songs}
              ratings={ratings}
              currentUserId={currentUserId}
              isGameFinished={isGameFinished}
            />
          </div>

          {/* User List Card (Players)
              Mobile: order-3 always (bottom)
              Desktop: always same position (order-1)
          */}
          <div className="order-3 md:order-1 md:col-span-1">
            <UserListCard
              participants={participants}
              lobbyId={lobby.id}
              hostId={lobby.hostId}
              currentUserId={currentUserId}
              isGameFinished={isGameFinished}
              winner={isGameFinished && leaderboard.length > 0 ? leaderboard[0] : null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

