"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { ShareSoulModal } from "@/components/ui/ShareSoulModal"

type Labels = {
  shareButton: string
  title: string
  copy: string
  copied: string
  download: string
  caption: string
}

export function ShareSoulEntry({
  shareUrl,
  displayName,
  labels,
}: {
  shareUrl: string
  displayName: string
  labels: Labels
}) {
  const [open, setOpen] = useState(false)

  const handleDownload = async () => {
    const url = `/api/og?handle=${encodeURIComponent(displayName)}`
    const a = document.createElement("a")
    a.href = shareUrl.replace(/\/$/, "") + "/opengraph-image"
    a.download = `sonic-soul-${displayName}.png`
    a.target = "_blank"
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
    // `url` intentionally ignored — opengraph-image is the canonical PNG
    void url
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2 bg-white text-black font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 transition-transform"
      >
        <Share2 className="size-4" />
        {labels.shareButton}
      </button>
      <ShareSoulModal
        isOpen={open}
        onClose={() => setOpen(false)}
        shareUrl={shareUrl}
        onDownloadImage={handleDownload}
        labels={{
          title: labels.title,
          copy: labels.copy,
          copied: labels.copied,
          download: labels.download,
          caption: labels.caption,
        }}
      />
    </>
  )
}
