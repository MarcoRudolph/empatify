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
  const tDashboard = useTranslations("dashboard")
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(
    user.user_metadata?.display_name || user.email?.split("@")[0] || ""
  )
  const [originalName] = useState(
    user.user_metadata?.display_name || user.email?.split("@")[0] || ""
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnlinkingSpotify, setIsUnlinkingSpotify] = useState(false)
  const [spotifyLinked, setSpotifyLinked] = useState(isSpotifyLinked)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleSaveName = async () => {
    // Reset errors
    setError(null)
    setSuccess(null)
    setNameError(null)

    // Validate name
    const trimmedName = displayName.trim()
    if (!trimmedName || trimmedName.length === 0) {
      setNameError(t("nameRequired"))
      return
    }

    // If name hasn't changed, don't do anything
    if (trimmedName === originalName) {
      setSuccess("Keine Änderungen")
      return
    }

    setIsSaving(true)
    setIsChecking(true)

    try {
      // First check if name is available
      const checkResponse = await fetch(`/api/user/check-name?name=${encodeURIComponent(trimmedName)}`)
      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error(checkData.error?.message || "Fehler beim Prüfen des Namens")
      }

      if (!checkData.available) {
        setNameError(t("nameAlreadyTaken"))
        setIsSaving(false)
        setIsChecking(false)
        return
      }

      // Name is available, update it
      const updateResponse = await fetch("/api/user/update-name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      })

      const updateData = await updateResponse.json()

      if (!updateResponse.ok) {
        if (updateData.error?.code === "NAME_ALREADY_TAKEN") {
          setNameError(t("nameAlreadyTaken"))
        } else {
          throw new Error(updateData.error?.message || t("nameUpdateError"))
        }
        setIsSaving(false)
        setIsChecking(false)
        return
      }

      const successMessage = t("nameUpdateSuccess")
      // Fallback if translation is not found
      setSuccess(successMessage || "Name erfolgreich gespeichert")
      // Update original name to reflect the change
      setDisplayName(trimmedName)
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern")
    } finally {
      setIsSaving(false)
      setIsChecking(false)
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
            gradientFrom="var(--color-primary-500)"
            gradientTo="var(--color-primary-600)"
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
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      setNameError(null) // Clear error when user types
                    }}
                    className={`w-full px-4 py-3 border rounded-lg bg-neutral-50 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:border-transparent transition-all duration-200 ${
                      nameError
                        ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
                        : "border-neutral-300 focus-visible:ring-primary-500"
                    }`}
                    placeholder={t("displayName")}
                    disabled={isSaving || isChecking}
                  />
                  {nameError && (
                    <p className="mt-2 text-sm text-[var(--color-error)]">
                      {nameError}
                    </p>
                  )}
                </div>
                <ShimmerButton
                  onClick={handleSaveName}
                  disabled={isSaving || isChecking || displayName.trim() === originalName}
                  background="var(--color-primary-500)"
                  shimmerColor="var(--color-neutral-900)"
                  borderRadius="9999px"
                  className="px-6 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isSaving || isChecking ? (
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
            gradientFrom="var(--color-accent-spotify)"
            gradientTo="var(--color-accent-spotify)"
            gradientSize={400}
          >
            <div className="flex items-center gap-3 mb-6">
              <Link2 className="size-6 text-accent-spotify" />
              <h2 className="text-2xl font-bold text-neutral-900">
                {t("spotifyConnection")}
              </h2>
            </div>

            {spotifyLinked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-accent-spotify/10 border border-accent-spotify/30 rounded-lg">
                  <div className="size-2 bg-accent-spotify rounded-full"></div>
                  <span className="text-sm font-medium text-neutral-900">
                    {t("spotifyConnected")}
                  </span>
                </div>
                <ShimmerButton
                  onClick={handleUnlinkSpotify}
                  disabled={isUnlinkingSpotify}
                  background="var(--color-error)"
                  shimmerColor="var(--color-neutral-900)"
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
                <p className="text-sm text-neutral-500 mb-6">
                  {t("spotifyNotConnectedDescription")}
                </p>
                <ShimmerButton
                  onClick={() => {
                    window.location.href = "/api/spotify/auth"
                  }}
                  background="var(--color-accent-spotify)"
                  shimmerColor="var(--color-neutral-900)"
                  borderRadius="9999px"
                  className="w-full h-16 md:h-20 text-lg md:text-xl font-bold flex items-center justify-center gap-4 shadow-[0_0_25px_rgba(29,185,84,0.5)] hover:shadow-[0_0_35px_rgba(29,185,84,0.7)] active:scale-[0.98] transition-all duration-200 border-2 border-accent-spotify/30"
                >
                  <Link2 className="size-7 md:size-8" />
                  <span className="text-neutral-900">{tDashboard("linkSpotify")}</span>
                </ShimmerButton>
              </div>
            )}
          </MagicCard>

          {/* Danger Zone */}
          <MagicCard
            className="p-8 rounded-2xl shadow-lg border-2 border-red-500/20"
            gradientFrom="var(--color-primary-500)"
            gradientTo="var(--color-primary-600)"
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
              background="var(--color-error)"
              shimmerColor="var(--color-neutral-900)"
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

