import { locales } from "@/i18n"

const LOBBY_UUID =
  /^\/([a-z]{2})\/lobby\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Allows only same-origin lobby paths after Spotify OAuth (open-redirect safe).
 */
export function sanitizeSpotifyOAuthReturnTo(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith("/")) return null
  if (trimmed.includes("..") || trimmed.includes("\\") || trimmed.includes("//")) {
    return null
  }

  let pathname: string
  try {
    pathname = new URL(trimmed, "https://example.invalid").pathname
  } catch {
    return null
  }

  const match = pathname.match(LOBBY_UUID)
  if (!match) return null

  const loc = match[1].toLowerCase()
  if (!locales.includes(loc as (typeof locales)[number])) return null

  return pathname
}
