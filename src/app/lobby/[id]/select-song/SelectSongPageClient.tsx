"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Music, Loader2, ArrowLeft, X, AlertCircle, Search } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

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
  const locale = (params.locale as string) || "en"
  const [mounted, setMounted] = useState(false)
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [visibleResults, setVisibleResults] = useState(10)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [roundPrompts, setRoundPrompts] = useState<string[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      inputRef.current?.focus()
    }
  }, [mounted])

  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        const response = await fetch(`/api/lobby/${lobbyId}`)
        if (response.ok) {
          const data = await response.json()
          setCategory(data.lobby?.category || null)
          setRoundPrompts(data.lobby?.roundPrompts ?? null)
        }
      } catch {
        // ignore
      }
    }
    if (mounted) {
      fetchLobbyData()
    }
  }, [lobbyId, mounted])

  useEffect(() => {
    const round = searchParams.get("round")
    if (round) {
      setRoundNumber(parseInt(round, 10))
    }
  }, [searchParams])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery.length < 3) {
      setDebouncedQuery("")
      setTracks([])
      setSearchError(null)
      setIsSearching(false)
      setVisibleResults(10)
      return
    }

    const delay = trimmedQuery.length === 3 ? 2000 : 400
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!debouncedQuery) return

    const controller = new AbortController()

    const fetchTracks = async () => {
      setIsSearching(true)
      setSearchError(null)
      setVisibleResults(10)

      try {
        const response = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error?.message || 'Search failed')
        }

        setTracks(Array.isArray(data?.tracks?.items) ? data.tracks.items : [])
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return
        const message =
          fetchError instanceof Error ? fetchError.message : 'Could not search songs right now.'
        setTracks([])
        setSearchError(message)
      } finally {
        setIsSearching(false)
      }
    }

    fetchTracks()
    return () => controller.abort()
  }, [debouncedQuery])

  const handleSelectSong = async (track: SpotifyTrack) => {
    setIsSaving(true)
    setError(null)

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
        router.push(`/${locale}/lobby/${lobbyId}?round=${roundNumber}`)
      } else {
        const data = await response.json()
        const errorCode = data.error?.code

        if (errorCode === "CATEGORY_MISMATCH") {
          setError({
            message: data.error?.message || t("categoryMismatch"),
            category: data.error?.category,
          })
        } else {
          setError({
            message: data.error?.message || t("songSaveError"),
          })
        }
        setIsSaving(false)
      }
    } catch {
      setError({ message: t("songSaveError") })
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const getCategoryTranslationKey = (cat: string | null): string => {
    if (!cat) return "categoryAll"
    const categoryMap: Record<string, string> = {
      all: "categoryAll",
      "60s": "category60s",
      "70s": "category70s",
      "80s": "category80s",
      "90s": "category90s",
      "2000s": "category2000s",
      "2010s": "category2010s",
      "2020s": "category2020s",
      schlager: "categorySchlager",
      techno: "categoryTechno",
      "hiphop-rnb": "categoryHipHopRnB",
      rock: "categoryRock",
      dubstep: "categoryDubstep",
      pop: "categoryPop",
      jazz: "categoryJazz",
      country: "categoryCountry",
      electronic: "categoryElectronic",
      indie: "categoryIndie",
    }
    return categoryMap[cat] ?? "categoryAll"
  }

  if (!mounted) {
    return (
      <div
        className="min-h-screen bg-neutral-50 flex items-center justify-center p-4"
        aria-busy="true"
        aria-label={t("selectSong")}
      >
        <Loader2 className="size-8 animate-spin text-primary-500" aria-hidden />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      {/* Error toast - token contrast: error surface, dark text */}
      {error && (
        <section
          className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="max-w-2xl mx-auto">
            <div className="p-4 rounded-xl border border-neutral-300 bg-neutral-200 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-6 text-primary-600 shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-bold text-neutral-900 wrap-break-word">
                    {error.message}
                  </p>
                  {error.category && (
                    <p className="text-xs md:text-sm text-neutral-700 mt-1 font-medium">
                      {t("category")}: {error.category}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-neutral-700 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 rounded-lg p-1 shrink-0 transition-colors duration-200"
                  aria-label={tCommon("close")}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-neutral-300 bg-neutral-100 shadow-lg p-4 md:p-6">
          {/* Header */}
          <header className="mb-6">
            <nav aria-label="Breadcrumb">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 rounded-lg py-1 pr-2 -ml-2 transition-colors duration-200 group"
              >
                <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden />
                <span>Zurück</span>
              </button>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mt-2 mb-1">
              {t("selectSong")}
            </h1>
            <p className="text-sm text-neutral-500">
              Runde {roundNumber}
            </p>

            {roundPrompts?.[roundNumber - 1] && (
              <div className="mt-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-500 mb-1">
                  Round Prompt
                </p>
                <p className="text-base font-semibold text-neutral-900">
                  {roundPrompts[roundNumber - 1]}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Pick a song that fits this vibe — not your favourite.
                </p>
              </div>
            )}

            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
                <Input
                  ref={inputRef}
                  variant="light"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9 pr-10 py-2.5"
                  aria-label={t("searchAriaLabel")}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setDebouncedQuery("")
                      setTracks([])
                      setSearchError(null)
                      setVisibleResults(10)
                      inputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    aria-label={tCommon("close")}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <p className="mt-2 text-xs text-neutral-500">
                  {t("searchMinCharsHint")}
                </p>
              )}
              {searchQuery.trim().length === 3 && debouncedQuery !== searchQuery.trim() && (
                <p className="mt-2 text-xs text-neutral-500">
                  {t("searchDebounceHint")}
                </p>
              )}
            </div>
          </header>

          {/* Category info */}
          <section aria-labelledby="category-heading" className="mb-6 flex items-center gap-2 text-sm text-neutral-500 px-1">
            <Music className="size-4 text-neutral-500 shrink-0" aria-hidden />
            <span>
              <span id="category-heading" className="font-medium text-neutral-700">
                {t("category")}:
              </span>{" "}
              <span className="text-neutral-800">
                {t(getCategoryTranslationKey(category) as "categoryAll")}
              </span>
            </span>
          </section>

          {/* Results list */}
          {isSearching && (
            <div className="py-6 text-center" role="status" aria-live="polite">
              <Loader2 className="size-6 animate-spin mx-auto text-primary-500" aria-hidden />
              <p className="text-sm text-neutral-500 mt-2">{t("searchLoading")}</p>
            </div>
          )}

          {searchError && (
            <div className="mb-4 p-3 rounded-lg border border-neutral-300 bg-neutral-200">
              <p className="text-sm text-neutral-900">{searchError}</p>
            </div>
          )}

          {tracks.length > 0 && (
            <section aria-labelledby="results-heading" className="space-y-2 max-h-96 overflow-y-auto">
              <h2 id="results-heading" className="sr-only">
                Suchergebnisse
              </h2>
              <ul className="space-y-2 list-none p-0 m-0">
                {tracks.slice(0, visibleResults).map((track) => (
                  <li key={track.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSong(track)}
                      disabled={isSaving}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-300 bg-neutral-200",
                        "text-left transition-colors duration-200",
                        "hover:bg-neutral-300 hover:border-neutral-400",
                        "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {track.album.images[0] && (
                        <Image
                          src={track.album.images[0].url}
                          alt=""
                          width={64}
                          height={64}
                          className="size-12 md:size-16 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate">
                          {track.name}
                        </div>
                        <div className="text-sm text-neutral-500 truncate">
                          {track.artists.map((a) => a.name).join(", ")}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {track.album.name}
                        </div>
                      </div>
                      <Music className="size-5 text-primary-500 shrink-0" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              {tracks.length > visibleResults && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleResults((prev) => prev + 10)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 transition-colors text-sm font-medium"
                  >
                    {t("searchShowMore")}
                  </button>
                </div>
              )}
            </section>
          )}

          {!isSearching && !searchError && debouncedQuery.length >= 3 && tracks.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-neutral-500">{t("searchNoResults", { query: debouncedQuery })}</p>
            </div>
          )}

          {isSaving && (
            <div className="mt-4 text-center" role="status" aria-live="polite">
              <Loader2 className="size-6 animate-spin mx-auto text-primary-500" aria-hidden />
              <p className="text-sm text-neutral-500 mt-2">{t("savingSong")}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
