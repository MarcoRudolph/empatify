"use client"

import { useEffect, useState } from "react"
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
  const [participants, setParticipants] = useState(initialParticipants)
  const [songs, setSongs] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/lobby/${lobby.id}`)
        if (response.ok) {
          const data = await response.json()
          setParticipants(data.participants)
          setSongs(data.songs || [])
          setRatings(data.ratings || [])
          setLeaderboard(data.leaderboard || [])
        }
      } catch (error) {
        console.error("Error fetching lobby data:", error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [lobby.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            Lobby
          </h1>
          <p className="text-sm md:text-base text-neutral-600">
            {lobby.category || "Alle Kategorien"} • {lobby.maxRounds} Runden
          </p>
        </div>

        {/* Cards - Mobile: stacked, Desktop: grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* User List Card */}
          <div className="md:col-span-1">
            <UserListCard
              participants={participants}
              lobbyId={lobby.id}
              hostId={lobby.hostId}
            />
          </div>

          {/* Songs Card */}
          <div className="md:col-span-1 lg:col-span-2">
            <SongsCard
              lobby={lobby}
              participants={participants}
              songs={songs}
              ratings={ratings}
              currentUserId={currentUserId}
            />
          </div>

          {/* Leaderboard Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <LeaderboardCard 
              leaderboard={leaderboard} 
              hasScores={leaderboard.some(entry => entry.averageRating > 0)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

