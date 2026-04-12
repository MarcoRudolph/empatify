import { useState } from "react"
import { X, Check, Zap, Music2, Shuffle, Star, Loader2 } from "lucide-react"
import { ShimmerButton } from "@/components/ui/shimmer-button"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

const FREE_FEATURES = [
  "Up to 3 players per lobby",
  "1–10 rounds, free choice",
  "Category games — 4-week free trial (up to $1 AI cost)",
  "Friends & in-game messaging",
  "Last 3 games history",
  "Playlist export (Top 3 songs)",
  "Post-game Mood Card (blurred preview)",
]

const PRO_FEATURES: { text: string; highlight?: boolean }[] = [
  { text: "Unlimited players per lobby", highlight: true },
  { text: "1–10 rounds, free choice" },
  { text: "All music categories — always on (80s, Hip-Hop, Techno…)", highlight: true },
  { text: "Round Prompts — give each round a theme", highlight: true },
  { text: "Blind Mode — hide who submitted which song", highlight: true },
  { text: "Friends & in-game messaging" },
  { text: "Full game history + Top 5 songs stat", highlight: true },
  { text: "Full playlist export", highlight: true },
  { text: "Post-game Mood Card — full & shareable", highlight: true },
]

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("Failed to create checkout session:", data.error)
        alert(data.error?.message || "Failed to start checkout. Please try again.")
      }
    } catch (error) {
      console.error("Error during upgrade:", error)
      alert("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl bg-neutral-50 rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200 shrink-0">
          <div>
            <h2 className="font-display text-2xl font-black tracking-tight text-neutral-900">
              Choose your plan
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Unlock the full Empatify experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cards - Scrollable area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-5 flex flex-col">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-300 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-3">
                  <Music2 className="size-3.5" />
                  Free Plan
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-neutral-900">€0</span>
                  <span className="text-sm text-neutral-500">/ 4-week trial</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-5">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check className="size-4 text-neutral-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <div className="w-full py-2.5 rounded-lg border border-neutral-300 bg-neutral-200 text-center text-sm font-semibold text-neutral-700 cursor-default select-none">
                  Current Plan
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="rounded-xl border-2 border-primary-500 bg-neutral-200 p-5 flex flex-col relative overflow-hidden shadow-lg shadow-primary-500/10">
              {/* Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="mb-4 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-semibold uppercase tracking-wider mb-3">
                  <Zap className="size-3.5" />
                  Pro Plan
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-neutral-900">€4.99</span>
                  <span className="text-sm text-neutral-500">/ month</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-5 relative">
                {PRO_FEATURES.map(({ text, highlight }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check className={`size-4 shrink-0 mt-0.5 ${highlight ? "text-primary-500" : "text-neutral-400"}`} />
                    {text}
                  </li>
                ))}
              </ul>

              <ShimmerButton
                background="var(--color-primary-500)"
                shimmerColor="var(--color-neutral-900)"
                borderRadius="9999px"
                className="w-full h-11 font-semibold"
                disabled={isLoading}
                onClick={handleUpgrade}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Star className="size-4" />
                  )}
                  {isLoading ? "Loading..." : "Upgrade to Pro"}
                </span>
              </ShimmerButton>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 text-center border-t border-neutral-200 pt-4 shrink-0">
          <p className="text-xs text-neutral-400">
            Questions? Contact{" "}
            <a
              href="mailto:marco@rudolpho-ai.de"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              marco@rudolpho-ai.de
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

