"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { User, Settings, LogOut, ChevronDown, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { MessagesIcon } from "@/components/messaging/MessagesIcon"
import { LanguagePicker } from "@/components/ui/LanguagePicker"

/**
 * Navbar component for authenticated pages
 * Features: Logo (left), empty center, User dropdown (right)
 */
export function Navbar({ locale }: { locale: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("common")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Check if we can go back (not on dashboard)
  const canGoBack = pathname !== `/${locale}/dashboard` && pathname !== `/${locale}`

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
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
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
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/img/landingpage_background_4K.png"
                alt="Empatify"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
                loading="eager"
                quality={85}
                sizes="(max-width: 768px) 100px, 120px"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiMxQTFBMUEiLz48L3N2Zz4="
              />
            </Link>
          </div>

          {/* Center - Dashboard Link */}
          <div className="flex-1 flex justify-center">
            <Link
              href="/dashboard"
              className="text-lg font-medium text-neutral-900 hover:text-primary-500 transition-colors duration-200"
            >
              {t("dashboard")}
            </Link>
          </div>

          {/* Right Side - Messages Icon + Language Picker + User Dropdown */}
          <div className="flex items-center gap-2">
            {/* Messages Icon */}
            <MessagesIcon locale={locale} />

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
  )
}

