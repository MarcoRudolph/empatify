"use client"

import { QRCodeSVG } from "qrcode.react"
import { Users, Copy, Check, Loader2 } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"

interface Participant {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  joinedAt: string
}

interface UserListCardProps {
  participants: Participant[]
  lobbyId: string
  hostId: string
  currentUserId: string
  isGameFinished: boolean
  winner: { name: string; userId: string } | null
}

/**
 * User List Card with QR Code
 * Displays participants and invite QR code
 */
export function UserListCard({
  participants,
  lobbyId,
  hostId,
  currentUserId,
  isGameFinished,
  winner,
}: UserListCardProps) {
  const t = useTranslations("lobby")
  const tFriends = useTranslations("friends")
  const [copied, setCopied] = useState(false)
  const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean>>({})
  const [addingFriend, setAddingFriend] = useState<string | null>(null)

  // Generate invite URL - use redirect route for QR codes
  // Always use window.location.origin in browser for accuracy
  const [inviteUrl, setInviteUrl] = useState("")

  useEffect(() => {
    // Generate URL client-side to ensure we get the correct origin
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      const url = `${origin}/redirect?lobbyId=${lobbyId}`
      setInviteUrl(url)
      console.log("🔍 Generated Invite URL:", url)
      console.log("  - Origin:", origin)
      console.log("  - Lobby ID:", lobbyId)
    }
  }, [lobbyId])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  // Check friend status for all participants
  useEffect(() => {
    const checkFriendStatuses = async () => {
      const statuses: Record<string, boolean> = {}
      for (const participant of participants) {
        if (participant.id !== currentUserId) {
          try {
            const response = await fetch(`/api/user/friend?friendId=${participant.id}`)
            if (response.ok) {
              const data = await response.json()
              statuses[participant.id] = data.isFriend || false
            }
          } catch (error) {
            console.error(`Error checking friend status for ${participant.id}:`, error)
          }
        }
      }
      setFriendStatuses(statuses)
    }

    if (participants.length > 0) {
      checkFriendStatuses()
    }
  }, [participants, currentUserId])

  const handleAddFriend = async (friendId: string) => {
    if (addingFriend === friendId) return

    setAddingFriend(friendId)
    try {
      const response = await fetch("/api/user/friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      })

      if (response.ok) {
        // Update friend status
        setFriendStatuses((prev) => ({
          ...prev,
          [friendId]: true,
        }))
      } else {
        const data = await response.json()
        const errorMessage = data.error?.message || tFriends("addFriendError")
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error adding friend:", error)
      alert(tFriends("addFriendError"))
    } finally {
      setAddingFriend(null)
    }
  }

  // Add Friend Icon Component
  const AddFriendIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18.75 10.75V8h1.5v2.75H23v1.5h-2.75V15h-1.5v-2.75H16v-1.5zm-10.918 1.6C7.096 11.478 6.5 9.85 6.5 8.71V7a4 4 0 0 1 8 0v1.71c0 1.14-.6 2.773-1.332 3.642l-.361.428c-.59.699-.406 1.588.419 1.99l5.66 2.762c.615.3 1.114 1.093 1.114 1.783v.687a1 1 0 0 1-1.001.998H2a1 1 0 0 1-1-.998v-.687c0-.685.498-1.483 1.114-1.784l5.66-2.762c.821-.4 1.012-1.288.42-1.99z"
      />
    </svg>
  )

  return (
    <MagicCard
      className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
      gradientFrom="var(--color-primary-500)"
      gradientTo="var(--color-primary-600)"
      gradientSize={400}
    >
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Users className="size-5 md:size-6 text-primary-500" />
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900">
          {t("participants")} ({participants.length})
        </h2>
      </div>

      <div className="space-y-4 md:space-y-6">
        {isGameFinished && winner ? (
          /* Game Over - Play Again Button */
          <div className="space-y-3">
            <ShimmerButton
              onClick={async () => {
                try {
                  // Create a new lobby with same settings as the finished game
                  const response = await fetch('/api/lobby/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      copyFromLobbyId: lobbyId, // Copy settings from current lobby
                    }),
                  })

                  if (response.ok) {
                    const data = await response.json()
                    // Navigate to the new lobby
                    // Note: /lobby route is NOT internationalized (no locale prefix)
                    window.location.href = `/lobby/${data.lobbyId}`
                  } else {
                    const errorData = await response.json()
                    console.error('Failed to create new lobby:', errorData)
                    alert(tFriends("error") || 'Failed to create new lobby. Please try again.')
                  }
                } catch (error) {
                  console.error('Error creating new lobby:', error)
                  alert(tFriends("error") || 'An error occurred. Please try again.')
                }
              }}
              background="var(--color-primary-500)"
              shimmerColor="var(--color-neutral-900)"
              borderRadius="12px"
              className="w-full px-6 py-4 flex items-center justify-center gap-2"
            >
              <span className="text-base font-bold">🔄 {t("playAgain")}</span>
            </ShimmerButton>
          </div>
        ) : (
          <>
            {inviteUrl ? (
              <>
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 md:p-4 rounded-lg shadow-md border border-neutral-200">
                    <QRCodeSVG
                      key={inviteUrl} // Force re-render when URL changes
                      value={inviteUrl}
                      size={150}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Invite Link Button */}
                <div className="flex justify-center">
                  <ShimmerButton
                    onClick={handleCopyLink}
                    background="var(--color-primary-500)"
                    shimmerColor="var(--color-neutral-900)"
                    borderRadius="9999px"
                    className="px-6 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 w-full md:w-auto"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4 md:size-5" />
                        <span className="text-sm md:text-base font-medium">{t("linkCopied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 md:size-5" />
                        <span className="text-sm md:text-base font-medium">{t("copyInviteLink")}</span>
                      </>
                    )}
                  </ShimmerButton>
                </div>
              </>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="size-8 animate-spin text-primary-500" />
              </div>
            )}
          </>
        )}

        {/* Players List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
            >
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.name}
                  className="size-10 md:size-12 rounded-full shrink-0"
                />
              ) : (
                <div className="size-10 md:size-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm md:text-base shrink-0">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-neutral-900 text-sm md:text-base truncate">
                    {participant.name}
                  </p>
                  {participant.id === hostId && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded whitespace-nowrap shrink-0">
                      {t("host")}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-neutral-500 truncate mt-0.5">
                  {participant.email}
                </p>
              </div>
              
              {/* Add Friend Button - Only show if not current user and not already friend */}
              {participant.id !== currentUserId && (
                <button
                  onClick={() => handleAddFriend(participant.id)}
                  disabled={friendStatuses[participant.id] || addingFriend === participant.id}
                  className="p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title={friendStatuses[participant.id] ? tFriends("alreadyFriend") : tFriends("addFriend")}
                >
                  {addingFriend === participant.id ? (
                    <div className="size-5 md:size-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : friendStatuses[participant.id] ? (
                    <Check className="size-5 md:size-6 text-primary-500" />
                  ) : (
                    <AddFriendIcon className="size-5 md:size-6" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </MagicCard>
  )
}

