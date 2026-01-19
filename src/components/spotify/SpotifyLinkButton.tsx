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
    
    // Check for errors - extract detailed error information
    const error = urlParams.get("spotify_error")
    const status = urlParams.get("status")
    if (error) {
      console.error("=".repeat(80))
      console.error("❌ SPOTIFY OAUTH ERROR IN CLIENT")
      console.error("=".repeat(80))
      console.error("Error Code:", error)
      console.error("Status Code:", status || "N/A")
      console.error("Full URL Params:", Object.fromEntries(urlParams.entries()))
      console.error("=".repeat(80))
      
      // Parse error (format: "error_code:error_description")
      const [errorCode, ...descriptionParts] = error.split(":")
      const errorDescription = descriptionParts.length > 0 
        ? decodeURIComponent(descriptionParts.join(":"))
        : null
      
      let errorMessage = "Fehler bei der Spotify-Verknüpfung"
      let detailedMessage = ""
      
      if (errorCode === "invalid_client" || errorCode === "invalid_client_secret") {
        errorMessage = "Ungültige Client-Anmeldedaten"
        detailedMessage = "Bitte überprüfe:\n" +
          "1. NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env\n" +
          "2. SPOTIFY_CLIENT_SECRET in .env\n" +
          "3. Redirect URI in Spotify Dashboard: http://127.0.0.1:3000/api/spotify/callback\n" +
          "4. Server-Logs für Details"
      } else if (errorCode === "invalid_grant") {
        errorMessage = "Autorisierungscode ungültig"
        detailedMessage = "Bitte versuche es erneut. Der Code könnte abgelaufen sein."
      } else if (errorCode === "token_exchange_failed") {
        errorMessage = "Token-Austausch fehlgeschlagen"
        detailedMessage = "Bitte überprüfe die Server-Logs für Details."
      } else if (errorCode === "invalid_request") {
        errorMessage = "Ungültige Anfrage"
        detailedMessage = errorDescription || "Bitte überprüfe die Konfiguration."
      } else if (errorCode.includes("Insecure")) {
        errorMessage = "Unsicherer Redirect URI"
        detailedMessage = "Spotify akzeptiert 'localhost' nicht mehr.\n" +
          "Verwende '127.0.0.1' in der Spotify Dashboard Konfiguration:\n" +
          "http://127.0.0.1:3000/api/spotify/callback"
      }
      
      if (errorDescription) {
        detailedMessage += `\n\nSpotify Fehler: ${errorDescription}`
      }
      
      if (status) {
        detailedMessage += `\nHTTP Status: ${status}`
      }
      
      // Show detailed error alert
      alert(`${errorMessage}\n\n${detailedMessage}\n\nBitte überprüfe die Browser-Konsole und Server-Logs für weitere Details.`)
      
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const handleLinkSpotify = async () => {
    // First check if configuration is correct
    try {
      const configResponse = await fetch("/api/spotify/check-config")
      if (configResponse.ok) {
        const config = await configResponse.json()
        if (!config.configured.clientId || !config.configured.clientSecret) {
          const goToSetup = confirm(
            "Spotify ist nicht korrekt konfiguriert. Möchtest du zur Setup-Seite gehen?"
          )
          if (goToSetup) {
            router.push(`/${locale}/spotify-setup`)
            return
          }
          return
        }
      }
    } catch (error) {
      console.error("Error checking config:", error)
    }
    
    // Proceed with OAuth flow
    window.location.href = "/api/spotify/auth"
  }

  if (isLoading) {
    return (
      <div className="w-full md:w-[400px] h-16 border-2 border-accent-spotify rounded-full bg-neutral-100 text-neutral-900 font-medium flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(29,185,84,0.5)] opacity-50">
        <span className="text-sm">{t("loading")}</span>
      </div>
    )
  }

  if (isLinked) {
    return (
      <div className="w-full md:w-[400px] h-16 border-2 border-accent-spotify rounded-full bg-accent-spotify/10 text-accent-spotify font-medium flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(29,185,84,0.5)]">
        <Link2 className="size-6" />
        <span>{t("spotifyLinked")}</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleLinkSpotify}
      className="w-full md:w-[400px] h-16 border-2 border-[#1DB954] rounded-full text-neutral-900 font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(29,185,84,0.5)] hover:shadow-[0_0_25px_rgba(29,185,84,0.7)]"
      style={{
        backgroundColor: '#1DB954', // Spotify green
      }}
    >
      <Link2 className="size-6" />
      <span>{t("linkSpotify")}</span>
    </button>
  )
}

