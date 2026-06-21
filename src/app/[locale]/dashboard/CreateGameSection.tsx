"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MagicCard } from "@/components/ui/magic-card"
import { Info, Loader2, Music, UserPlus, X } from "lucide-react"
import { InviteFriendsModal } from "@/components/messaging/InviteFriendsModal"

interface CreateGameSectionProps {
  isProPlan: boolean
  currentUserName: string
}

export function CreateGameSection({
  currentUserName,
}: CreateGameSectionProps) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const tLobby = useTranslations("lobby")
  const tCommon = useTranslations("common")
  const tMessaging = useTranslations("messaging")

  const [rounds, setRounds] = useState(5)
  const [category, setCategory] = useState("all")
  const [isBlind, setIsBlind] = useState(false)
  const [isBlindModeInfoOpen, setIsBlindModeInfoOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [gameMode, setGameMode] = useState<"single-device" | "multi-device">("multi-device")
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set())
  const localeFromPath =
    typeof window !== "undefined"
      ? window.location.pathname.match(/^\/(de|en|pt|fr|es)(\/|$)/)?.[1] ?? "en"
      : "en"

  const categories = [
    { value: "all", label: tLobby("categoryAll") },
    { value: "60s", label: tLobby("category60s") },
    { value: "70s", label: tLobby("category70s") },
    { value: "80s", label: tLobby("category80s") },
    { value: "90s", label: tLobby("category90s") },
    { value: "2000s", label: tLobby("category2000s") },
    { value: "2010s", label: tLobby("category2010s") },
    { value: "2020s", label: tLobby("category2020s") },
    { value: "schlager", label: tLobby("categorySchlager") },
    { value: "techno", label: tLobby("categoryTechno") },
    { value: "hiphop-rnb", label: tLobby("categoryHipHopRnB") },
    { value: "rock", label: tLobby("categoryRock") },
    { value: "dubstep", label: tLobby("categoryDubstep") },
    { value: "pop", label: tLobby("categoryPop") },
    { value: "jazz", label: tLobby("categoryJazz") },
    { value: "country", label: tLobby("categoryCountry") },
    { value: "electronic", label: tLobby("categoryElectronic") },
    { value: "indie", label: tLobby("categoryIndie") },
  ]

  const handleCreateGame = async () => {
    setIsCreating(true)
    try {
      const requestBody = {
        rounds,
        category: category === "all" ? null : category,
        gameMode,
        isBlind,
      }
      console.log("Creating lobby with:", requestBody)
      
      const response = await fetch("/api/lobby/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        
        // Comprehensive error logging
        console.error("=".repeat(80))
        console.error("❌ LOBBY CREATION FAILED - CLIENT SIDE")
        console.error("=".repeat(80))
        console.error("📋 Request:", {
          url: "/api/lobby/create",
          method: "POST",
          body: requestBody,
        })
        console.error("📋 Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
        })
        console.error("📋 Error Details:", {
          message: errorData.error?.message,
          code: errorData.error?.code,
          pgCode: errorData.error?.pgCode,
          pgDetail: errorData.error?.pgDetail,
          pgHint: errorData.error?.pgHint,
          drizzleQuery: errorData.error?.drizzleQuery,
          drizzleParams: errorData.error?.drizzleParams,
        })
        console.error("=".repeat(80))
        
        // Create user-friendly error message
        let errorMessage = errorData.error?.message || "Failed to create lobby"
        if (errorData.error?.pgHint) {
          errorMessage += `\n\nHint: ${errorData.error.pgHint}`
        }
        if (errorData.error?.pgCode === "42703") {
          errorMessage += "\n\n💡 This looks like a missing database column. Please run the migration."
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Lobby created:", data)

      if (!data.lobby?.id) {
        throw new Error("No lobby ID in response")
      }

      const lobbyId = data.lobby.id
      // Send invites if friends were selected
      if (selectedFriendIds.size > 0) {
        try {
          // Use special format for lobby invites that will be styled nicely in chat
          const message = `__LOBBY_INVITE__:${currentUserName}:${lobbyId}`

          const inviteResponse = await fetch("/api/messages/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipientIds: Array.from(selectedFriendIds),
              content: message,
              lobbyId: lobbyId,
            }),
          })

          if (inviteResponse.ok) {
            console.log("Invites sent successfully")
          } else {
            console.error("Failed to send invites, but lobby was created")
          }
        } catch (inviteError) {
          console.error("Error sending invites:", inviteError)
          // Don't fail the whole operation if invites fail
        }
      }

      // Redirect to lobby
      router.push(`/${localeFromPath}/lobby/${lobbyId}`)
    } catch (error) {
      console.error("Error creating lobby:", error)
      setIsCreating(false)
      alert(error instanceof Error ? error.message : "Failed to create lobby. Please try again.")
    }
  }

  return (
    <MagicCard
      className="p-8 rounded-2xl shadow-lg"
      gradientFrom="var(--color-primary-500)"
      gradientTo="var(--color-primary-600)"
      gradientSize={400}
    >
      <div className="flex items-center gap-3 mb-6">
        <Music className="size-6 text-primary-500" />
        <h2 className="text-2xl font-bold text-neutral-900">
          {t("createGame")}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Game Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-3">
            {t("gameMode")}
          </label>
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg border border-neutral-300">
            <button
              type="button"
              onClick={() => setGameMode("single-device")}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                gameMode === "single-device"
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {t("gameModeSingleDevice")}
            </button>
            <button
              type="button"
              onClick={() => setGameMode("multi-device")}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                gameMode === "multi-device"
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {t("gameModeMultiDevice")}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {gameMode === "single-device"
              ? t("gameModeSingleDeviceDescription")
              : t("gameModeMultiDeviceDescription")}
          </p>
        </div>

        {/* Rounds Dropdown */}
        <div>
          <label
            htmlFor="rounds"
            className="block text-sm font-medium text-neutral-900 mb-2"
          >
            {tLobby("rounds")}
          </label>
          <select
            id="rounds"
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-neutral-900 mb-2"
          >
            {tLobby("category")}
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Blind Mode Toggle */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setIsBlind(!isBlind)}
            role="switch"
            aria-checked={isBlind}
            aria-labelledby="blind-mode-label"
            className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 ${
              isBlind
                ? "bg-[#FF6B00] border-[#FF6B00] shadow-[0_0_0_2px_rgba(255,107,0,0.25)]"
                : "bg-[#555555] border-[#6B6B6B]"
            }`}
          >
            <span
              className={`absolute left-1 top-1 size-4 rounded-full bg-white shadow transition-transform duration-200 ${
                isBlind ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span id="blind-mode-label" className="text-sm font-medium text-neutral-900">
                {t("blindMode")}
              </span>
              <button
                type="button"
                onClick={() => setIsBlindModeInfoOpen(true)}
                aria-label={t("blindModeInfoLabel")}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Info className="size-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {t("blindModeShortDescription")}
            </p>
          </div>
        </div>

        {/* Invite Friends Button - Prominent */}
        {selectedFriendIds.size > 0 ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="w-1/2 h-12 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 border-2 border-primary-500 text-primary-600 hover:text-primary-700 font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="size-5" />
              <span>{tMessaging("inviteFriends")}</span>
            </button>
            <p className="flex-1 text-sm text-neutral-900 font-medium">
              {selectedFriendIds.size} {selectedFriendIds.size === 1 ? tMessaging("friendWillBeInvited") : tMessaging("friendsWillBeInvited")}
            </p>
          </div>
        ) : (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full h-12 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 border-2 border-primary-500 text-primary-600 hover:text-primary-700 font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="size-5" />
            <span>{tMessaging("inviteFriends")}</span>
          </button>
        )}

        {/* Create Button */}
        <button
          type="button"
          onClick={handleCreateGame}
          disabled={isCreating}
          className="glow-cta w-full h-12 rounded-full font-display font-black text-base text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity duration-200"
          style={{ backgroundColor: '#FF6B00', color: '#FFFFFF' }}
        >
          {isCreating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{tCommon("loading")}</span>
            </>
          ) : (
            <>
              <Music className="size-4" />
              <span>{t("createGame")}</span>
            </>
          )}
        </button>
      </div>

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        lobbyId={null}
        lobbyLink=""
        senderName={currentUserName}
        onFriendsSelected={setSelectedFriendIds}
        selectedFriendIds={selectedFriendIds}
      />

      {isBlindModeInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setIsBlindModeInfoOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="blind-mode-modal-title"
            className="relative w-full max-w-md rounded-3xl border border-neutral-300 bg-neutral-100 p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsBlindModeInfoOpen(false)}
              aria-label={t("blindModeModalClose")}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-300 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            <div className="pr-10">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-500">
                {t("blindModeModalEyebrow")}
              </p>
              <h3 id="blind-mode-modal-title" className="text-2xl font-bold text-neutral-900">
                {t("blindModeModalTitle")}
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-neutral-700">
              {t("blindModeModalIntro")}
            </p>

            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-neutral-300 bg-neutral-200/60 p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                    {item}
                  </span>
                  <p className="text-sm leading-5 text-neutral-700">
                    {t(`blindModeModalPoint${item}`)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 rounded-2xl bg-primary-500/10 p-3 text-sm font-medium leading-5 text-neutral-900">
              {t("blindModeModalBottomLine")}
            </p>
          </div>
        </div>
      )}
    </MagicCard>
  )
}

