"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link2 } from "lucide-react"

/**
 * Spotify Link Button Component
 * Handles Spotify OAuth flow initiation
 */
export function SpotifyLinkButton({ locale }: { locale: string }) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const [isLinked, setIsLinked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check Spotify connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/spotify/status")
        if (response.ok) {
          const data = await response.json()
          setIsLinked(data.linked)
        }
      } catch (error) {
        console.error("Error checking Spotify status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()

    // Check for success/error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("spotify_linked") === "true") {
      setIsLinked(true)
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const handleLinkSpotify = () => {
    window.location.href = "/api/spotify/auth"
  }

  if (isLoading) {
    return (
      <div className="w-full md:w-[400px] h-16 border-2 border-[#1DB954] rounded-full bg-neutral-100 text-neutral-900 font-medium flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(29,185,84,0.5)] opacity-50">
        <span className="text-sm">{t("loading")}</span>
      </div>
    )
  }

  if (isLinked) {
    return (
      <div className="w-full md:w-[400px] h-16 border-2 border-[#1DB954] rounded-full bg-[#1DB954]/10 text-[#1DB954] font-medium flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(29,185,84,0.5)]">
        <Link2 className="size-6" />
        <span>{t("spotifyLinked")}</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleLinkSpotify}
      className="w-full md:w-[400px] h-16 border-2 border-[#1DB954] rounded-full bg-neutral-100 text-neutral-900 font-medium hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(29,185,84,0.5)] hover:shadow-[0_0_25px_rgba(29,185,84,0.7)]"
    >
      <Link2 className="size-6" />
      <span>{t("linkSpotify")}</span>
    </button>
  )
}

