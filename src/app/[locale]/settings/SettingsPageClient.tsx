"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toPng } from "html-to-image"
import { ShareSoulModal } from "@/components/ui/ShareSoulModal"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { User, Trash2, Save, Loader2, Link2, Unlink, Camera, Upload, Image as ImageIcon, Share2 } from "lucide-react"

/** Flower-of-life derived icon — 7 overlapping circles, stroke only */
function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 1 36 38"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      {/* center */}
      <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
      {/* top */}
      <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
      {/* top-right */}
      <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
      {/* bottom-right */}
      <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
      {/* bottom */}
      <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
      {/* bottom-left */}
      <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
      {/* top-left */}
      <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
    </svg>
  );
}

/**
 * Client component for Settings page
 * Handles user interactions and state management
 */
export function SettingsPageClient({
  locale,
  user,
  dbUser,
  isSpotifyLinked,
}: {
  locale: string
  user: any
  dbUser: any
  isSpotifyLinked: boolean
}) {
  const router = useRouter()
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const tDashboard = useTranslations("dashboard")
  const tViral = useTranslations("viralCard")
  const tShare = useTranslations("share")
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(
    user.user_metadata?.display_name || user.email?.split("@")[0] || ""
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.user_metadata?.avatar_url || null
  )
  const [isUploading, setIsUploading] = useState(false)
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
  const [isSharing, setIsSharing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const viralCardRef = useRef<HTMLDivElement>(null)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update User Profile in DB
      const response = await fetch("/api/user/update-avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      })

      if (!response.ok) throw new Error("Failed to update avatar URL")

      setAvatarUrl(publicUrl)
      setSuccess(t("nameUpdateSuccess")) // Reusing name update success or adding new key
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error uploading avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const shareHandle = dbUser?.name || displayName
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://empatify.de"}/${locale}/u/${encodeURIComponent(shareHandle)}`

  const handleOpenShare = () => {
    setShareOpen(true)
  }

  const handleDownloadCardPng = async () => {
    const node = viralCardRef.current
    if (!node) return

    const fileName = `sonic-soul-${shareHandle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`

    setIsSharing(true)
    setError(null)
    setSuccess(null)

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
        filter: (el) => {
          if (!(el instanceof HTMLElement)) return true
          return el.dataset.html2imageIgnore !== "true"
        },
      })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = fileName
      link.click()
    } catch (err) {
      const e = err as { name?: string; message?: string }
      console.error("Error generating sonic soul image:", err)
      setError(e?.message || "Could not generate the image")
    } finally {
      setIsSharing(false)
    }
  }

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
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            {t("title")}
          </h1>
        </div>

        {/* Settings Content */}
        <div className="max-w-2xl mx-auto">
          {/* Profile Section */}
          <MagicCard
            className="p-8 rounded-2xl shadow-lg mb-8"
            gradientFrom="var(--color-primary-500)"
            gradientTo="var(--color-primary-600)"
            gradientSize={400}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
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

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="size-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-neutral-100 flex items-center justify-center relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="size-16 text-neutral-300" />
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="size-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-2 bg-primary-500 rounded-full text-white shadow-lg cursor-pointer hover:bg-primary-600 transition-colors border-2 border-white"
                >
                  <Camera className="size-5" />
                  <input 
                    id="avatar-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-500">
                {t("uploadAvatar")}
              </p>
            </div>

            {/* Display Name Input */}
            <div className="mb-6">
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-neutral-900 mb-2 text-center"
              >
                {t("displayName")}
              </label>
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-center">
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
              <label className="block text-sm font-medium text-neutral-500 mb-2 text-center">
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
            <div className="flex items-center justify-center gap-3 mb-6">
              <Link2 className="size-6 text-accent-spotify" />
              <h2 className="text-2xl font-bold text-neutral-900">
                {t("spotifyConnection")}
              </h2>
            </div>

            {spotifyLinked ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 p-4 bg-accent-spotify/10 border border-accent-spotify/30 rounded-lg w-full">
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
                <div className="flex items-center justify-center gap-3 p-4 bg-neutral-100 border border-neutral-300 rounded-lg">
                  <div className="size-2 bg-neutral-400 rounded-full"></div>
                  <span className="text-sm font-medium text-neutral-500">
                    {t("spotifyNotConnected")}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mb-6 text-center">
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

          {/* Viral Card Section (Free & Pro) */}
          <MagicCard
            className="p-0 rounded-3xl shadow-2xl mb-12 overflow-hidden border border-white/20 bg-neutral-950"
            gradientFrom={dbUser?.proPlan ? "#FF6B00" : "#333333"}
            gradientTo={dbUser?.proPlan ? "#FF9D00" : "#111111"}
            gradientSize={600}
          >
            <div ref={viralCardRef} className="p-8 md:p-10 relative min-h-[550px] flex flex-col justify-between overflow-hidden bg-neutral-950">
              
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>
              
              {/* Header */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="size-28 rounded-full overflow-hidden border-2 border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-6 bg-neutral-900">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <User className="size-12" />
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                  {displayName}
                </h2>
                <p className="text-primary-500 font-black text-xs tracking-[0.2em] uppercase italic">
                  {tViral("title")}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="relative z-10 grid grid-cols-1 gap-6 my-10">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mb-4 font-black">
                    {tViral("topSongs")}
                  </p>
                  <div className="space-y-4">
                    {(dbUser?.topSongs && dbUser.topSongs.length > 0) ? (
                      dbUser.topSongs.slice(0, 3).map((song: string, i: number) => (
                        <div key={i} className="flex items-center gap-4 group">
                          <span className="text-primary-500 font-black italic text-lg group-hover:scale-110 transition-transform">#{i+1}</span>
                          <span className="text-white font-bold truncate text-base">{song}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-600 italic text-sm py-2">Play more games to reveal your sonic fingerprint...</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl text-center">
                    <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2 font-black">
                      Empathy
                    </p>
                    <p className="text-3xl font-black text-white italic">
                      {dbUser?.averageRatingReceived || "0.0"}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl text-center">
                    <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2 font-black">
                      Games
                    </p>
                    <p className="text-3xl font-black text-white">
                      {dbUser?.totalGamesPlayed || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer / Branding */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-8 mt-4">
                <div className="flex items-center gap-3">
                  <div className="spin-slow text-primary-500 size-8 shrink-0">
                    <FlowerIcon className="size-8" />
                  </div>
                  <span className="font-black text-2xl tracking-tighter text-white" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                    empatify
                  </span>
                </div>
                
                <button
                  onClick={handleOpenShare}
                  disabled={isSharing}
                  data-html2image-ignore="true"
                  className="bg-white text-black hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {isSharing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Share2 className="size-4" />
                  )}
                  {t("shareViralCard")}
                </button>
              </div>
            </div>
          </MagicCard>

          {/* Danger Zone */}
          <MagicCard
            className="p-8 rounded-2xl shadow-lg border-2 border-red-500/20"
            gradientFrom="var(--color-primary-500)"
            gradientTo="var(--color-primary-600)"
            gradientSize={400}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Trash2 className="size-6 text-red-600" />
              <h2 className="text-2xl font-bold text-neutral-900">
                {t("dangerZone")}
              </h2>
            </div>

            <p className="text-sm text-neutral-500 mb-6 text-center">
              {t("deleteAccountWarning")}
            </p>

            <div className="flex justify-center">
            <ShimmerButton
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              background="var(--color-error)"
              shimmerColor="var(--color-neutral-900)"
              borderRadius="9999px"
              className="w-full md:w-auto px-6 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </MagicCard>
        </div>
      </div>

      <ShareSoulModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        onDownloadImage={handleDownloadCardPng}
        labels={{
          title: tShare("title"),
          copy: tShare("copy"),
          copied: tShare("copied"),
          download: tShare("download"),
          caption: tShare("caption", { name: displayName }),
        }}
      />
    </div>
  )
}

