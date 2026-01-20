"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface MessagesIconProps {
  locale: string
}

export function MessagesIcon({ locale }: MessagesIconProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load unread count
    const loadUnreadCount = async () => {
      try {
        const response = await fetch("/api/messages/unread-count")
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error("Error loading unread count:", error)
      }
    }

    loadUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleClick = () => {
    router.push(`/${locale}/messages`)
  }

  const displayCount = unreadCount > 9 ? "10+" : unreadCount.toString()

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200"
      aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="text-neutral-900"
        fill="currentColor"
      >
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-2 12H6v-2h12zm0-3H6V9h12zm0-3H6V6h12z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full border-2 border-neutral-50">
          {displayCount}
        </span>
      )}
    </button>
  )
}
