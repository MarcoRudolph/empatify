"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { X, Loader2, Check } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"

interface Friend {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface InviteFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  lobbyId: string | null
  lobbyLink: string
  senderName: string
  onFriendsSelected?: (selectedIds: Set<string>) => void
  selectedFriendIds?: Set<string>
}

export function InviteFriendsModal({
  isOpen,
  onClose,
  lobbyId,
  lobbyLink,
  senderName,
  onFriendsSelected,
  selectedFriendIds: externalSelectedIds,
}: InviteFriendsModalProps) {
  const t = useTranslations("messaging")
  const tCommon = useTranslations("common")
  const [friends, setFriends] = useState<Friend[]>([])
  const [internalSelectedFriends, setInternalSelectedFriends] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  // Use external selected friends if provided, otherwise use internal state
  const selectedFriends = externalSelectedIds || internalSelectedFriends
  const setSelectedFriends = onFriendsSelected 
    ? (newSet: Set<string>) => onFriendsSelected(newSet)
    : setInternalSelectedFriends

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends()
    }
  }, [isOpen])

  const loadFriends = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/friends")
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error("Error loading friends:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends)
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId)
    } else {
      newSelected.add(friendId)
    }
    setSelectedFriends(newSelected)
  }

  const handleSendInvites = async () => {
    if (selectedFriends.size === 0) {
      // If no friends selected, just close the modal (for pre-selection mode)
      onClose()
      return
    }

    // If lobbyId is provided, send invites immediately
    if (lobbyId && lobbyLink) {
      setIsSending(true)
      try {
        const recipientIds = Array.from(selectedFriends)
        const message = t("inviteMessageTemplate", {
          recipient: "",
          sender: senderName,
          link: lobbyLink,
        })

        const response = await fetch("/api/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientIds,
            content: message,
            lobbyId: lobbyId,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setSentCount(data.count || 0)
          setTimeout(() => {
            onClose()
            setSentCount(0)
          }, 1500)
        } else {
          const errorData = await response.json()
          alert(errorData.error?.message || t("sendError"))
        }
      } catch (error) {
        console.error("Error sending invites:", error)
        alert(t("sendError"))
      } finally {
        setIsSending(false)
      }
    } else {
      // If no lobbyId, just save selection and close (invites will be sent when lobby is created)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <MagicCard
        className="w-full max-w-2xl max-h-[90vh] m-4 p-6 rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden flex flex-col"
        gradientFrom="var(--color-primary-500)"
        gradientTo="var(--color-primary-600)"
        gradientSize={400}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            {t("inviteFriends")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={tCommon("close")}
          >
            <X className="size-5 text-neutral-900" />
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary-500" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">{t("noFriends")}</p>
            </div>
          ) : (
            friends.map((friend) => (
              <label
                key={friend.id}
                className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFriends.has(friend.id)}
                  onChange={() => toggleFriend(friend.id)}
                  className="size-5 rounded border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="size-10 rounded-full shrink-0"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm truncate">
                    {friend.name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {friend.email}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-300">
          <p className="text-sm text-neutral-600">
            {selectedFriends.size > 0
              ? t("selectedCount", { count: selectedFriends.size })
              : t("selectFriends")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <ShimmerButton
              onClick={handleSendInvites}
              disabled={isSending || sentCount > 0}
              background="var(--color-primary-500)"
              shimmerColor="var(--color-neutral-900)"
              borderRadius="9999px"
              className="px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sentCount > 0 ? (
                <span className="flex items-center gap-2">
                  <Check className="size-4" />
                  {t("sentCount", { count: sentCount })}
                </span>
              ) : isSending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {tCommon("sending")}
                </span>
              ) : lobbyId ? (
                t("sendInvites")
              ) : (
                tCommon("save")
              )}
            </ShimmerButton>
          </div>
        </div>
      </MagicCard>
    </div>
  )
}
