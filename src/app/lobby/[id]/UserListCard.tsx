"use client"

import { QRCodeSVG } from "qrcode.react"
import { Users, Copy, Check } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useTranslations } from "next-intl"
import { useState } from "react"

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
}

/**
 * User List Card with QR Code
 * Displays participants and invite QR code
 */
export function UserListCard({
  participants,
  lobbyId,
  hostId,
}: UserListCardProps) {
  const t = useTranslations("lobby")
  const [copied, setCopied] = useState(false)

  // Generate invite URL - use redirect route for QR codes
  // Use NEXT_PUBLIC_APP_URL if set and valid, otherwise fallback to IP address in development
  const getBaseUrl = () => {
    if (process.env.NODE_ENV === "production") {
      return "https://empatify.de"
    }
    
    // In development, use NEXT_PUBLIC_APP_URL if set and valid (not 0.0.0.0 or localhost)
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    if (envUrl && 
        !envUrl.includes("0.0.0.0") && 
        !envUrl.includes("localhost") && 
        !envUrl.includes("127.0.0.1")) {
      return envUrl
    }
    
    // Default to IP address for QR codes
    return "http://192.168.178.180:3000"
  }
  
  const baseUrl = getBaseUrl()
  
  // Use redirect route so users can login first, then join lobby
  const inviteUrl = `${baseUrl}/redirect?lobbyId=${lobbyId}`
  
  // Log for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 QR Code Debug Info:")
    console.log("  - QR Code URL:", inviteUrl)
    console.log("  - Base URL:", baseUrl)
    console.log("  - NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL)
    console.log("  - NODE_ENV:", process.env.NODE_ENV)
    console.log("  - Lobby ID:", lobbyId)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  return (
    <MagicCard
      className="p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-300"
      gradientFrom="#FF6B00"
      gradientTo="#E65F00"
      gradientSize={400}
    >
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Users className="size-5 md:size-6 text-primary-500" />
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900">
          {t("participants")} ({participants.length})
        </h2>
      </div>

      <div className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
            <QRCodeSVG
              key={inviteUrl} // Force re-render when URL changes
              value={inviteUrl}
              size={150}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Invite Link */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-neutral-900 mb-2">
            {t("inviteLink")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 md:px-4 py-2 text-xs md:text-sm border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            <ShimmerButton
              onClick={handleCopyLink}
              background="#FF6B00"
              shimmerColor="#ffffff"
              borderRadius="9999px"
              className="px-4 md:px-6 h-9 md:h-10"
              title={copied ? t("linkCopied") : t("copyLink")}
            >
              {copied ? (
                <Check className="size-3 md:size-4" />
              ) : (
                <Copy className="size-3 md:size-4" />
              )}
            </ShimmerButton>
          </div>
        </div>

        {/* Participants List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.name}
                  className="size-8 md:size-10 rounded-full"
                />
              ) : (
                <div className="size-8 md:size-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm md:text-base truncate">
                  {participant.name}
                </p>
                <p className="text-xs md:text-sm text-neutral-500 truncate">
                  {participant.email}
                </p>
              </div>
              {participant.id === hostId && (
                <span className="px-2 py-1 text-xs font-medium bg-primary-500 text-white rounded whitespace-nowrap">
                  {t("host")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </MagicCard>
  )
}

