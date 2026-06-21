"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, CheckCircle2, Circle, Clock3, Music, Music2, Play, Loader2, Plus, Edit2, Trash2, Star, User, Users, X } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
  roundPrompts?: string[] | null
  isBlind?: boolean
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
  locale: string
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
  locale,
}: SongsCardProps) {
  const t = useTranslations("lobby")
  const tGame = useTranslations("game")
  const tCommon = useTranslations("common")
  const tDashboard = useTranslations("dashboard")
  const router = useRouter()
  const pathname = usePathname()
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
  const [isSpotifyLinked, setIsSpotifyLinked] = useState(false)
  const [isCheckingSpotify, setIsCheckingSpotify] = useState(true)
  const [spotifyLinkArmed, setSpotifyLinkArmed] = useState(false)
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [growingRound, setGrowingRound] = useState<number | null>(null)
  const [activeRoundHint, setActiveRoundHint] = useState<{
    round: number
    type: "user" | "group"
    label: string
  } | null>(null)
  const trackDetailsRef = useRef<Record<string, SpotifyTrack>>({})

  // Keep ref in sync with state
  useEffect(() => {
    trackDetailsRef.current = trackDetails
  }, [trackDetails])

  // Mount detection and mobile check (prevents hydration errors)
  useEffect(() => {
    setMounted(true)
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  // Check Spotify connection status
  useEffect(() => {
    const checkSpotifyStatus = async () => {
      try {
        const response = await fetch('/api/spotify/status')
        if (response.ok) {
          const data = await response.json()
          setIsSpotifyLinked(data.linked || false)
        }
      } catch (error) {
        console.error('Error checking Spotify status:', error)
      } finally {
        setIsCheckingSpotify(false)
      }
    }

    checkSpotifyStatus()
  }, [])

  // After Spotify OAuth, land on lobby with ?spotify_linked=true — refresh link state and strip params
  useEffect(() => {
    if (searchParams.get("spotify_linked") !== "true") return

    const syncAfterOAuth = async () => {
      try {
        const response = await fetch("/api/spotify/status")
        if (response.ok) {
          const data = await response.json()
          setIsSpotifyLinked(data.linked || false)
        }
      } catch (error) {
        console.error("Error checking Spotify status after OAuth:", error)
      } finally {
        setIsCheckingSpotify(false)
      }
    }

    void syncAfterOAuth()
    setSpotifyLinkArmed(false)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("spotify_linked")
    params.delete("spotify_error")
    const q = params.toString()
    const nextPath = q ? `${pathname}?${q}` : pathname
    router.replace(nextPath)
  }, [searchParams, pathname, router])

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
    // On desktop, open in named tab (reuses same tab for all songs)
    if (isMobile) {
      // Direct navigation on mobile - opens Spotify app or web player directly
      window.location.href = url
    } else {
      // Open in named tab on desktop - reuses the same tab for all Spotify songs
      window.open(url, 'empatify_spotify', 'noopener,noreferrer')
    }
  }

  const handleAddSong = () => {
    // Navigate to song selection page
    const locale = document.cookie.split(';').find(c => c.trim().startsWith('NEXT_LOCALE='))?.split('=')[1] || "en"
    router.push(`/${locale}/lobby/${lobby.id}/select-song?round=${selectedRound}`)
  }

  const handleEditSong = () => {
    // Navigate to song selection page to change the song
    const locale = document.cookie.split(';').find(c => c.trim().startsWith('NEXT_LOCALE='))?.split('=')[1] || "en"
    router.push(`/${locale}/lobby/${lobby.id}/select-song?round=${selectedRound}`)
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
        
        // Check if all songs in current round are now rated by current user
        // and automatically switch to next round with unrated songs
        const currentRoundSongs = songs.filter(s => s.roundNumber === selectedRound)
        const songsToRate = currentRoundSongs.filter(s => s.suggestedBy !== currentUserId)
        
        // After refresh, check if current round is fully rated
        setTimeout(() => {
          const currentRoundRatings = ratings.filter(r => 
            currentRoundSongs.some(s => s.id === r.songId) && r.givenBy === currentUserId
          )
          
          // If all songs in current round are rated, find next round with unrated songs
          if (currentRoundRatings.length >= songsToRate.length) {
            for (let round = selectedRound + 1; round <= lobby.maxRounds; round++) {
              const roundSongs = songs.filter(s => s.roundNumber === round)
              const songsToRateInRound = roundSongs.filter(s => s.suggestedBy !== currentUserId)
              const roundRatings = ratings.filter(r => 
                roundSongs.some(s => s.id === r.songId) && r.givenBy === currentUserId
              )
              
              if (roundRatings.length < songsToRateInRound.length) {
                setSelectedRound(round)
                break
              }
            }
          }
        }, 500)
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

  // Calculate round status for the mobile-first round selector.
  const getRoundStatus = (round: number) => {
    const roundSongs = songs.filter(s => s.roundNumber === round)
    const songsToRate = roundSongs.filter(s => s.suggestedBy !== currentUserId)
    const ownSong = roundSongs.find(s => s.suggestedBy === currentUserId)
    const ownSongRatings = ownSong
      ? ratings.filter(r => r.songId === ownSong.id && r.givenBy !== currentUserId)
      : []
    const expectedRatingsForOwnSong = Math.max(participants.length - 1, 0)
    const ownRatingsGiven = ratings.filter(r => 
      roundSongs.some(s => s.id === r.songId) && r.givenBy === currentUserId
    )
    const expectedRatingsForRound = roundSongs.length * Math.max(participants.length - 1, 0)
    const roundRatingCount = ratings.filter(r => roundSongs.some(s => s.id === r.songId)).length
    const missingTrackCount = Math.max(participants.length - roundSongs.length, 0)
    const missingRatingCount = Math.max(expectedRatingsForRound - roundRatingCount, 0)
    const hasUnratedSongs = ownRatingsGiven.length < songsToRate.length
    const ownSongFullyRated = Boolean(ownSong) && expectedRatingsForOwnSong > 0 && ownSongRatings.length >= expectedRatingsForOwnSong
    const userState = !ownSong
      ? "noTrack"
      : hasUnratedSongs
        ? "forgotToRate"
        : ownSongFullyRated
          ? "trackRated"
          : "trackSelected"
    const groupState = missingTrackCount > 0
      ? "tracksMissing"
      : missingRatingCount > 0
        ? "ratingsMissing"
        : "allRatingsPresent"
    
    return {
      hasUnratedSongs,
      totalRatings: ownRatingsGiven.length,
      hasOwnSong: Boolean(ownSong),
      ownSongFullyRated,
      missingTrackCount,
      missingRatingCount,
      userState,
      groupState,
    }
  }

  
  const handleRoundChange = (round: number) => {
    setSelectedRound(round)
    setGrowingRound(round)
    window.setTimeout(() => {
      setGrowingRound((current) => (current === round ? null : current))
    }, 220)
  }

  const toggleRoundHint = (round: number, type: "user" | "group", label: string) => {
    setActiveRoundHint((current) =>
      current?.round === round && current.type === type ? null : { round, type, label }
    )
  }

  // Check if all participants have songs for current round
  const allSongsPresent = roundSongs.length === participants.length

  // Handle Play All - uses Spotify Queue API to add all songs
  const handlePlayAll = async () => {
    if (roundSongs.length === 0 || !isSpotifyLinked) return
    
    setIsPlayingAll(true)
    
    try {
      // Collect all Spotify track IDs
      const trackIds = roundSongs.map(song => song.spotifyTrackId)
      
      // Call API to add tracks to queue
      const response = await fetch('/api/spotify/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackIds }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success!
        alert(`✅ ${data.message || 'Playback started with all tracks in queue!'}`)
      } else {
        // Handle specific error cases
        if (data.error?.code === 'PREMIUM_REQUIRED') {
          alert('❌ Spotify Premium is required for playback control.\n\nPlease upgrade your Spotify account to Premium.')
        } else if (data.error?.code === 'NO_ACTIVE_DEVICE') {
          alert('❌ No active Spotify device found.\n\nPlease open Spotify on your phone, computer, or any device and try again.')
        } else if (data.error?.code === 'SPOTIFY_NOT_LINKED') {
          alert(`❌ Spotify account not linked.\n\n${t("spotifyLinkUsePromptBelow")}`)
          setIsSpotifyLinked(false)
        } else {
          alert(`❌ ${data.error?.message || 'Failed to start playback. Please try again.'}`)
        }
      }
    } catch (error) {
      console.error('Error playing all tracks:', error)
      alert('❌ Failed to start playback. Please try again.')
    } finally {
      setIsPlayingAll(false)
    }
  }

  const handleLinkSpotify = () => {
    if (!spotifyLinkArmed) {
      setSpotifyLinkArmed(true)
      return
    }
    const returnTo = `/${locale}/lobby/${lobby.id}`
    window.location.href = `/api/spotify/auth?return_to=${encodeURIComponent(returnTo)}`
  }

  const getUserStatusLabel = (status: ReturnType<typeof getRoundStatus>) => {
    if (status.userState === "noTrack") return t("roundUserNoTrack")
    if (status.userState === "forgotToRate") return t("roundUserForgotToRate")
    if (status.userState === "trackRated") return t("roundUserTrackRated")
    return t("roundUserTrackSelected")
  }

  const getGroupStatusLabel = (status: ReturnType<typeof getRoundStatus>) => {
    if (status.groupState === "tracksMissing") {
      return t("roundGroupTracksMissing", { count: status.missingTrackCount })
    }
    if (status.groupState === "ratingsMissing") {
      return t("roundGroupRatingsMissing", { count: status.missingRatingCount })
    }
    return t("roundGroupAllRatingsPresent")
  }

  const getUserStatusIcon = (status: ReturnType<typeof getRoundStatus>) => {
    const label = getUserStatusLabel(status)
    const colorClass =
      status.userState === "trackRated"
        ? "text-accent-spotify"
        : status.userState === "trackSelected"
          ? "text-primary-500"
          : status.userState === "forgotToRate"
            ? "text-yellow-500"
            : "text-neutral-500"
    const StateIcon =
      status.userState === "trackRated"
        ? CheckCircle2
        : status.userState === "trackSelected"
          ? Music2
          : status.userState === "forgotToRate"
            ? AlertTriangle
            : Circle

    return { label, colorClass, StateIcon, BaseIcon: User }
  }

  const getGroupStatusIcon = (status: ReturnType<typeof getRoundStatus>) => {
    const label = getGroupStatusLabel(status)
    const colorClass =
      status.groupState === "allRatingsPresent"
        ? "text-accent-spotify"
        : status.groupState === "ratingsMissing"
          ? "text-yellow-500"
          : "text-neutral-500"
    const StateIcon =
      status.groupState === "allRatingsPresent"
        ? CheckCircle2
        : status.groupState === "ratingsMissing"
          ? Clock3
          : Circle

    return { label, colorClass, StateIcon, BaseIcon: Users }
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

      {/* Active round prompt */}
      {!isGameFinished && lobby.roundPrompts?.[selectedRound - 1] && (
        <div className="mb-4 px-3 py-2.5 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-500 mb-0.5">
            {t("promptLabel")}
          </p>
          <p className="text-sm font-semibold text-neutral-900">
            {lobby.roundPrompts[selectedRound - 1]}
          </p>
        </div>
      )}

      {/* Round Buttons — richer mobile-first status selector */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: lobby.maxRounds }, (_, i) => i + 1).map((round) => {
            const roundStatus = getRoundStatus(round)
            const isActive = selectedRound === round
            const isGrowing = growingRound === round
            const userIcon = getUserStatusIcon(roundStatus)
            const groupIcon = getGroupStatusIcon(roundStatus)
            const activeHint = activeRoundHint?.round === round ? activeRoundHint : null
            const UserBaseIcon = userIcon.BaseIcon
            const UserStateIcon = userIcon.StateIcon
            const GroupBaseIcon = groupIcon.BaseIcon
            const GroupStateIcon = groupIcon.StateIcon

            return (
              <div
                key={round}
                role="button"
                tabIndex={0}
                onClick={() => handleRoundChange(round)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handleRoundChange(round)
                  }
                }}
                className={cn(
                  "relative min-h-[52px] cursor-pointer rounded-2xl border bg-neutral-100/80 px-3 py-2.5 text-left shadow-sm outline-none transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-primary-500",
                  isActive
                    ? "border-primary-500 shadow-[0_0_0_1px_rgba(255,107,0,0.35),0_10px_24px_rgba(255,107,0,0.14)]"
                    : "border-neutral-300",
                  isGrowing && "scale-[1.06]"
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm leading-none text-neutral-900 transition-[font-weight] duration-150",
                      isActive ? "font-black" : "font-bold"
                    )}
                  >
                    {t("round")} {round}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      title={userIcon.label}
                      aria-label={userIcon.label}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleRoundHint(round, "user", userIcon.label)
                      }}
                      className={cn(
                        "relative inline-flex size-7 items-center justify-center rounded-full bg-neutral-200 transition-colors hover:bg-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                        userIcon.colorClass
                      )}
                    >
                      <UserBaseIcon className="size-4" aria-hidden="true" />
                      <UserStateIcon className="absolute -right-1 -top-1 size-3.5 rounded-full bg-neutral-100" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title={groupIcon.label}
                      aria-label={groupIcon.label}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleRoundHint(round, "group", groupIcon.label)
                      }}
                      className={cn(
                        "relative inline-flex size-7 items-center justify-center rounded-full bg-neutral-200 transition-colors hover:bg-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                        groupIcon.colorClass
                      )}
                    >
                      <GroupBaseIcon className="size-4" aria-hidden="true" />
                      <GroupStateIcon className="absolute -right-1 -top-1 size-3.5 rounded-full bg-neutral-100" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {activeHint && (
                  <div className="mt-2 rounded-xl border border-neutral-300 bg-neutral-200/80 px-2 py-1.5 text-[11px] font-medium leading-snug text-neutral-900 shadow-sm">
                    {activeHint.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Play All Button - Show when all songs are present AND Spotify is linked */}
      {mounted && allSongsPresent && roundSongs.length > 0 && isSpotifyLinked && !isCheckingSpotify && (
        <div className="mb-4 flex justify-center">
          <ShimmerButton
            onClick={handlePlayAll}
            disabled={isPlayingAll}
            background="var(--color-accent-spotify)"
            shimmerColor="var(--color-neutral-900)"
            borderRadius="9999px"
            className="px-6 py-3 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlayingAll ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span className="font-semibold text-sm md:text-base">
                  Starting playback...
                </span>
              </>
            ) : (
              <>
                <Play className="size-5 fill-current" />
                <span className="font-semibold text-sm md:text-base">
                  Play All ({roundSongs.length} {tGame("song")}s)
                </span>
              </>
            )}
          </ShimmerButton>
        </div>
      )}

      {/* Songs Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-300">
              <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500 w-12 md:w-auto">
                {tGame("users")}
              </th>
              <th className="text-left py-2 px-2 md:px-6 text-xs md:text-sm font-medium text-neutral-500">
                {tGame("song")}
              </th>
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500 w-16 md:w-24">
                <span className="sr-only md:not-sr-only">{t("rateSong")}</span>
                <Star className="size-4 mx-auto md:hidden" />
              </th>
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500 w-20 md:w-32 hidden sm:table-cell">
                {t("averageRating")}
              </th>
              <th className="text-center py-2 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500 w-16 md:w-24">
                <span className="sr-only md:not-sr-only">{t("actions")}</span>
                <Play className="size-4 mx-auto md:hidden" />
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
                  <td className="py-3 px-2 md:px-4 w-12 md:w-auto align-middle">
                    <div className="flex items-center gap-2">
                      {lobby.isBlind && !isGameFinished && !isCurrentUser ? (
                        <>
                          <div className="size-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-400 shrink-0">?</div>
                          <span className="hidden md:inline text-xs md:text-sm font-medium text-neutral-400">Hidden</span>
                        </>
                      ) : (
                        <>
                          {row.participant.avatarUrl ? (
                            <img
                              src={row.participant.avatarUrl}
                              alt={row.participant.name}
                              className="size-8 md:size-8 rounded-full shrink-0"
                              title={row.participant.name}
                            />
                          ) : (
                            <div
                              className="size-8 md:size-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-xs shrink-0"
                              title={row.participant.name}
                            >
                              {row.participant.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Username only visible on desktop */}
                          <span className="hidden md:inline text-xs md:text-sm font-medium text-neutral-900">
                            {row.participant.name}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Song */}
                  <td className="py-3 px-2 md:px-6 align-middle">
                    {row.song ? (
                      // Song exists - show details with edit/delete buttons
                      <div className="flex items-center gap-3">
                        {isLoadingTrack ? (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-400">
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
                            <div className="flex-1 min-w-0 max-w-[140px] sm:max-w-xs md:max-w-sm">
                              {/* Song Title - Show on desktop, truncate on mobile */}
                              <div className="font-medium text-xs md:text-sm text-neutral-900 truncate md:line-clamp-2">
                                {track.name}
                              </div>
                              {/* Artist Names - Always truncate for compact layout */}
                              <div className="text-xs text-neutral-400 truncate">
                                {track.artists.map((a) => a.name).join(", ")}
                              </div>
                              {/* Duration */}
                              {track.duration_ms && (
                                <div className="text-xs text-neutral-500 mt-0.5">
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
                          onClick={handleAddSong}
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
                    <td className="py-3 px-2 md:px-4 w-16 md:w-24 align-middle">
                      <div className="flex items-center justify-center">
                        {row.song && row.song.suggestedBy !== currentUserId ? (
                          <ShimmerButton
                            onClick={() => handleOpenRating(row.song!.id, row.userRating)}
                            background={row.userRating ? "var(--color-primary-500)" : "var(--color-primary-500)"}
                            shimmerColor="var(--color-neutral-900)"
                            borderRadius="9999px"
                            className="size-10 md:size-12 p-0 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 shrink-0"
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

                  {/* Average Rating - Hidden on small screens */}
                  <td className="py-3 px-2 md:px-4 text-center w-20 md:w-32 hidden sm:table-cell align-middle">
                    {row.averageRating !== null ? (
                      <span className="text-base md:text-lg font-medium text-neutral-900">
                        {row.averageRating.toFixed(1)} / 10
                      </span>
                    ) : (
                      <span className="text-xs md:text-sm text-neutral-500">
                        -
                      </span>
                    )}
                  </td>

                  {/* Actions: Play Button (Edit/Delete only on desktop) - Hidden when game is finished */}
                  {!isGameFinished && (
                    <td className="py-3 px-2 md:px-4 w-16 md:w-24 align-middle">
                      {row.song ? (
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                        {/* Edit/Delete buttons (only for current user and if no ratings exist) - Hidden on mobile */}
                        {isCurrentUser && row.ratings.length === 0 && (
                          <>
                            <button
                              onClick={handleEditSong}
                              className="hidden md:block p-1.5 text-neutral-500 hover:text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
                              aria-label={t("editSong")}
                              title={t("editSong")}
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSong(row.song!.id, row.song!.spotifyTrackId)}
                              disabled={deletingSongId === row.song!.id}
                              className="hidden md:block p-1.5 text-neutral-500 hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="size-10 md:size-12 p-0 flex items-center justify-center shrink-0"
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

      {/* Spotify Link Prompt — compact inline strip */}
      {mounted && roundSongs.length > 0 && !isSpotifyLinked && !isCheckingSpotify && (
        <div className="mt-4 flex items-center justify-between gap-3 px-3 py-2.5 bg-accent-spotify/10 border border-accent-spotify/20 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="shrink-0 text-accent-spotify"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span className="text-xs text-neutral-500 truncate">
              {t("spotifyPremiumQueueHint")}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {spotifyLinkArmed && (
              <button
                type="button"
                onClick={() => setSpotifyLinkArmed(false)}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                {tCommon("cancel")}
              </button>
            )}
            <button
              onClick={handleLinkSpotify}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                spotifyLinkArmed
                  ? "bg-accent-spotify text-white animate-pulse"
                  : "bg-accent-spotify/20 text-accent-spotify hover:bg-accent-spotify/30"
              )}
            >
              {spotifyLinkArmed ? t("spotifyLinkTapAgain") : tDashboard("linkSpotify")}
            </button>
          </div>
        </div>
      )}

      {/* Rating Dialog */}
      {ratingSongId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseRating}
        >
          <div className="max-w-md w-full" onClick={(event) => event.stopPropagation()}>
            <MagicCard
              className="p-6 md:p-8 rounded-2xl shadow-2xl w-full"
              gradientFrom="var(--color-primary-500)"
              gradientTo="var(--color-primary-600)"
              gradientSize={400}
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-neutral-900">
                {t("rateSong")}
              </h3>
              <button
                onClick={handleCloseRating}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
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
                <p className="text-sm text-neutral-500">
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
        </div>
      )}
    </MagicCard>
  )
}
