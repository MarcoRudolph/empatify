"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { User, Trash2, Save, Loader2, Link2, Unlink } from "lucide-react"

/**
 * Client component for Settings page
 * Handles user interactions and state management
 */
export function SettingsPageClient({
  locale,
  user,
  isSpotifyLinked,
}: {
  locale: string
  user: any
  isSpotifyLinked: boolean
}) {
  const router = useRouter()
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(
    user.user_metadata?.display_name || user.email?.split("@")[0] || ""
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnlinkingSpotify, setIsUnlinkingSpotify] = useState(false)
  const [spotifyLinked, setSpotifyLinked] = useState(isSpotifyLinked)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSaveName = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })

      if (error) throw error

      setSuccess("Name erfolgreich gespeichert")
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlinkSpotify = async () => {
    if (!confirm(t("unlinkSpotifyConfirm"))) {
      return
    }

    setIsUnlinkingSpotify(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/spotify/unlink", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || t("unlinkSpotifyError"))
      }

      setSpotifyLinked(false)
      setSuccess(t("unlinkSpotifySuccess"))
      router.refresh()
    } catch (err: any) {
      setError(err.message || t("unlinkSpotifyError"))
    } finally {
      setIsUnlinkingSpotify(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm(t("deleteAccountConfirm"))) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      // Call API route to delete user
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Fehler beim Löschen des Kontos")
      }

      // Sign out
      await supabase.auth.signOut()
      router.push(`/${locale}/login`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Fehler beim Löschen des Kontos")
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
      {/* Background Pattern */}
      <DotPattern
        className="opacity-[0.08]"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-container mx-auto px-6 pt-24 pb-12 md:pt-28 md:pb-20">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            {t("title")}
          </h1>
        </div>

        {/* Settings Content */}
        <div className="max-w-2xl">
          {/* Profile Section */}
          <MagicCard
            className="p-8 rounded-2xl shadow-lg mb-8"
            gradientFrom="#FF6B00"
            gradientTo="#E65F00"
            gradientSize={400}
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="size-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-neutral-900">
                {t("profile")}
              </h2>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-neutral-100 border border-neutral-300 rounded-lg text-sm text-neutral-900">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-neutral-100 border border-neutral-300 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Display Name Input */}
            <div className="mb-6">
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-neutral-900 mb-2"
              >
                {t("displayName")}
              </label>
              <div className="flex gap-3">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200"
                  placeholder={t("displayName")}
                />
                <ShimmerButton
                  onClick={handleSaveName}
                  disabled={isSaving}
                  background="#FF6B00"
                  shimmerColor="#ffffff"
                  borderRadius="9999px"
                  className="px-6 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{tCommon("loading")}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="size-4" />
                      <span>{tCommon("save")}</span>
                    </span>
                  )}
                </ShimmerButton>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-500 cursor-not-allowed"
              />
            </div>
          </MagicCard>

          {/* Spotify Connection Section */}
          <MagicCard
            className="p-8 rounded-2xl shadow-lg mb-8"
            gradientFrom="#1DB954"
            gradientTo="#1AA34A"
            gradientSize={400}
          >
            <div className="flex items-center gap-3 mb-6">
              <Link2 className="size-6 text-[#1DB954]" />
              <h2 className="text-2xl font-bold text-neutral-900">
                {t("spotifyConnection")}
              </h2>
            </div>

            {spotifyLinked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-lg">
                  <div className="size-2 bg-[#1DB954] rounded-full"></div>
                  <span className="text-sm font-medium text-neutral-900">
                    {t("spotifyConnected")}
                  </span>
                </div>
                <ShimmerButton
                  onClick={handleUnlinkSpotify}
                  disabled={isUnlinkingSpotify}
                  background="#DC2626"
                  shimmerColor="#ffffff"
                  borderRadius="9999px"
                  className="w-full md:w-auto px-6 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnlinkingSpotify ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{tCommon("loading")}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Unlink className="size-4" />
                      <span>{t("unlinkSpotify")}</span>
                    </span>
                  )}
                </ShimmerButton>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-neutral-100 border border-neutral-300 rounded-lg">
                  <div className="size-2 bg-neutral-400 rounded-full"></div>
                  <span className="text-sm font-medium text-neutral-500">
                    {t("spotifyNotConnected")}
                  </span>
                </div>
                <p className="text-sm text-neutral-500">
                  {t("spotifyNotConnectedDescription")}
                </p>
              </div>
            )}
          </MagicCard>

          {/* Danger Zone */}
          <MagicCard
            className="p-8 rounded-2xl shadow-lg border-2 border-red-500/20"
            gradientFrom="#FF6B00"
            gradientTo="#E65F00"
            gradientSize={400}
          >
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="size-6 text-red-600" />
              <h2 className="text-2xl font-bold text-neutral-900">
                {t("dangerZone")}
              </h2>
            </div>

            <p className="text-sm text-neutral-500 mb-6">
              {t("deleteAccountWarning")}
            </p>

            <ShimmerButton
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              background="#DC2626"
              shimmerColor="#ffffff"
              borderRadius="9999px"
              className="px-6 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{tCommon("loading")}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="size-4" />
                  <span>{t("deleteAccount")}</span>
                </span>
              )}
            </ShimmerButton>
          </MagicCard>
        </div>
      </div>
    </div>
  )
}

