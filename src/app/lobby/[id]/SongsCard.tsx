"use client"

import { useState, useEffect, useRef } from "react"
import { Music, Play, Loader2, Plus, Edit2, Trash2, Star, X } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"

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

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  external_urls: {
    spotify: string
  }
  duration_ms: number
}

interface SongsCardProps {
  lobby: Lobby
  participants: Participant[]
  songs: Song[]
  ratings: Rating[]
  currentUserId: string
  isGameFinished?: boolean
}

/**
 * Songs Card with Round Dropdown and Table
 * Displays songs for each round with ratings and play buttons
 * Improved UX with prominent add button and song details
 */
export function SongsCard({
  lobby,
  participants,
  songs,
  ratings,
  currentUserId,
  isGameFinished = false,
}: SongsCardProps) {
  const t = useTranslations("lobby")
  const tGame = useTranslations("game")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize selectedRound from URL parameter if present, otherwise default to 1
  const initialRound = searchParams.get("round") 
    ? parseInt(searchParams.get("round") || "1", 10)
    : 1
  const [selectedRound, setSelectedRound] = useState(initialRound)
  
  // Update selectedRound when URL parameter changes
  useEffect(() => {
    const roundParam = searchParams.get("round")
    if (roundParam) {
      const round = parseInt(roundParam, 10)
      if (!isNaN(round) && round >= 1 && round <= lobby.maxRounds) {
        setSelectedRound(round)
      }
    }
  }, [searchParams, lobby.maxRounds])
  const [trackDetails, setTrackDetails] = useState<Record<string, SpotifyTrack>>({})
  const [loadingTracks, setLoadingTracks] = useState<Set<string>>(new Set())
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null)
  const [ratingSongId, setRatingSongId] = useState<string | null>(null)
  const [currentRating, setCurrentRating] = useState<number | null>(null)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const trackDetailsRef = useRef<Record<string, SpotifyTrack>>({})

  // Keep ref in sync with state
  useEffect(() => {
    trackDetailsRef.current = trackDetails
  }, [trackDetails])

  // Get songs for selected round
  const roundSongs = songs.filter((song) => song.roundNumber === selectedRound)

  // Fetch track details for songs that don't have details yet
  useEffect(() => {
    const fetchTrackDetails = async () => {
      const tracksToFetch = roundSongs.filter(
        (song) => !trackDetailsRef.current[song.spotifyTrackId] && !loadingTracks.has(song.spotifyTrackId)
      )

      if (tracksToFetch.length === 0) return

      for (const song of tracksToFetch) {
        setLoadingTracks((prev) => new Set(prev).add(song.spotifyTrackId))
        try {
          const response = await fetch(`/api/spotify/track/${song.spotifyTrackId}`)
          const data = await response.json()
          
          if (response.ok) {
            setTrackDetails((prev) => ({
              ...prev,
              [song.spotifyTrackId]: data,
            }))
          } else if (data.error?.code === "TOKEN_EXPIRED") {
            // Automatically unlink expired token
            try {
              await fetch("/api/spotify/unlink", { method: "DELETE" })
              console.log("Expired Spotify token automatically unlinked")
            } catch (unlinkError) {
              console.error("Error unlinking expired token:", unlinkError)
            }
          }
        } catch (error) {
          console.error(`Error fetching track ${song.spotifyTrackId}:`, error)
        } finally {
          setLoadingTracks((prev) => {
            const newSet = new Set(prev)
            newSet.delete(song.spotifyTrackId)
            return newSet
          })
        }
      }
    }

    fetchTrackDetails()
  }, [roundSongs, loadingTracks])

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
    
    // Get current user's rating for this song
    const userRating = participantSong
      ? songRatings.find((r) => r.givenBy === currentUserId)
      : null

    return {
      participant,
      song: participantSong,
      averageRating,
      ratings: songRatings,
      userRating: userRating?.ratingValue || null,
    }
  })

  const handlePlay = (spotifyTrackId: string, spotifyUrl?: string) => {
    const url = spotifyUrl || `https://open.spotify.com/track/${spotifyTrackId}`
    
    // On mobile devices, use direct navigation to avoid blank tab
    // On desktop, open in new tab
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Direct navigation on mobile - opens Spotify app or web player directly
      window.location.href = url
    } else {
      // Open in new tab on desktop
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleAddSong = (participantId: string) => {
    // Navigate to song selection page
    router.push(`/lobby/${lobby.id}/select-song?round=${selectedRound}`)
  }

  const handleEditSong = (participantId: string) => {
    // Navigate to song selection page to change the song
    router.push(`/lobby/${lobby.id}/select-song?round=${selectedRound}`)
  }

  const handleOpenRating = (songId: string, currentUserRating: number | null) => {
    setRatingSongId(songId)
    setCurrentRating(currentUserRating)
  }

  const handleCloseRating = () => {
    setRatingSongId(null)
    setCurrentRating(null)
  }

  const handleSubmitRating = async (songId: string, ratingValue: number) => {
    setIsSubmittingRating(true)
    try {
      const response = await fetch(`/api/lobby/${lobby.id}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId,
          ratingValue,
        }),
      })

      if (response.ok) {
        // Refresh the page to update ratings
        router.refresh()
        handleCloseRating()
      } else {
        const data = await response.json()
        const errorMessage = data.error?.message || "Fehler beim Speichern der Bewertung"
        console.error("Failed to save rating:", errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error saving rating:", error)
      alert("Fehler beim Speichern der Bewertung")
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const handleDeleteSong = async (songId: string, spotifyTrackId: string) => {
    if (!confirm(t("confirmDeleteSong"))) {
      return
    }

    setDeletingSongId(songId)
    try {
      const response = await fetch(
        `/api/lobby/${lobby.id}/song?roundNumber=${selectedRound}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        // Remove from track details cache
        setTrackDetails((prev) => {
          const newDetails = { ...prev }
          delete newDetails[spotifyTrackId]
          return newDetails
        })
        // Refresh the page to update the song list
        router.refresh()
      } else {
        const data = await response.json()
        const errorMessage = data.error?.message || "Fehler beim Löschen des Songs"
        console.error("Failed to delete song:", errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error deleting song:", error)
      alert("Fehler beim Löschen des Songs")
    } finally {
      setDeletingSongId(null)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <MagicCard
      className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
      gradientFrom="var(--color-primary-500)"
      gradientTo="var(--color-primary-600)"
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
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {t("rateSong")}
              </th>
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {t("averageRating")}
              </th>
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-700">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              const isCurrentUser = currentUserId && row.participant.id === currentUserId
              const track = row.song ? trackDetails[row.song.spotifyTrackId] : null
              const isLoadingTrack = row.song ? loadingTracks.has(row.song.spotifyTrackId) : false

              // Debug logging (only in development)
              if (process.env.NODE_ENV === "development" && !row.song) {
                console.log("Song button check:", {
                  participantId: row.participant.id,
                  currentUserId,
                  isCurrentUser,
                  gameMode: lobby.gameMode,
                  hasSong: !!row.song,
                  willShowButton: isCurrentUser,
                })
              }

              return (
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
                          title={row.participant.name}
                        />
                      ) : (
                        <div 
                          className="size-6 md:size-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-xs"
                          title={row.participant.name}
                        >
                          {row.participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Username only visible on desktop */}
                      <span className="hidden md:inline text-xs md:text-sm font-medium text-neutral-900">
                        {row.participant.name}
                      </span>
                    </div>
                  </td>

                  {/* Song */}
                  <td className="py-3 px-2 md:px-4">
                    {row.song ? (
                      // Song exists - show details with edit/delete buttons
                      <div className="flex items-center gap-3">
                        {isLoadingTrack ? (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Lädt...</span>
                          </div>
                        ) : track ? (
                          // Show track details
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {track.album.images[0] && (
                              <img
                                src={track.album.images[0].url}
                                alt={track.album.name}
                                className="size-10 md:size-12 rounded object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs md:text-sm text-neutral-900 truncate">
                                {track.name}
                              </div>
                              <div className="text-xs text-neutral-500 truncate">
                                {track.artists.map((a) => a.name).join(", ")}
                              </div>
                              {track.duration_ms && (
                                <div className="text-xs text-neutral-400">
                                  {formatDuration(track.duration_ms)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Fallback if track details failed to load
                          <div className="text-xs md:text-sm text-neutral-500">
                            {row.song.spotifyTrackId}
                          </div>
                        )}
                      </div>
                    ) : isCurrentUser && !isGameFinished ? (
                      // Current user hasn't selected a song - show prominent add button (only if game not finished)
                      <div className="py-2">
                        <ShimmerButton
                          onClick={() => handleAddSong(row.participant.id)}
                          background="var(--color-accent-spotify)"
                          shimmerColor="var(--color-neutral-900)"
                          borderRadius="9999px"
                          className="w-full md:w-auto px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Plus className="size-4" />
                          <span>{t("addSong")}</span>
                        </ShimmerButton>
                      </div>
                    ) : (
                      // Other users or game finished - show waiting state
                      <div className="text-xs md:text-sm text-neutral-500 italic">
                        <span className="select-none">{t("waitingForSong")}</span>
                      </div>
                    )}
                  </td>

                  {/* Rate Song Button - Hidden when game is finished */}
                  {!isGameFinished && (
                    <td className="py-3 px-2 md:px-4">
                      <div className="flex items-center justify-center">
                        {row.song && row.song.suggestedBy !== currentUserId ? (
                          <ShimmerButton
                            onClick={() => handleOpenRating(row.song!.id, row.userRating)}
                            background={row.userRating ? "var(--color-primary-500)" : "var(--color-primary-500)"}
                            shimmerColor="var(--color-neutral-900)"
                            borderRadius="9999px"
                            className="size-10 md:size-12 p-0 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
                            aria-label={t("rateSong")}
                            title={row.userRating ? `${t("yourRating")}: ${row.userRating}/10` : t("rateSong")}
                          >
                            {/* Star without fill if already rated (outline only), filled if not rated */}
                            <Star className={cn("size-5 md:size-6", !row.userRating && "fill-current")} />
                          </ShimmerButton>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Average Rating */}
                  <td className="py-3 px-2 md:px-4 text-center">
                    {row.averageRating !== null ? (
                      <span className="text-base md:text-lg font-medium text-neutral-900">
                        {row.averageRating.toFixed(1)} / 10
                      </span>
                    ) : (
                      <span className="text-xs md:text-sm text-neutral-400">
                        -
                      </span>
                    )}
                  </td>

                  {/* Actions: Edit, Delete, Play - Hidden when game is finished */}
                  {!isGameFinished && (
                    <td className="py-3 px-2 md:px-4">
                      {row.song ? (
                        <div className="flex items-center justify-center gap-2">
                        {/* Edit/Delete buttons (only for current user and if no ratings exist) */}
                        {isCurrentUser && row.ratings.length === 0 && (
                          <>
                            <button
                              onClick={() => handleEditSong(row.participant.id)}
                              className="p-1.5 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                              aria-label={t("editSong")}
                              title={t("editSong")}
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSong(row.song!.id, row.song!.spotifyTrackId)}
                              disabled={deletingSongId === row.song!.id}
                              className="p-1.5 text-neutral-600 hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={t("deleteSong")}
                              title={t("deleteSong")}
                            >
                              {deletingSongId === row.song!.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </button>
                          </>
                        )}
                        {/* Play Button - always visible when song exists */}
                        <ShimmerButton
                          onClick={() => {
                            const track = trackDetails[row.song!.spotifyTrackId]
                            handlePlay(row.song!.spotifyTrackId, track?.external_urls?.spotify)
                          }}
                          background="var(--color-accent-spotify)"
                          shimmerColor="var(--color-neutral-900)"
                          borderRadius="9999px"
                          className="size-10 md:size-12 p-0 flex items-center justify-center"
                          aria-label={tGame("playSong")}
                          title={tGame("playSong")}
                        >
                          <Play className="size-5 md:size-6 ml-0.5" />
                        </ShimmerButton>
                      </div>
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Rating Dialog */}
      {ratingSongId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseRating}
        >
          <MagicCard
            className="p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full"
            gradientFrom="var(--color-primary-500)"
            gradientTo="var(--color-primary-600)"
            gradientSize={400}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-neutral-900">
                {t("rateSong")}
              </h3>
              <button
                onClick={handleCloseRating}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                aria-label={tCommon("close")}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Rating Buttons (1-10) */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                <ShimmerButton
                  key={rating}
                  onClick={() => handleSubmitRating(ratingSongId, rating)}
                  disabled={isSubmittingRating}
                  background={currentRating === rating ? "var(--color-primary-500)" : "var(--color-neutral-200)"}
                  shimmerColor="var(--color-neutral-900)"
                  borderRadius="8px"
                  className="aspect-square p-0 flex items-center justify-center text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={`${rating}/10`}
                >
                  {rating}
                </ShimmerButton>
              ))}
            </div>

            {/* Current Rating Display */}
            {currentRating && (
              <div className="text-center mb-4">
                <p className="text-sm text-neutral-600">
                  {t("yourRating")}: <span className="font-semibold text-primary-600">{currentRating}/10</span>
                </p>
              </div>
            )}

            {/* Submit Button */}
            {isSubmittingRating && (
              <div className="flex items-center justify-center gap-2 text-primary-500">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">{tCommon("loading")}</span>
              </div>
            )}
          </MagicCard>
        </div>
      )}
    </MagicCard>
  )
}
