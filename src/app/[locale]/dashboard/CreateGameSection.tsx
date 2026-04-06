"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MagicCard } from "@/components/ui/magic-card"
import { Music, Loader2, UserPlus } from "lucide-react"
import { InviteFriendsModal } from "@/components/messaging/InviteFriendsModal"

const ROUND_PROMPT_EXAMPLES: Record<string, string[]> = {
  de: [
    'Ein Lied, zu dem dein Vater tanzt',
    'Ein Song für eine Autofahrt',
    'Ein Lied, das dich zum Weinen bringt',
    'Ein Song aus deiner Kindheit',
    'Ein Lied, das auf jeder Party laufen muss',
  ],
  en: [
    'A song your dad dances to',
    'A song for a road trip',
    'A song that makes you cry',
    'A song from your childhood',
    'A song you play at every party',
  ],
  pt: [
    'Uma música que seu pai dança',
    'Uma música para uma viagem de carro',
    'Uma música que te faz chorar',
    'Uma música da sua infância',
    'Uma música que você toca em toda festa',
  ],
  fr: [
    'Une chanson sur laquelle ton père danse',
    'Une chanson pour un road trip',
    'Une chanson qui te fait pleurer',
    'Une chanson de ton enfance',
    'Une chanson que tu mets à chaque fête',
  ],
  es: [
    'Una canción que baila tu papá',
    'Una canción para un viaje por carretera',
    'Una canción que te hace llorar',
    'Una canción de tu infancia',
    'Una canción que pones en cada fiesta',
  ],
}

interface CreateGameSectionProps {
  isProPlan: boolean
  currentUserName: string
}

export function CreateGameSection({
  isProPlan,
  currentUserName,
}: CreateGameSectionProps) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const tLobby = useTranslations("lobby")
  const tCommon = useTranslations("common")
  const tMessaging = useTranslations("messaging")

  const [rounds, setRounds] = useState(5)
  const [category, setCategory] = useState("all")
  const [prompts, setPrompts] = useState<string[]>(Array(5).fill(""))
  const [promptWarnings, setPromptWarnings] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setPrompts((prev) => {
      const next = Array(rounds).fill("")
      return next.map((_, i) => prev[i] ?? "")
    })
  }, [rounds])
  const [showPrompts, setShowPrompts] = useState(false)
  const [isBlind, setIsBlind] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [gameMode, setGameMode] = useState<"single-device" | "multi-device">("multi-device")
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set())
  const localeFromPath =
    typeof window !== "undefined"
      ? window.location.pathname.match(/^\/(de|en|pt|fr|es)(\/|$)/)?.[1] ?? "en"
      : "en"

  const checkPromptViability = async (index: number, value: string) => {
    if (!value.trim()) {
      setPromptWarnings((prev) => { const next = { ...prev }; delete next[index]; return next })
      return
    }
    try {
      const res = await fetch("/api/ai/validate-prompt-viability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setPromptWarnings((prev) => ({ ...prev, [index]: data.viable === false }))
      }
    } catch {
      // Fail silent — don't block creation
    }
  }

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
        roundPrompts: prompts,
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
      const lobbyLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/${localeFromPath}/lobby/${lobbyId}`

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

        {/* Round Prompts */}
        <div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none mb-2">
            <input
              type="checkbox"
              checked={showPrompts}
              onChange={(e) => setShowPrompts(e.target.checked)}
              className="size-4 rounded border-neutral-300 text-primary-500 accent-[#FF6B00] cursor-pointer"
            />
            <span className="text-sm font-medium text-neutral-900">Round Prompts</span>
            <span className="text-xs text-neutral-400">(optional)</span>
          </label>
          {showPrompts && (
            <div className="space-y-2">
              {Array.from({ length: rounds }, (_, i) => {
                const examples = ROUND_PROMPT_EXAMPLES[localeFromPath] ?? ROUND_PROMPT_EXAMPLES.en
                return (
                  <div key={i}>
                    <input
                      value={prompts[i] ?? ""}
                      onChange={(e) => {
                        const next = [...prompts]
                        next[i] = e.target.value
                        setPrompts(next)
                        // Clear warning while typing
                        if (promptWarnings[i]) {
                          setPromptWarnings((prev) => { const n = { ...prev }; delete n[i]; return n })
                        }
                      }}
                      onBlur={(e) => checkPromptViability(i, e.target.value)}
                      placeholder={`Round ${i + 1} — e.g. "${examples[i] ?? examples[0]}"`}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    />
                    {promptWarnings[i] && (
                      <p className="mt-1 text-xs text-yellow-700 flex items-center gap-1">
                        <span>⚠</span>
                        {t("promptNotViable")}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Blind Mode Toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsBlind(!isBlind)}
            className={`relative w-10 h-6 rounded-full transition-all duration-200 ${
              isBlind
                ? "bg-primary-500"
                : "bg-[#555555]"
            }`}
          >
            <span
              className={`absolute top-1 left-1 size-4 bg-white rounded-full shadow transition-transform duration-200 ${
                isBlind ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-900">Blind Mode</span>
            <span className="block text-xs text-neutral-400">
              Submitters hidden until all ratings are in — then everyone guesses who picked what
            </span>
          </div>
        </label>

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
          className="glow-cta w-full h-12 rounded-full font-display font-black text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity duration-200"
          style={{ background: '#FF6B00', color: '#000000' }}
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
    </MagicCard>
  )
}

