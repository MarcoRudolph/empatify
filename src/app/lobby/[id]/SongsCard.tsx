"use client"

import { useState } from "react"
import { Music, Play, Loader2 } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

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

interface Song {
  id: string
  spotifyTrackId: string
  suggestedBy: string
  suggestedByName: string
  roundNumber: number
  createdAt: string
}

interface Rating {
  songId: string
  givenBy: string
  ratingValue: number
}

interface SongsCardProps {
  lobby: Lobby
  participants: Participant[]
  songs: Song[]
  ratings: Rating[]
  currentUserId: string
}

/**
 * Songs Card with Round Dropdown and Table
 * Displays songs for each round with ratings and play buttons
 */
export function SongsCard({
  lobby,
  participants,
  songs,
  ratings,
  currentUserId,
}: SongsCardProps) {
  const t = useTranslations("lobby")
  const tGame = useTranslations("game")
  const [selectedRound, setSelectedRound] = useState(1)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)

  // Get songs for selected round
  const roundSongs = songs.filter((song) => song.roundNumber === selectedRound)

  // Create table rows: one per participant
  const tableRows = participants.map((participant) => {
    const participantSong = roundSongs.find(
      (s) => s.suggestedBy === participant.id
    )
    const songRatings = participantSong
      ? ratings.filter((r) => r.songId === participantSong.id)
      : []
    const averageRating =
      songRatings.length > 0
        ? songRatings.reduce((sum, r) => sum + r.ratingValue, 0) /
          songRatings.length
        : null

    return {
      participant,
      song: participantSong,
      averageRating,
      ratings: songRatings,
    }
  })

  // Debug: Log IDs to check matching (after tableRows is created)
  if (process.env.NODE_ENV === "development") {
    console.log("SongsCard Debug:", {
      gameMode: lobby.gameMode,
      currentUserId,
      participants: participants.map(p => ({ id: p.id, name: p.name })),
      tableRows: tableRows.map(row => ({
        participantId: row.participant.id,
        participantName: row.participant.name,
        hasSong: !!row.song,
        isCurrentUser: row.participant.id === currentUserId,
        willShowButton: lobby.gameMode === "multi-device" && !row.song && currentUserId && row.participant.id === currentUserId,
      })),
    })
  }

  const handlePlay = async (spotifyTrackId: string) => {
    setPlayingTrackId(spotifyTrackId)
    // TODO: Implement Spotify playback
    // This would require Spotify Web Playback SDK
    setTimeout(() => setPlayingTrackId(null), 2000)
  }

  return (
    <MagicCard
      className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
      gradientFrom="#FF6B00"
      gradientTo="#E65F00"
      gradientSize={400}
    >
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Music className="size-5 md:size-6 text-primary-500" />
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900">
          {tGame("song")}s
        </h2>
      </div>

      {/* Round Dropdown */}
      <div className="mb-4">
        <label
          htmlFor="round-select"
          className="block text-xs md:text-sm font-medium text-neutral-900 mb-2"
        >
          {t("round")}
        </label>
        <select
          id="round-select"
          value={selectedRound}
          onChange={(e) => setSelectedRound(Number(e.target.value))}
          className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200"
        >
          {Array.from({ length: lobby.maxRounds }, (_, i) => i + 1).map(
            (round) => (
              <option key={round} value={round}>
                {t("round")} {round} {t("of")} {lobby.maxRounds}
              </option>
            )
          )}
        </select>
      </div>

      {/* Songs Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-300">
              <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {tGame("users")}
              </th>
              <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {tGame("song")}
              </th>
              <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {t("averageRating")}
              </th>
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {tGame("playSong")}
              </th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr
                key={row.participant.id}
                className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                {/* Username */}
                <td className="py-3 px-2 md:px-4">
                  <div className="flex items-center gap-2">
                    {row.participant.avatarUrl ? (
                      <img
                        src={row.participant.avatarUrl}
                        alt={row.participant.name}
                        className="size-6 md:size-8 rounded-full"
                      />
                    ) : (
                      <div className="size-6 md:size-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-xs">
                        {row.participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs md:text-sm font-medium text-neutral-900">
                      {row.participant.name}
                    </span>
                  </div>
                </td>

                {/* Song */}
                <td className="py-3 px-2 md:px-4">
                  {row.song ? (
                    <div className="text-xs md:text-sm text-neutral-900">
                      {/* TODO: Fetch song details from Spotify API */}
                      <div className="font-medium">
                        {row.song.spotifyTrackId}
                      </div>
                      <div className="text-neutral-500 text-xs">
                        {row.song.suggestedByName}
                      </div>
                    </div>
                  ) : (() => {
                    // Debug: Log why button might not show
                    const isMultiDevice = lobby.gameMode === "multi-device"
                    const isCurrentUser = currentUserId && row.participant.id === currentUserId
                    const shouldShowButton = isMultiDevice && isCurrentUser
                    
                    if (process.env.NODE_ENV === "development") {
                      console.log(`Button check for "${row.participant.name}":`, {
                        hasSong: !!row.song,
                        gameMode: lobby.gameMode,
                        isMultiDevice,
                        participantId: row.participant.id,
                        currentUserId,
                        idsMatch: row.participant.id === currentUserId,
                        isCurrentUser,
                        shouldShowButton,
                        condition: `gameMode=${lobby.gameMode} === "multi-device" && participantId=${row.participant.id} === currentUserId=${currentUserId}`,
                      })
                    }
                    
                    return shouldShowButton ? (
                      // Current user hasn't selected a song - show button (only in multi-device mode)
                      <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log("Select song button clicked for user:", row.participant.id)
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                        const callbackUrl = `${window.location.origin}/api/spotify/song-callback?lobbyId=${lobby.id}&roundNumber=${selectedRound}`
                        
                        if (isMobile) {
                          // Try to open Spotify app, fallback to web
                          window.location.href = `spotify://search`
                          // Fallback after 2 seconds
                          setTimeout(() => {
                            window.location.href = `https://open.spotify.com/search?callback=${encodeURIComponent(callbackUrl)}`
                          }, 2000)
                        } else {
                          // Desktop: Open song selection page
                          window.location.href = `/lobby/${lobby.id}/select-song?round=${selectedRound}`
                        }
                      }}
                      className="px-3 py-1.5 text-xs md:text-sm font-medium bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760] transition-colors duration-200 shadow-sm cursor-pointer"
                      type="button"
                    >
                      {t("selectSong")}
                    </button>
                    ) : (
                      <div className="relative text-xs md:text-sm text-neutral-400 italic">
                        <span className="opacity-30 select-none">{t("waitingForSong")}</span>
                      </div>
                    )
                  })()}
                </td>

                {/* Rating */}
                <td className="py-3 px-2 md:px-4">
                  {row.averageRating !== null ? (
                    <span className="text-xs md:text-sm font-medium text-neutral-900">
                      {row.averageRating.toFixed(1)} / 10
                    </span>
                  ) : (
                    <span className="text-xs md:text-sm text-neutral-400">
                      -
                    </span>
                  )}
                </td>

                {/* Play Button */}
                <td className="py-3 px-2 md:px-4 text-center">
                  {row.song ? (
                    <button
                      onClick={() => handlePlay(row.song!.spotifyTrackId)}
                      disabled={playingTrackId === row.song.spotifyTrackId}
                      className={cn(
                        "inline-flex items-center justify-center size-8 md:size-10 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        playingTrackId === row.song.spotifyTrackId &&
                          "bg-primary-600"
                      )}
                    >
                      {playingTrackId === row.song.spotifyTrackId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-3 md:size-4 ml-0.5" />
                      )}
                    </button>
                  ) : (
                    <span className="text-neutral-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MagicCard>
  )
}

