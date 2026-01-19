"use client"

import { useState, useEffect, useRef } from "react"
import { Music, Play, Loader2, Plus, Edit2, Trash2, ExternalLink } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
}: SongsCardProps) {
  const t = useTranslations("lobby")
  const tGame = useTranslations("game")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [selectedRound, setSelectedRound] = useState(1)
  const [trackDetails, setTrackDetails] = useState<Record<string, SpotifyTrack>>({})
  const [loadingTracks, setLoadingTracks] = useState<Set<string>>(new Set())
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
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

    return {
      participant,
      song: participantSong,
      averageRating,
      ratings: songRatings,
    }
  })

  const handlePlay = (spotifyTrackId: string) => {
    // Toggle: if same track is clicked, stop playing; otherwise play new track
    if (playingTrackId === spotifyTrackId) {
      setPlayingTrackId(null)
    } else {
      setPlayingTrackId(spotifyTrackId)
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
        console.error("Failed to delete song")
        alert("Fehler beim Löschen des Songs")
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

      {/* Spotify Player Iframe - shown when a track is playing */}
      {playingTrackId && (
        <div className="mb-4 rounded-lg overflow-hidden border border-neutral-300 bg-neutral-50">
          <iframe
            title={`Spotify Embed: ${trackDetails[playingTrackId]?.name || "Track"}`}
            src={`https://open.spotify.com/embed/track/${playingTrackId}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            style={{ minHeight: "352px" }}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full"
          />
        </div>
      )}

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
                            {track.external_urls?.spotify && (
                              <a
                                href={track.external_urls.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:text-primary-600 transition-colors shrink-0"
                                aria-label="In Spotify öffnen"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          // Fallback if track details failed to load
                          <div className="text-xs md:text-sm text-neutral-500">
                            {row.song.spotifyTrackId}
                          </div>
                        )}
                        
                        {/* Edit/Delete buttons (only for current user) */}
                        {isCurrentUser && (
                          <div className="flex items-center gap-1 shrink-0">
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
                          </div>
                        )}
                      </div>
                    ) : isCurrentUser ? (
                      // Current user hasn't selected a song - show prominent add button
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
                      // Other users - show waiting state
                      <div className="text-xs md:text-sm text-neutral-400 italic">
                        <span className="opacity-30 select-none">{t("waitingForSong")}</span>
                      </div>
                    )}
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
                        className={cn(
                          "inline-flex items-center justify-center size-8 md:size-10 rounded-full text-white hover:opacity-90 transition-all",
                          playingTrackId === row.song.spotifyTrackId
                            ? "bg-accent-spotify shadow-[0_0_15px_rgba(29,185,84,0.5)]"
                            : "bg-primary-500 hover:bg-primary-600"
                        )}
                        style={
                          playingTrackId === row.song.spotifyTrackId
                            ? { backgroundColor: "#1DB954" }
                            : undefined
                        }
                        aria-label={
                          playingTrackId === row.song.spotifyTrackId
                            ? t("stopPlaying")
                            : tGame("playSong")
                        }
                        title={
                          playingTrackId === row.song.spotifyTrackId
                            ? t("stopPlaying")
                            : tGame("playSong")
                        }
                      >
                        {playingTrackId === row.song.spotifyTrackId ? (
                          <div className="flex items-center gap-1">
                            <div className="size-1.5 bg-white rounded-full" />
                            <div className="size-1.5 bg-white rounded-full" />
                            <div className="size-1.5 bg-white rounded-full" />
                          </div>
                        ) : (
                          <Play className="size-3 md:size-4 ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </MagicCard>
  )
}
