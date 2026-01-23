"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, Music, Loader2, ArrowLeft, X, AlertCircle } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import Image from "next/image"

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

interface ErrorMessage {
  message: string
  category?: string
}

export function SelectSongPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const t = useTranslations("lobby")
  const tCommon = useTranslations("common")
  const lobbyId = params.id as string
  const [mounted, setMounted] = useState(false)
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-focus search input on mount (especially for mobile)
  useEffect(() => {
    if (mounted && searchInputRef.current) {
      // Small delay to ensure smooth rendering
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [mounted])

  // Fetch lobby data to get category
  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        const response = await fetch(`/api/lobby/${lobbyId}`)
        if (response.ok) {
          const data = await response.json()
          console.log("🎵 Lobby data fetched:", data)
          console.log("🎯 Category value:", data.lobby?.category)
          setCategory(data.lobby?.category || null)
        } else {
          console.error("Failed to fetch lobby data:", response.status)
        }
      } catch (error) {
        console.error("Error fetching lobby data:", error)
      }
    }
    if (mounted) {
      fetchLobbyData()
    }
  }, [lobbyId, mounted])

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
      const data = await response.json()
      
      if (response.ok) {
        setTracks(data.tracks?.items || [])
      } else {
        console.error("Search failed:", data)
        const errorMessage = data.error?.message || "Fehler bei der Suche"
        alert(`Fehler: ${errorMessage}`)
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
    setError(null) // Clear any previous errors
    
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
        // Navigate back to lobby with the round number as query parameter
        // This ensures the user lands on the correct round after selecting a song
        router.push(`/lobby/${lobbyId}?round=${roundNumber}`)
      } else {
        const data = await response.json()
        const errorCode = data.error?.code
        
        // Handle category mismatch error specifically
        if (errorCode === "CATEGORY_MISMATCH") {
          setError({
            message: data.error?.message || t("categoryMismatch"),
            category: data.error?.category,
          })
        } else {
          // Handle other errors
          setError({
            message: data.error?.message || t("songSaveError"),
          })
        }
        setIsSaving(false)
      }
    } catch (error) {
      console.error("Error saving song:", error)
      setError({
        message: t("songSaveError"),
      })
      setIsSaving(false)
    }
  }

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Helper function to get category translation key
  const getCategoryTranslationKey = (cat: string | null): string => {
    console.log("🔍 getCategoryTranslationKey called with:", cat)
    if (!cat) {
      console.log("⚠️ Category is null/undefined, returning categoryAll")
      return "categoryAll"
    }
    
    // Map category values to translation keys
    const categoryMap: Record<string, string> = {
      "all": "categoryAll",
      "60s": "category60s",
      "70s": "category70s",
      "80s": "category80s",
      "90s": "category90s",
      "2000s": "category2000s",
      "2010s": "category2010s",
      "2020s": "category2020s",
      "schlager": "categorySchlager",
      "techno": "categoryTechno",
      "hiphop-rnb": "categoryHipHopRnB",
      "rock": "categoryRock",
      "dubstep": "categoryDubstep",
      "pop": "categoryPop",
      "jazz": "categoryJazz",
      "country": "categoryCountry",
      "electronic": "categoryElectronic",
      "indie": "categoryIndie",
    }
    
    const result = categoryMap[cat] || "categoryAll"
    console.log("✅ Translation key result:", result)
    return result
  }


  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 p-4 md:p-8">
      {/* Fixed Error Toast - Always visible at top */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="max-w-2xl mx-auto">
            <MagicCard
              className="p-4 bg-red-50 border-2 border-red-300 rounded-xl shadow-2xl"
              gradientFrom="#fca5a5"
              gradientTo="#ef4444"
              gradientSize={300}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="size-6 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-bold text-red-900 break-words">
                    {error.message}
                  </p>
                  {error.category && (
                    <p className="text-xs md:text-sm text-red-800 mt-1 font-medium">
                      {t("category")}: {error.category}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 transition-colors shrink-0 p-1 hover:bg-red-100 rounded-lg"
                  aria-label={tCommon("close")}
                >
                  <X className="size-5" />
                </button>
              </div>
            </MagicCard>
          </div>
        </div>
      )}

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
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              {t("selectSong")}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Runde {roundNumber}
            </p>
          </div>

          {/* Search Form - Prominent and Eye-catching */}
          <form onSubmit={handleSearch} className="mb-4">
            <label htmlFor="song-search" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Song suchen
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 size-6 pointer-events-none" />
                <input
                  id="song-search"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Song suchen..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-primary-400 rounded-xl bg-white text-black placeholder:text-[#6B6B6B] focus:outline-none focus:ring-4 focus:ring-primary-300 focus:border-primary-500 shadow-lg transition-all duration-200 hover:border-primary-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:focus:border-primary-500"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              <ShimmerButton
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                background="var(--color-primary-500)"
                shimmerColor="var(--color-neutral-900)"
                borderRadius="12px"
                className="px-8 h-[60px] text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Search className="size-6" />
                )}
              </ShimmerButton>
            </div>
          </form>

          {/* Category Info - Subtle and Informative */}
          <div className="mb-6 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 px-2">
            <Music className="size-4 text-neutral-500 shrink-0" />
            <span>
              <span className="font-medium">{t("category")}:</span>{" "}
              <span className="text-neutral-800 dark:text-neutral-200">{t(getCategoryTranslationKey(category) as any)}</span>
            </span>
          </div>

          {/* Results */}
          {tracks.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectSong(track)}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
                >
                  {track.album.images[0] && (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      width={64}
                      height={64}
                      className="size-12 md:size-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-neutral-900 dark:text-white truncate">
                      {track.name}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
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
              <p className="text-sm text-neutral-600 mt-2">{t("savingSong")}</p>
            </div>
          )}
        </MagicCard>
      </div>
    </div>
  )
}
