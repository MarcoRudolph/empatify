"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, Music, Loader2, ArrowLeft } from "lucide-react"
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

export default function SelectSongPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const t = useTranslations("lobby")
  const lobbyId = params.id as string
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const round = searchParams.get("round")
    if (round) {
      setRoundNumber(parseInt(round))
    }
  }, [searchParams])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks?.items || [])
      } else {
        console.error("Search failed:", response.statusText)
      }
    } catch (error) {
      console.error("Error searching:", error)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <MagicCard
          className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
          gradientFrom="#FF6B00"
          gradientTo="#E65F00"
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
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 size-5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Song suchen..."
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <ShimmerButton
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                background="#FF6B00"
                shimmerColor="#ffffff"
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
          </form>

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
                  <Music className="size-5 text-primary-500 flex-shrink-0" />
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

