"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("dashboard")
  const tLobby = useTranslations("lobby")
  const tCommon = useTranslations("common")

  const [rounds, setRounds] = useState(isProPlan ? 5 : 5)
  const [category, setCategory] = useState("all")
  const [isCreating, setIsCreating] = useState(false)

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
      // TODO: Implement actual lobby creation API call
      // const response = await fetch("/api/lobby/create", {
      //   method: "POST",
      //   body: JSON.stringify({ rounds, category: category === "all" ? null : category }),
      // })
      console.log("Creating lobby with:", { rounds, category })
      // Temporary: just log for now
      setTimeout(() => setIsCreating(false), 1000)
    } catch (error) {
      console.error("Error creating lobby:", error)
      setIsCreating(false)
    }
  }

  return (
    <MagicCard
      className="p-8 rounded-2xl shadow-lg"
      gradientFrom="#FF6B00"
      gradientTo="#E65F00"
      gradientSize={400}
    >
      <div className="flex items-center gap-3 mb-6">
        <Music className="size-6 text-primary-500" />
        <h2 className="text-2xl font-bold text-neutral-900">
          {t("createGame")}
        </h2>
      </div>

      <div className="space-y-6">
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
          background="#FF6B00"
          shimmerColor="#ffffff"
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

