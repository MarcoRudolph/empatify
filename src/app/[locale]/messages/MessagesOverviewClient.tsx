"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Loader2 } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { Navbar } from "@/components/ui/Navbar"

interface Conversation {
  userId: string
  userName: string
  userAvatarUrl: string | null
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  lobbyId: string | null
}

interface MessagesOverviewClientProps {
  locale: string
}

export function MessagesOverviewClient({ locale }: MessagesOverviewClientProps) {
  const router = useRouter()
  const t = useTranslations("messaging")
  const tCommon = useTranslations("common")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/messages/list")
      if (response.ok) {
        const data = await response.json()
        setConversations(
          data.conversations.map((c: any) => ({
            ...c,
            lastMessageTime: new Date(c.lastMessageTime),
          }))
        )
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    if (!mounted) return "" // Avoid hydration mismatch
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t("justNow")
    if (diffMins < 60) return t("minutesAgo", { count: diffMins })
    if (diffHours < 24) return t("hoursAgo", { count: diffHours })
    if (diffDays < 7) return t("daysAgo", { count: diffDays })
    return date.toLocaleDateString()
  }

  const handleConversationClick = (userId: string) => {
    console.log("Clicking conversation:", userId, `/${locale}/messages/${userId}`)
    router.push(`/${locale}/messages/${userId}`)
  }

  // Don't render content until mounted to avoid hydration issues
  // This prevents hydration mismatches with MagicCard and other client-side components
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-16">
        <Navbar locale={locale} />
        <div className="max-w-container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary-500" />
          </div>
        </div>
      </div>
    )
  }

  // Also ensure conversations are loaded before rendering MagicCard components
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-16">
        <Navbar locale={locale} />
        <div className="max-w-container mx-auto px-6 py-8">
          <div className="mb-6">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
            >
              <ArrowLeft className="size-5" />
              <span>{tCommon("back")}</span>
            </button>
            <h1 className="text-3xl font-bold text-neutral-900">{t("messages")}</h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-16">
      <Navbar locale={locale} />
      <div className="max-w-container mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
          >
            <ArrowLeft className="size-5" />
            <span>{tCommon("back")}</span>
          </button>
          <h1 className="text-3xl font-bold text-neutral-900">{t("messages")}</h1>
        </div>

        {conversations.length === 0 ? (
          <MagicCard
            className="p-12 rounded-2xl shadow-lg text-center"
            gradientFrom="var(--color-primary-500)"
            gradientTo="var(--color-primary-600)"
            gradientSize={400}
          >
            <p className="text-neutral-600">{t("noMessages")}</p>
          </MagicCard>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.userId}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("Button clicked for conversation:", conversation.userId)
                  handleConversationClick(conversation.userId)
                }}
                className="w-full text-left bg-transparent border-none p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <MagicCard
                  className="p-4 rounded-xl shadow-md border border-neutral-300 cursor-pointer hover:shadow-lg transition-shadow"
                  gradientFrom="var(--color-primary-500)"
                  gradientTo="var(--color-primary-600)"
                  gradientSize={300}
                >
                  <div className="flex items-center gap-4">
                    {conversation.userAvatarUrl ? (
                      <img
                        src={conversation.userAvatarUrl}
                        alt={conversation.userName}
                        className="size-12 rounded-full shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {conversation.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {conversation.userName}
                        </h3>
                        <span className="text-xs text-neutral-500 shrink-0 ml-2">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-neutral-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full shrink-0">
                            {conversation.unreadCount > 9 ? "10+" : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
