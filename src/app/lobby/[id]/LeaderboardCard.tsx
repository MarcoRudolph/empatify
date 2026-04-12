"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Award, Share2, Music, Loader2 } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { MoodCard } from "@/components/ui/MoodCard"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useTranslations } from "next-intl"

interface LeaderboardEntry {
  userId: string
  name: string
  avatarUrl: string | null
  averageRating: number
  songsSuggested: number
  bestSong: {
    name: string
    artist: string
    rating: number
  } | null
}

interface LeaderboardCardProps {
  lobbyId: string
  leaderboard: LeaderboardEntry[]
  hasScores?: boolean // Whether any rounds have been completed with ratings
  isGameFinished?: boolean
}

/**
 * Leaderboard Card
 * Displays player rankings based on average ratings
 */
export function LeaderboardCard({ lobbyId, leaderboard, hasScores = false, isGameFinished = false }: LeaderboardCardProps) {
  const t = useTranslations("lobby")
  const tGame = useTranslations("game")
  const [moodData, setMoodData] = useState<{ collective_mood: string; profiles: Record<string, string>; next_prompt: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!isGameFinished) return
    const songsForMood = leaderboard
      .filter(e => e.bestSong)
      .map(e => ({ playerName: e.name, trackName: e.bestSong!.name, artist: e.bestSong!.artist ?? "" }))
    if (songsForMood.length === 0) return

    fetch("/api/ai/game-mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: songsForMood }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => data && !data.error && setMoodData(data))
      .catch(() => null)
  }, [isGameFinished, leaderboard])

  const handleExportPlaylist = async () => {
    try {
      setIsExporting(true)
      const res = await fetch("/api/spotify/playlist/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId }),
      })

      const data = await res.json()

      if (res.ok && data.playlistUrl) {
        window.open(data.playlistUrl, "_blank")
      } else if (data.code === "SPOTIFY_NOT_LINKED") {
        alert("Please link your Spotify account in settings to export playlists.")
      } else {
        alert(data.error || "Failed to create playlist")
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("An unexpected error occurred")
    } finally {
      setIsExporting(false)
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="size-5 md:size-6 text-yellow-500" />
    if (index === 1) return <Medal className="size-5 md:size-6 text-gray-400" />
    if (index === 2) return <Award className="size-5 md:size-6 text-orange-600" />
    return (
      <span className="size-6 md:size-8 rounded-full bg-neutral-300 flex items-center justify-center text-xs md:text-sm font-bold text-neutral-900">
        {index + 1}
      </span>
    )
  }

  // Check if there are no scores (no ratings yet)
  const hasAnyRatings = leaderboard.some(entry => entry.averageRating > 0)
  const showNoScores = !hasScores && !hasAnyRatings

  if (showNoScores || leaderboard.length === 0) {
    return (
      <MagicCard
        className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
        gradientFrom="var(--color-primary-500)"
        gradientTo="var(--color-primary-600)"
        gradientSize={400}
      >
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Trophy className="size-5 md:size-6 text-primary-500" />
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900">
            Leaderboard
          </h2>
        </div>
        
        {/* No Scores Empty State */}
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-20 md:size-24 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 blur-xl"></div>
            </div>
            <Trophy className="relative size-16 md:size-20 text-neutral-300" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-neutral-700 mb-2">
            {t("noScores")}
          </h3>
          <p className="text-sm md:text-base text-neutral-500 text-center max-w-sm">
            {t("noScoresDescription")}
          </p>
        </div>
      </MagicCard>
    )
  }

  return (
    <MagicCard
      className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
      gradientFrom="var(--color-primary-500)"
      gradientTo="var(--color-primary-600)"
      gradientSize={400}
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Trophy className="size-5 md:size-6 text-primary-500" />
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900">
            Leaderboard
          </h2>
        </div>

        {isGameFinished && (
          <ShimmerButton
            onClick={handleExportPlaylist}
            disabled={isExporting}
            background="var(--color-accent-spotify)"
            shimmerColor="var(--color-neutral-900)"
            borderRadius="9999px"
            className="h-10 px-4 flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin text-neutral-900" />
            ) : (
              <Music className="size-4 text-neutral-900 fill-neutral-900" />
            )}
            <span className="font-bold text-sm text-neutral-900 whitespace-nowrap">
              {isExporting ? "Exporting..." : "Export as Playlist"}
            </span>
          </ShimmerButton>
        )}
      </div>

      <div className="space-y-2 md:space-y-3">
        {leaderboard.map((entry, index) => (
          <div key={entry.userId}>
            {/* Winner Badge - Only for first place when game is finished */}
            {index === 0 && isGameFinished && (
              <div className="text-center mb-2">
                <h3 
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent animate-pulse inline-block"
                  style={{ fontFamily: "'Pacifico', cursive" }}
                >
                  👑 Winner 👑
                </h3>
              </div>
            )}
            
            <div
              className={`
                flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all
                ${
                  index === 0
                    ? "bg-yellow-400/10 border-yellow-400/30"
                    : index === 1
                    ? "bg-white/5 border-white/15"
                    : index === 2
                    ? "bg-orange-400/10 border-orange-400/30"
                    : "bg-white/5 border-white/10"
                }
              `}
              style={
                index === 0 && isGameFinished
                  ? { boxShadow: '0 0 20px rgba(234, 179, 8, 0.5)', border: '2px solid #fbbf24' }
                  : undefined
              }
            >
              {/* Rank Icon */}
              <div className="shrink-0">{getRankIcon(index)}</div>

            {/* Avatar */}
            {entry.avatarUrl ? (
              <img
                src={entry.avatarUrl}
                alt={entry.name}
                className="size-8 md:size-10 rounded-full"
              />
            ) : (
              <div className="size-8 md:size-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                {entry.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name, Best Song, and Rating - Horizontal Layout */}
            <div className="flex-1 min-w-0 flex items-center gap-4 md:gap-6">
              {/* Username - Fixed width for vertical alignment */}
              <div className="w-24 md:w-32 shrink-0">
                <p className="font-medium text-sm md:text-base truncate text-neutral-900">
                  {entry.name}
                </p>
              </div>

              {/* Best Song */}
              {entry.bestSong ? (
                <div className="flex-1 min-w-0 text-xs md:text-sm">
                  <span className="font-medium text-neutral-500">{t("bestSong")}: </span>
                  <span className="text-neutral-900">{entry.bestSong.name}</span>
                  {entry.bestSong.artist && (
                    <span className="text-neutral-400"> - {entry.bestSong.artist}</span>
                  )}
                  <span className="ml-2 text-neutral-500">
                    ({entry.bestSong.rating.toFixed(1)}/10)
                  </span>
                </div>
              ) : (
                <div className="flex-1 min-w-0"></div>
              )}

              {/* Average Rating */}
              <div className="shrink-0 text-right">
                <p className="text-lg md:text-xl font-bold text-neutral-900">
                  {entry.averageRating > 0 ? entry.averageRating.toFixed(1) : "—"}
                </p>
                <p className="text-xs md:text-sm text-neutral-400">/ 10</p>
              </div>
            </div>
            </div>
          </div>
        ))}
      </div>

      {moodData && (
        <div className="mt-4">
          <MoodCard
            collectiveMood={moodData.collective_mood}
            profiles={moodData.profiles}
            nextPrompt={moodData.next_prompt}
          />
        </div>
      )}
    </MagicCard>
  )
}


