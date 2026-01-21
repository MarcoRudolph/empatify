"use client"

import { useState, useEffect } from "react"
import { X, Cookie } from "lucide-react"
import { MagicCard } from "./magic-card"
import { ShimmerButton } from "./shimmer-button"
import Link from "next/link"
import { useTranslations } from "next-intl"

/**
 * Cookie Consent Banner Component
 * Follows design.mdc and GDPR requirements
 * Stores consent decision in localStorage
 */
export function CookieConsent() {
  const t = useTranslations("cookies")
  const tCommon = useTranslations("common")
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    localStorage.setItem("cookie-consent-timestamp", new Date().toISOString())
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    localStorage.setItem("cookie-consent-timestamp", new Date().toISOString())
    setIsVisible(false)
  }

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <MagicCard
          className="p-4 md:p-6 rounded-2xl shadow-2xl border border-neutral-300 bg-white"
          gradientFrom="var(--color-primary-500)"
          gradientTo="var(--color-accent-spotify)"
          gradientSize={350}
        >
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <Cookie className="size-6 text-primary-500 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-2">
                  🍪 {t("title")}
                </h3>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {t("description")}
                </p>
                <p className="text-xs text-neutral-600 mt-2">
                  {t("moreInfo")}{" "}
                  <Link 
                    href="/datenschutz" 
                    className="text-primary-600 hover:text-primary-700 underline font-medium"
                  >
                    {t("privacyPolicy")}
                  </Link>
                  .
                </p>
              </div>
              <button
                onClick={handleDecline}
                className="text-neutral-500 hover:text-neutral-900 transition-colors shrink-0 p-1 hover:bg-neutral-100 rounded-lg"
                aria-label={t("decline")}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-2 text-xs md:text-sm">
              <div className="flex items-start gap-2 text-neutral-700">
                <span className="text-primary-600 font-bold shrink-0">✓</span>
                <div>
                  <span className="font-semibold text-neutral-900">{t("essential")}:</span> 
                  {" "}{t("essentialDescription")}
                </div>
              </div>
              <div className="flex items-start gap-2 text-neutral-700">
                <span className="text-neutral-400 font-bold shrink-0">○</span>
                <div>
                  <span className="font-semibold text-neutral-900">{t("analytics")}:</span> 
                  {" "}{t("analyticsDescription")}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <ShimmerButton
                onClick={handleAccept}
                background="var(--color-primary-500)"
                shimmerColor="var(--color-neutral-900)"
                borderRadius="9999px"
                className="flex-1 h-11 px-6 text-sm font-bold"
              >
                {t("acceptAll")}
              </ShimmerButton>
              <button
                onClick={handleDecline}
                className="flex-1 h-11 px-6 text-sm font-bold border-2 border-neutral-300 rounded-full bg-white text-neutral-900 hover:bg-neutral-100 hover:border-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200"
              >
                {t("onlyEssential")}
              </button>
            </div>
          </div>
        </MagicCard>
      </div>
    </div>
  )
}
