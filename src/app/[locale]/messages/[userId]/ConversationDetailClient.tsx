"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Send, Loader2, Music, PartyPopper } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { Navbar } from "@/components/ui/Navbar"
import { ShimmerButton } from "@/components/ui/shimmer-button"

interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  lobbyId: string | null
  sentAt: Date
  senderName: string
  senderAvatarUrl: string | null
  isRead: boolean
  isOwn: boolean
}

interface OtherUser {
  id: string
  name: string
  avatarUrl: string | null
  email: string
}

interface ConversationDetailClientProps {
  locale: string
  otherUserId: string
}

export function ConversationDetailClient({
  locale,
  otherUserId,
}: ConversationDetailClientProps) {
  const router = useRouter()
  const t = useTranslations("messaging")
  const tCommon = useTranslations("common")
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    loadConversation()
  }, [otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages/conversation/${otherUserId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(
          data.messages.map((m: any) => ({
            ...m,
            sentAt: new Date(m.sentAt),
          }))
        )
        setOtherUser(data.otherUser)
      }
    } catch (error) {
      console.error("Error loading conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return

    const content = messageText.trim()
    setMessageText("")
    setIsSending(true)

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientIds: [otherUserId],
          content,
        }),
      })

      if (response.ok) {
        // Reload conversation to get new message
        await loadConversation()
      } else {
        const errorData = await response.json()
        alert(errorData.error?.message || t("sendError"))
        setMessageText(content) // Restore message text on error
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert(t("sendError"))
      setMessageText(content) // Restore message text on error
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date) => {
    if (!mounted) return "" // Avoid hydration mismatch
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleLobbyClick = (lobbyId: string) => {
    router.push(`/lobby/${lobbyId}`)
  }

  // Helper function to render message content with clickable links
  const renderMessageContent = (content: string, lobbyId: string | null, senderName: string) => {
    // Check if this is a Play Again invite message
    if (content.startsWith('__PLAY_AGAIN_INVITE__:')) {
      const parts = content.split(':')
      if (parts.length === 5) {
        const inviterName = parts[1]
        const inviteLobbyId = parts[2]
        const maxRounds = parts[3]
        const category = parts[4]
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music className="size-5 text-primary-500" />
              <span className="font-semibold text-lg">
                {t('playAgainInviteTitle')}
              </span>
            </div>
            <p className="text-sm">
              {t('playAgainInviteMessage', { sender: inviterName, rounds: maxRounds, category })}
            </p>
            <ShimmerButton
              onClick={() => handleLobbyClick(inviteLobbyId)}
              className="w-full"
            >
              <Music className="size-4 mr-2" />
              {t('joinLobby')}
            </ShimmerButton>
          </div>
        )
      }
    }

    // Check if this is a lobby invite message
    if (content.startsWith('__LOBBY_INVITE__:')) {
      const parts = content.split(':')
      if (parts.length === 3) {
        const inviterName = parts[1]
        const inviteLobbyId = parts[2]
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PartyPopper className="size-5 text-primary-500" />
              <span className="font-semibold text-lg">
                {t('lobbyInviteTitle')}
              </span>
            </div>
            <p className="text-sm">
              {t('lobbyInviteMessage', { sender: inviterName })}
            </p>
            <ShimmerButton
              onClick={() => handleLobbyClick(inviteLobbyId)}
              className="w-full"
            >
              <Music className="size-4 mr-2" />
              {t('joinLobby')}
            </ShimmerButton>
          </div>
        )
      }
    }

    // Check if this is a system rename message
    if (content.startsWith('__SYSTEM_RENAME__:')) {
      const parts = content.split(':')
      if (parts.length === 3) {
        const oldName = parts[1]
        const newName = parts[2]
        return (
          <span className="italic text-xs">
            {t('userRenamed', { oldName, newName })}
          </span>
        )
      }
    }

    // Regex to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      // Check if this part is a URL
      if (urlRegex.test(part)) {
        // Extract lobby ID from URL if it's a lobby link
        const lobbyMatch = part.match(/\/lobby\/([a-zA-Z0-9-]+)/)
        const extractedLobbyId = lobbyMatch ? lobbyMatch[1] : null

        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              if (extractedLobbyId) {
                handleLobbyClick(extractedLobbyId)
              } else {
                window.open(part, '_blank', 'noopener,noreferrer')
              }
            }}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
            style={{ color: '#2563eb' }}
          >
            {part}
          </button>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Don't render until mounted to avoid hydration issues
  // This prevents hydration mismatches with MagicCard and other client-side components
  if (!mounted || isLoading) {
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

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 flex flex-col">
      <Navbar locale={locale} />
      <div className="max-w-container mx-auto px-6 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/${locale}/messages`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
          >
            <ArrowLeft className="size-5" />
            <span>{tCommon("back")}</span>
          </button>
          {otherUser && (
            <div className="flex items-center gap-3">
              {otherUser.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="size-10 rounded-full"
                />
              ) : (
                <div className="size-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="text-2xl font-bold text-neutral-900">{otherUser.name}</h1>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <MagicCard
              className="p-12 rounded-2xl shadow-lg text-center"
              gradientFrom="var(--color-primary-500)"
              gradientTo="var(--color-primary-600)"
              gradientSize={400}
            >
              <p className="text-neutral-600">{t("noMessagesInConversation")}</p>
            </MagicCard>
          ) : (
            messages.map((message) => {
              // Check if this is a system rename message
              const isSystemRenameMessage = message.content.startsWith('__SYSTEM_RENAME__:')
              // Check if this is a Play Again invite message
              const isPlayAgainInviteMessage = message.content.startsWith('__PLAY_AGAIN_INVITE__:')
              // Check if this is a lobby invite message
              const isLobbyInviteMessage = message.content.startsWith('__LOBBY_INVITE__:')
              
              if (isSystemRenameMessage) {
                // Render system rename message centered
                return (
                  <div
                    key={message.id}
                    className="flex justify-center my-4"
                  >
                    <div className="px-4 py-2 bg-neutral-200 rounded-full text-neutral-600 text-xs">
                      {renderMessageContent(message.content, message.lobbyId, message.senderName)}
                    </div>
                  </div>
                )
              }

              if (isPlayAgainInviteMessage) {
                // Render Play Again invite message with special styling
                return (
                  <div
                    key={message.id}
                    className="flex justify-center my-6"
                  >
                    <MagicCard
                      className="p-5 rounded-2xl shadow-lg max-w-md w-full bg-gradient-to-br from-green-50 to-green-100"
                      gradientFrom="var(--color-primary-400)"
                      gradientTo="var(--color-primary-600)"
                      gradientSize={300}
                    >
                      {renderMessageContent(message.content, message.lobbyId, message.senderName)}
                      <p className="text-xs text-neutral-500 mt-3 text-center">
                        {mounted ? formatTime(message.sentAt) : ""}
                      </p>
                    </MagicCard>
                  </div>
                )
              }

              if (isLobbyInviteMessage) {
                // Render lobby invite message with special styling
                return (
                  <div
                    key={message.id}
                    className="flex justify-center my-6"
                  >
                    <MagicCard
                      className="p-5 rounded-2xl shadow-lg max-w-md w-full bg-gradient-to-br from-primary-50 to-primary-100"
                      gradientFrom="var(--color-primary-400)"
                      gradientTo="var(--color-primary-600)"
                      gradientSize={300}
                    >
                      {renderMessageContent(message.content, message.lobbyId, message.senderName)}
                      <p className="text-xs text-neutral-500 mt-3 text-center">
                        {mounted ? formatTime(message.sentAt) : ""}
                      </p>
                    </MagicCard>
                  </div>
                )
              }
              
              // Regular message
              return (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${message.isOwn ? "order-2" : "order-1"}`}>
                    {!message.isOwn && (
                      <p className="text-xs text-neutral-500 mb-1 px-2">
                        {message.senderName}
                      </p>
                    )}
                    <MagicCard
                      className={`p-3 rounded-2xl shadow-md ${
                        message.isOwn
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-900"
                      }`}
                      gradientFrom={
                        message.isOwn
                          ? "var(--color-primary-500)"
                          : "var(--color-neutral-100)"
                      }
                      gradientTo={
                        message.isOwn
                          ? "var(--color-primary-600)"
                          : "var(--color-neutral-200)"
                      }
                      gradientSize={200}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {renderMessageContent(message.content, message.lobbyId, message.senderName)}
                      </p>
                      {message.lobbyId && !isLobbyInviteMessage && (
                        <button
                          onClick={() => handleLobbyClick(message.lobbyId!)}
                          className="mt-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {t("viewLobby")}
                        </button>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          message.isOwn ? "text-white/70" : "text-neutral-500"
                        }`}
                      >
                        {mounted ? formatTime(message.sentAt) : ""}
                      </p>
                    </MagicCard>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={t("typeMessage")}
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: '#171717' }}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t("send")}
          >
            {isSending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
