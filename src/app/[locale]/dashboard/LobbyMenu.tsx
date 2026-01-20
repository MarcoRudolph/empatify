"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Copy, Trash2, Check } from "lucide-react"

interface LobbyMenuProps {
  lobbyId: string
  isHost: boolean
  participantCount: number
  locale: string
}

/**
 * Lobby Menu Component
 * Shows a 3-dot menu with options to copy invite link and delete lobby (if no participants)
 */
export function LobbyMenu({ lobbyId, isHost, participantCount, locale }: LobbyMenuProps) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const tCommon = useTranslations("common")
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Generate invite URL
  const getInviteUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    return `${baseUrl}/redirect?lobbyId=${lobbyId}`
  }

  const handleCopyLink = async () => {
    try {
      const inviteUrl = getInviteUrl()
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to copy link:", error)
      alert("Fehler beim Kopieren des Links")
    }
  }

  const handleDelete = async () => {
    if (!isHost) return
    
    // Only allow deletion if no participants (only host)
    if (participantCount > 1) {
      alert("Lobby kann nicht gelöscht werden, da bereits Teilnehmer vorhanden sind.")
      setIsOpen(false)
      return
    }

    if (!confirm("Möchtest du diese Lobby wirklich löschen?")) {
      setIsOpen(false)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/lobby/${lobbyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh the page to update the lobby list
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error?.message || "Fehler beim Löschen der Lobby")
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Error deleting lobby:", error)
      alert("Fehler beim Löschen der Lobby")
      setIsDeleting(false)
    }
    setIsOpen(false)
  }

  const canDelete = isHost && participantCount <= 1

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dot menu button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors"
        aria-label="Menü"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 18q-.425 0-.712-.288T3 17t.288-.712T4 16h16q.425 0 .713.288T21 17t-.288.713T20 18zm0-5q-.425 0-.712-.288T3 12t.288-.712T4 11h16q.425 0 .713.288T21 12t-.288.713T20 13zm0-5q-.425 0-.712-.288T3 7t.288-.712T4 6h16q.425 0 .713.288T21 7t-.288.713T20 8z"/>
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
          {/* Copy Invite Link */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCopyLink()
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2 transition-colors"
            style={{ color: '#171717' }}
          >
            {copied ? (
              <>
                <Check className="size-4 text-green-500" />
                <span style={{ color: '#171717' }}>Link kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" style={{ color: '#171717' }} />
                <span style={{ color: '#171717' }}>{t("copyInviteLink")}</span>
              </>
            )}
          </button>

          {/* Delete Lobby */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDelete()
              }}
              disabled={isDeleting}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-4" />
              <span>{isDeleting ? tCommon("loading") : tCommon("delete")}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
