"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { User, Settings, LogOut, ChevronDown, ArrowLeft, Zap } from "lucide-react"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { MessagesIcon } from "@/components/messaging/MessagesIcon"
import { LanguagePicker } from "@/components/ui/LanguagePicker"
import { UpgradeModal } from "@/components/ui/UpgradeModal"

/**
 * Navbar component for authenticated pages
 * Features: Logo (left), empty center, User dropdown (right)
 */
export function Navbar({ locale }: { locale: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("common")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isProPlan, setIsProPlan] = useState(true) // default true to hide upgrade until loaded
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Check if we can go back (not on dashboard)
  const canGoBack = pathname !== `/${locale}/dashboard` && pathname !== `/${locale}`

  // Fetch user plan status
  useEffect(() => {
    async function checkPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return
      const res = await fetch(`/api/user/plan`)
      if (res.ok) {
        const data = await res.json()
        setIsProPlan(data.proPlan ?? false)
      }
    }
    checkPlan()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-50 border-b border-neutral-300">
      <div className="max-w-container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Back Button + Logo */}
          <div className="flex items-center gap-4">
            {canGoBack && (
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200"
                aria-label={t("back")}
              >
                <ArrowLeft className="size-5 text-neutral-900" />
              </button>
            )}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="spin-slow text-primary-500 size-7 shrink-0">
                <svg viewBox="2 1 36 38" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-7">
                  <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
                  <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
                  <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
                  <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
                  <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
                  <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
                  <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
                </svg>
              </div>
              <span className="font-display text-xl font-black tracking-tight text-neutral-900 hover:text-primary-500 transition-colors duration-200">
                empatify
              </span>
            </Link>
          </div>

          {/* Right Side - Messages Icon + Plan Badge + Language Picker + User Dropdown */}
          <div className="flex items-center gap-2">
            {/* Messages Icon */}
            <MessagesIcon locale={locale} />

            {/* Plan Badge — desktop only, mobile shows plan in dashboard welcome line */}
            {isProPlan ? (
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wider select-none"
                aria-label="Pro plan"
              >
                <Zap className="size-3" />
                Pro
              </span>
            ) : (
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 hover:text-primary-500 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 hover:border-primary-500 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Free plan — click to upgrade"
                title={t("upgrade")}
              >
                Free
              </button>
            )}

            {/* Language Picker */}
            <LanguagePicker locale={locale} />

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200"
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <User className="size-5 text-neutral-900" />
                <ChevronDown
                  className={cn(
                    "size-4 text-neutral-500 transition-transform duration-200",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-100 border border-neutral-300 rounded-lg shadow-lg z-50 overflow-hidden">
                {!isProPlan && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      setIsUpgradeOpen(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-primary-500 hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none transition-colors duration-200 text-left"
                  >
                    <Zap className="size-4" />
                    <span className="text-sm font-semibold">{t("upgrade")}</span>
                  </button>
                )}
                <Link
                  href="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-neutral-900 hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none transition-colors duration-200"
                >
                  <Settings className="size-4" />
                  <span className="text-sm font-medium">{t("settings")}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-neutral-900 hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none transition-colors duration-200 text-left"
                >
                  <LogOut className="size-4" />
                  <span className="text-sm font-medium">{t("logout")}</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </nav>
    <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  )
}

