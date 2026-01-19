"use client"

import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Music } from "lucide-react"
import { useTranslations } from "next-intl"

/**
 * Create Game Button Component
 * Quick action button that scrolls to the create game section
 */
export function CreateGameButton({ locale }: { locale: string }) {
  const t = useTranslations("dashboard")

  const handleClick = () => {
    const element = document.getElementById("create-game")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <ShimmerButton
      onClick={handleClick}
      background="var(--color-primary-500)"
      shimmerColor="var(--color-neutral-900)"
      borderRadius="9999px"
      className="w-full md:w-[400px] h-16 font-medium flex items-center justify-center gap-3"
    >
      <Music className="size-6" />
      <span>{t("createGame")}</span>
    </ShimmerButton>
  )
}
