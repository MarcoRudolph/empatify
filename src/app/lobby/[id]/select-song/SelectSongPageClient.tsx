"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, Music, Loader2, ArrowLeft, TrendingUp, X } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"

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
}

export function SelectSongPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const t = useTranslations("lobby")
  const tCommon = useTranslations("common")
  const lobbyId = params.id as string
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [spotifyLinked, setSpotifyLinked] = useState<boolean | null>(null)
  const [showTopTracks, setShowTopTracks] = useState(false)

  // Check Spotify status on mount
  useEffect(() => {
    const checkSpotifyStatus = async () => {
      try {
        const response = await fetch("/api/spotify/status")
        if (response.ok) {
          const data = await response.json()
          setSpotifyLinked(data.linked || false)
        }
      } catch (error) {
        console.error("Error checking Spotify status:", error)
        setSpotifyLinked(false)
      }
    }
    checkSpotifyStatus()
  }, [])

  useEffect(() => {
    const round = searchParams.get("round")
    if (round) {
      setRoundNumber(parseInt(round))
    }
  }, [searchParams])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Check if Spotify is linked before searching
    if (spotifyLinked === false) {
      const linkSpotify = confirm(
        "Du musst zuerst dein Spotify-Konto verknüpfen, um Songs zu suchen. Möchtest du zu den Einstellungen gehen?"
      )
      if (linkSpotify) {
        router.push("/de/settings")
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (response.ok) {
        setTracks(data.tracks?.items || [])
      } else {
        console.error("Search failed:", data)
        // Show user-friendly error message
        const errorMessage = data.error?.message || "Fehler bei der Suche"
        if (data.error?.code === "SPOTIFY_NOT_LINKED") {
          const linkSpotify = confirm(
            "Bitte verknüpfe zuerst dein Spotify-Konto in den Einstellungen. Möchtest du zu den Einstellungen gehen?"
          )
          if (linkSpotify) {
            router.push("/de/settings")
          }
        } else if (data.error?.code === "TOKEN_EXPIRED") {
          // Automatically unlink expired token
          try {
            const unlinkResponse = await fetch("/api/spotify/unlink", {
              method: "DELETE",
            })
            if (unlinkResponse.ok) {
              setSpotifyLinked(false)
              alert("Dein Spotify-Token ist abgelaufen und wurde automatisch entfernt. Bitte verknüpfe dein Spotify-Konto erneut in den Einstellungen.")
              router.push("/de/settings")
            } else {
              alert("Dein Spotify-Token ist abgelaufen. Bitte verknüpfe dein Spotify-Konto erneut in den Einstellungen.")
              router.push("/de/settings")
            }
          } catch (unlinkError) {
            console.error("Error unlinking Spotify:", unlinkError)
            alert("Dein Spotify-Token ist abgelaufen. Bitte verknüpfe dein Spotify-Konto erneut in den Einstellungen.")
            router.push("/de/settings")
          }
        } else {
          alert(`Fehler: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error("Error searching:", error)
      alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSong = async (track: SpotifyTrack) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spotifyTrackId: track.id,
          roundNumber,
        }),
      })

      if (response.ok) {
        // Navigate back to lobby
        router.push(`/lobby/${lobbyId}`)
      } else {
        console.error("Failed to save song")
        setIsSaving(false)
      }
    } catch (error) {
      console.error("Error saving song:", error)
      setIsSaving(false)
    }
  }

  const handleLoadTopTracks = async () => {
    if (showTopTracks) {
      // Collapse if already shown
      setShowTopTracks(false)
      return
    }

    // Check if Spotify is linked before loading top tracks
    if (spotifyLinked === false) {
      const linkSpotify = confirm(
        "Du musst zuerst dein Spotify-Konto verknüpfen, um deine Top-Tracks zu sehen. Möchtest du zu den Einstellungen gehen?"
      )
      if (linkSpotify) {
        router.push("/de/settings")
      }
      return
    }

    setIsLoadingTopTracks(true)
    try {
      const response = await fetch("/api/spotify/top-tracks")
      const data = await response.json()
      
      if (response.ok) {
        setTopTracks(data.tracks || [])
        setShowTopTracks(true)
      } else {
        console.error("Failed to load top tracks:", data)
        const errorMessage = data.error?.message || "Fehler beim Laden der Top-Tracks"
        if (data.error?.code === "SPOTIFY_NOT_LINKED") {
          const linkSpotify = confirm(
            "Bitte verknüpfe zuerst dein Spotify-Konto in den Einstellungen. Möchtest du zu den Einstellungen gehen?"
          )
          if (linkSpotify) {
            router.push("/de/settings")
          }
        } else if (data.error?.code === "TOKEN_EXPIRED") {
          // Automatically unlink expired token
          try {
            const unlinkResponse = await fetch("/api/spotify/unlink", {
              method: "DELETE",
            })
            if (unlinkResponse.ok) {
              setSpotifyLinked(false)
              alert("Dein Spotify-Token ist abgelaufen und wurde automatisch entfernt. Bitte verknüpfe dein Spotify-Konto erneut in den Einstellungen.")
              router.push("/de/settings")
            }
          } catch (unlinkError) {
            console.error("Error unlinking Spotify:", unlinkError)
            alert("Dein Spotify-Token ist abgelaufen. Bitte verknüpfe dein Spotify-Konto erneut in den Einstellungen.")
            router.push("/de/settings")
          }
        } else {
          alert(`Fehler: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error("Error loading top tracks:", error)
      alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.")
    } finally {
      setIsLoadingTopTracks(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <MagicCard
          className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
          gradientFrom="var(--color-primary-500)"
          gradientTo="var(--color-primary-600)"
          gradientSize={400}
        >
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 mb-4 group"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Zurück</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {t("selectSong")}
            </h1>
            <p className="text-sm text-neutral-600">
              Runde {roundNumber}
            </p>
          </div>

          {/* Search Form */}
          {spotifyLinked === false && (
            <div className="mb-6 p-4 bg-neutral-100 border border-neutral-300 rounded-lg">
              <p className="text-sm text-neutral-700 mb-3">
                Du musst zuerst dein Spotify-Konto verknüpfen, um Songs zu suchen.
              </p>
              <button
                onClick={() => router.push("/de/settings")}
                className="px-4 py-2 bg-primary-500 text-neutral-900 rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                Zu den Einstellungen
              </button>
            </div>
          )}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 size-5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Song suchen..."
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent"
                  disabled={isLoading || spotifyLinked === false}
                />
              </div>
              <ShimmerButton
                type="submit"
                disabled={isLoading || !searchQuery.trim() || spotifyLinked === false}
                background="var(--color-primary-500)"
                shimmerColor="var(--color-neutral-900)"
                borderRadius="9999px"
                className="px-6 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Search className="size-5" />
                )}
              </ShimmerButton>
            </div>
            {/* My Top 5 Button */}
            <ShimmerButton
              type="button"
              onClick={handleLoadTopTracks}
              disabled={isLoadingTopTracks || spotifyLinked === false}
              background="var(--color-accent-spotify)"
              shimmerColor="var(--color-neutral-900)"
              borderRadius="9999px"
              className="w-full px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1DB954" }}
            >
              {isLoadingTopTracks ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm font-medium">{tCommon("loading")}</span>
                </>
              ) : showTopTracks ? (
                <>
                  <X className="size-4" />
                  <span className="text-sm font-medium">{t("hideTop5")}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="size-4" />
                  <span className="text-sm font-medium">{t("myTop5")}</span>
                </>
              )}
            </ShimmerButton>
          </form>

          {/* Top Tracks Section */}
          {showTopTracks && topTracks.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-br from-accent-spotify/10 to-accent-spotify/5 border border-accent-spotify/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-5 text-accent-spotify" style={{ color: "#1DB954" }} />
                <h3 className="text-lg font-semibold text-neutral-900">{t("myTop5")}</h3>
              </div>
              <div className="space-y-2">
                {topTracks.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectSong(track)}
                    disabled={isSaving}
                    className="w-full flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center size-8 rounded-full bg-accent-spotify/20 text-accent-spotify font-bold text-sm shrink-0" style={{ backgroundColor: "rgba(29, 185, 84, 0.2)", color: "#1DB954" }}>
                      {index + 1}
                    </div>
                    {track.album.images[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        className="size-12 md:size-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-neutral-900 truncate">
                        {track.name}
                      </div>
                      <div className="text-sm text-neutral-500 truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {track.album.name}
                      </div>
                    </div>
                    <Music className="size-5 text-accent-spotify shrink-0" style={{ color: "#1DB954" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {tracks.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectSong(track)}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {track.album.images[0] && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      className="size-12 md:size-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-neutral-900 truncate">
                      {track.name}
                    </div>
                    <div className="text-sm text-neutral-500 truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">
                      {track.album.name}
                    </div>
                  </div>
                  <Music className="size-5 text-primary-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {isSaving && (
            <div className="mt-4 text-center">
              <Loader2 className="size-6 animate-spin mx-auto text-primary-500" />
              <p className="text-sm text-neutral-600 mt-2">Song wird gespeichert...</p>
            </div>
          )}
        </MagicCard>
      </div>
    </div>
  )
}
