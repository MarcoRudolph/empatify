"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Music, Loader2 } from "lucide-react"

interface CreateGameSectionProps {
  isSpotifyLinked: boolean
  isProPlan: boolean
}

export function CreateGameSection({
  isSpotifyLinked,
  isProPlan,
}: CreateGameSectionProps) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const tLobby = useTranslations("lobby")
  const tCommon = useTranslations("common")

  const [rounds, setRounds] = useState(isProPlan ? 5 : 5)
  const [category, setCategory] = useState("all")
  const [isCreating, setIsCreating] = useState(false)
  const [gameMode, setGameMode] = useState<"single-device" | "multi-device">("multi-device")

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
    if (!isSpotifyLinked) return

    setIsCreating(true)
    try {
      const requestBody = {
        rounds,
        category: category === "all" ? null : category,
        gameMode,
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

      // Redirect to lobby page
      if (data.lobby?.id) {
        console.log("Redirecting to:", `/lobby/${data.lobby.id}`)
        router.push(`/lobby/${data.lobby.id}`)
      } else {
        throw new Error("No lobby ID in response")
      }
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
              disabled={!isSpotifyLinked}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                gameMode === "single-device"
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t("gameModeSingleDevice")}
            </button>
            <button
              type="button"
              onClick={() => setGameMode("multi-device")}
              disabled={!isSpotifyLinked}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                gameMode === "multi-device"
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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
            disabled={!isProPlan || !isSpotifyLinked}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
          >
            {isProPlan ? (
              Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))
            ) : (
              <option value={5}>5</option>
            )}
          </select>
          {!isProPlan && (
            <p className="mt-1 text-xs text-neutral-500">
              {t("freePlanRoundsNote")}
            </p>
          )}
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
            disabled={!isProPlan || !isSpotifyLinked}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {!isProPlan && (
            <p className="mt-1 text-xs text-neutral-500">
              {t("freePlanCategoryNote")}
            </p>
          )}
        </div>

        {/* Create Button */}
        <ShimmerButton
          onClick={handleCreateGame}
          disabled={!isSpotifyLinked || isCreating}
          background="var(--color-primary-500)"
          shimmerColor="var(--color-neutral-900)"
          borderRadius="9999px"
          className="w-full h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>{tCommon("loading")}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Music className="size-4" />
              <span>{t("createGame")}</span>
            </span>
          )}
        </ShimmerButton>
      </div>
    </MagicCard>
  )
}

