import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the correct base URL for redirects in server routes
 * Prioritizes NEXT_PUBLIC_APP_URL, then request origin
 */
export function getBaseUrl(request: NextRequest | Request): string {
  // 1. Check if NEXT_PUBLIC_APP_URL is set (works for both dev and prod)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) {
    return envUrl
  }

  // 2. Fallback to request origin
  const url = new URL(request.url)
  return url.origin
}

