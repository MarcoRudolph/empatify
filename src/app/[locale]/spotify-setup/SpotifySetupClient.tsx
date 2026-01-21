"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link2, CheckCircle2, XCircle, Copy, ExternalLink } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"

export function SpotifySetupClient({ locale }: { locale: string }) {
  const router = useRouter()
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/spotify/check-config")
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        }
      } catch (error) {
        console.error("Error fetching config:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Lädt Konfiguration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-2xl mx-auto">
          <MagicCard className="p-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Fehler beim Laden der Konfiguration</h1>
            <p className="text-neutral-600">Bitte versuche es erneut.</p>
          </MagicCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
            Spotify Setup
          </h1>
          <p className="text-neutral-600">
            Konfigurationshilfe für die Spotify-Verknüpfung
          </p>
        </div>

        {/* Configuration Status */}
        <MagicCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Link2 className="size-6 text-accent-spotify" />
            Konfigurationsstatus
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg">
              <span className="text-sm font-medium text-neutral-700">Client ID</span>
              <div className="flex items-center gap-2">
                {config.configured.clientId ? (
                  <>
                    <CheckCircle2 className="size-5 text-green-600" />
                    <span className="text-sm text-neutral-600">{config.configured.clientIdPreview}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-5 text-red-600" />
                    <span className="text-sm text-red-600">Nicht gesetzt</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg">
              <span className="text-sm font-medium text-neutral-700">Client Secret</span>
              <div className="flex items-center gap-2">
                {config.configured.clientSecret ? (
                  <>
                    <CheckCircle2 className="size-5 text-green-600" />
                    <span className="text-sm text-neutral-600">Gesetzt</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-5 text-red-600" />
                    <span className="text-sm text-red-600">Nicht gesetzt</span>
                  </>
                )}
              </div>
            </div>
            {config.configured.clientId && config.configured.clientIdLength !== 32 && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Client ID hat {config.configured.clientIdLength} Zeichen, sollte aber 32 Zeichen haben.
                </p>
              </div>
            )}
          </div>
        </MagicCard>

        {/* Redirect URI */}
        <MagicCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Redirect URI (WICHTIG!)
          </h2>
          <p className="text-sm text-neutral-600 mb-4">
            Diese URI muss exakt im Spotify Developer Dashboard registriert sein:
          </p>
          <div className="p-4 bg-neutral-100 border-2 border-accent-spotify rounded-lg mb-4">
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm font-mono text-neutral-900 break-all flex-1">
                {config.redirectUri}
              </code>
              <button
                onClick={() => copyToClipboard(config.redirectUri)}
                className="p-2 hover:bg-neutral-200 rounded transition-colors shrink-0"
                title="In Zwischenablage kopieren"
              >
                {copied ? (
                  <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                  <Copy className="size-5 text-neutral-600" />
                )}
              </button>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">So registrierst du die Redirect URI:</p>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Gehe zu <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Spotify Developer Dashboard</a></li>
              <li>Wähle deine App aus</li>
              <li>Klicke auf &quot;Edit Settings&quot;</li>
              <li>Füge die oben angezeigte Redirect URI hinzu</li>
              <li>Speichere die Änderungen</li>
            </ol>
          </div>
        </MagicCard>

        {/* Instructions */}
        <MagicCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Schritt-für-Schritt Anleitung
          </h2>
          <div className="space-y-4">
            {Object.entries(config.instructions).map(([key, value], index) => (
              <div key={key} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-neutral-900 font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <p className="text-sm text-neutral-700 flex-1 pt-1">{value as string}</p>
              </div>
            ))}
          </div>
        </MagicCard>

        {/* Troubleshooting */}
        <MagicCard className="p-6 md:p-8 border-2 border-yellow-300">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Fehlerbehebung
          </h2>
          <div className="space-y-2">
            {Object.entries(config.troubleshooting).map(([key, value]) => (
              <p key={key} className="text-sm text-neutral-700">
                {value as string}
              </p>
            ))}
          </div>
        </MagicCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ShimmerButton
            onClick={() => router.push(`/${locale}/dashboard`)}
            background="var(--color-primary-500)"
            shimmerColor="var(--color-neutral-900)"
            borderRadius="9999px"
            className="flex-1 h-12 font-medium"
          >
            Zurück zum Dashboard
          </ShimmerButton>
          <ShimmerButton
            onClick={() => window.open("https://developer.spotify.com/dashboard", "_blank")}
            background="var(--color-accent-spotify)"
            shimmerColor="var(--color-neutral-900)"
            borderRadius="9999px"
            className="flex-1 h-12 font-medium flex items-center justify-center gap-2"
          >
            <ExternalLink className="size-5" />
            Spotify Dashboard öffnen
          </ShimmerButton>
        </div>
      </div>
    </div>
  )
}
