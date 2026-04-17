"use client"

import { useEffect, useState } from "react"
import { X, Link2, Download, Check } from "lucide-react"

type Labels = {
  title: string
  copy: string
  copied: string
  download: string
  caption: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  caption?: string
  onDownloadImage?: () => void | Promise<void>
  labels: Labels
}

/**
 * Branded share sheet for the Sonic Soul. All targets share the same
 * canonical `shareUrl` — the /u/<handle> page renders a rich OG preview
 * so the recipient sees the Sonic Soul card inline in WhatsApp,
 * Telegram, Facebook, X, etc.
 *
 * Instagram and TikTok do not accept arbitrary image+link via web URL,
 * so those buttons download the PNG and open the platform so the user
 * can paste it into a Story / Post with the link in bio.
 */
export function ShareSoulModal({
  isOpen,
  onClose,
  shareUrl,
  caption,
  onDownloadImage,
  labels,
}: Props) {
  const [justCopied, setJustCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const text = caption ?? labels.caption
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedBoth = encodeURIComponent(`${text} ${shareUrl}`)

  const targets: Array<{
    id: string
    label: string
    href: string
    bg: string
    icon: React.ReactNode
    downloadFirst?: boolean
  }> = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedBoth}`,
      bg: "#25D366",
      icon: <WhatsAppIcon />,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      bg: "#1877F2",
      icon: <FacebookIcon />,
    },
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      bg: "#000000",
      icon: <XIcon />,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      bg: "#229ED9",
      icon: <TelegramIcon />,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/",
      bg: "linear-gradient(135deg,#F58529 0%,#DD2A7B 45%,#8134AF 75%,#515BD4 100%)",
      icon: <InstagramIcon />,
      downloadFirst: true,
    },
    {
      id: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/upload",
      bg: "#000000",
      icon: <TikTokIcon />,
      downloadFirst: true,
    },
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  const handleClick = async (t: (typeof targets)[number]) => {
    if (t.downloadFirst && onDownloadImage) {
      try {
        await onDownloadImage()
      } catch {
        /* ignore */
      }
      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        /* ignore */
      }
    }
    window.open(t.href, "_blank", "noopener,noreferrer,width=640,height=720")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-neutral-100 border border-neutral-300 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 size-9 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-900 flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="p-6 pt-8">
          <h3
            className="text-xl font-black text-neutral-900 tracking-tight"
            style={{ fontFamily: "Unbounded, sans-serif" }}
          >
            {labels.title}
          </h3>
          <p className="text-sm text-neutral-700 mt-1 truncate">{shareUrl}</p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {targets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleClick(t)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 text-white font-bold text-xs transition-transform hover:-translate-y-0.5 active:scale-95"
                style={{ background: t.bg }}
              >
                <span className="size-7 flex items-center justify-center">
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-bold text-sm transition-colors"
            >
              {justCopied ? (
                <>
                  <Check className="size-4" />
                  {labels.copied}
                </>
              ) : (
                <>
                  <Link2 className="size-4" />
                  {labels.copy}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onDownloadImage?.()}
              disabled={!onDownloadImage}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 font-bold text-sm transition-colors"
            >
              <Download className="size-4" />
              {labels.download}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Brand icons (inline SVG, white currentColor-friendly) ───────── */

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="size-6" aria-hidden>
      <path d="M20.52 3.48A11.94 11.94 0 0 0 12.05 0C5.5 0 .18 5.3.18 11.83c0 2.08.55 4.11 1.6 5.9L.05 24l6.45-1.69a11.85 11.85 0 0 0 5.55 1.41h.01c6.54 0 11.87-5.3 11.87-11.83a11.77 11.77 0 0 0-3.41-8.41ZM12.06 21.5h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.82 1 1.02-3.72-.24-.38a9.77 9.77 0 0 1-1.51-5.17c0-5.43 4.43-9.83 9.88-9.83 2.64 0 5.12 1.02 6.98 2.88a9.7 9.7 0 0 1 2.89 6.96c-.01 5.43-4.44 9.86-9.79 9.86Zm5.65-7.37c-.31-.15-1.83-.9-2.11-1-.28-.1-.49-.16-.7.16-.2.31-.8 1-.98 1.2-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.53-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.14-.63.14-.14.31-.36.46-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.15-.7-1.7-.96-2.32-.25-.61-.51-.53-.7-.54H7.7c-.2 0-.51.08-.78.39-.27.31-1.02 1-1.02 2.44 0 1.45 1.05 2.84 1.2 3.04.15.21 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.61.71.23 1.35.2 1.86.12.57-.09 1.83-.75 2.1-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.2-.59-.36Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="size-6" aria-hidden>
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82V14.706h-3.13v-3.622h3.13V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.716-1.795 1.764v2.312h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.408 0 22.675 0Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="size-6" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.82l-4.76-6.23L4.8 22H2l7.02-8.02L2 2h6.91l4.29 5.71L18.244 2Zm-2.39 18h1.86L7.2 4H5.24l10.614 16Z" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="size-6" aria-hidden>
      <path d="M9.78 18.65 10.06 14.6l7.45-6.7c.33-.3-.07-.45-.5-.19L7.8 13.76 3.67 12.45c-.9-.25-.91-.87.2-1.29l16.16-6.23c.74-.33 1.45.18 1.17 1.29l-2.75 12.96c-.19.9-.73 1.12-1.49.7l-4.11-3.03-1.98 1.92c-.23.23-.42.42-.85.42Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="size-6" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.967.24 2.426.41a4.9 4.9 0 0 1 1.77 1.153 4.9 4.9 0 0 1 1.153 1.77c.17.46.356 1.257.41 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.967-.41 2.427a4.9 4.9 0 0 1-1.153 1.77 4.9 4.9 0 0 1-1.77 1.153c-.46.17-1.257.356-2.427.41-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.967-.24-2.427-.41a4.9 4.9 0 0 1-1.77-1.153 4.9 4.9 0 0 1-1.153-1.77c-.17-.46-.356-1.257-.41-2.427C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.967.41-2.427A4.9 4.9 0 0 1 3.796 2.953 4.9 4.9 0 0 1 5.566 1.8c.46-.17 1.257-.356 2.427-.41C9.258 1.33 9.638 1.32 12 1.32Zm0 1.62c-3.141 0-3.507.012-4.75.07-1.002.045-1.546.21-1.908.348-.48.186-.822.408-1.18.767-.36.36-.582.7-.768 1.18-.138.362-.303.906-.348 1.908-.058 1.243-.07 1.609-.07 4.75s.012 3.507.07 4.75c.045 1.002.21 1.546.348 1.908.186.48.408.822.768 1.18.358.36.7.582 1.18.768.362.138.906.303 1.908.348 1.243.058 1.609.07 4.75.07s3.507-.012 4.75-.07c1.002-.045 1.546-.21 1.908-.348.48-.186.822-.408 1.18-.768.36-.358.582-.7.768-1.18.138-.362.303-.906.348-1.908.058-1.243.07-1.609.07-4.75s-.012-3.507-.07-4.75c-.045-1.002-.21-1.546-.348-1.908a3.3 3.3 0 0 0-.768-1.18 3.3 3.3 0 0 0-1.18-.767c-.362-.138-.906-.303-1.908-.348C15.507 2.795 15.141 2.783 12 2.783Zm0 2.756a6.461 6.461 0 1 0 0 12.922 6.461 6.461 0 0 0 0-12.922Zm0 10.657a4.196 4.196 0 1 1 0-8.392 4.196 4.196 0 0 1 0 8.392Zm6.594-10.785a1.51 1.51 0 1 0 0 3.02 1.51 1.51 0 0 0 0-3.02Z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="size-6" aria-hidden>
      <path d="M19.5 6.54v3.2c-1.31 0-2.58-.26-3.74-.8v6.03c0 3.88-3.16 7.03-7.04 7.03-1.52 0-2.93-.48-4.08-1.3a7.03 7.03 0 0 0 4.08 1.3c3.88 0 7.04-3.15 7.04-7.03V8.94a9.3 9.3 0 0 0 3.74.8v-3.2Zm-5-.34V2.8h-3.3v12.16c0 1.58-1.28 2.86-2.86 2.86a2.85 2.85 0 0 1-1.33-.33 2.86 2.86 0 0 0 2.33 1.2c1.58 0 2.86-1.28 2.86-2.86V3.92h1.26a5.37 5.37 0 0 0 1.04 2.28Zm-8.1 6.7a4.1 4.1 0 0 1 2.47-.82v-3.2a7.3 7.3 0 0 0-2.2.34v3.34c-.02.11-.05.22-.05.35a2.86 2.86 0 0 0 1.25 2.37 2.86 2.86 0 0 1-1.47-2.38Z" />
    </svg>
  )
}
