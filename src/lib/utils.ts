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
 * Uses the Host header from the request to avoid 0.0.0.0 issues
 * Falls back to NEXT_PUBLIC_APP_URL or IP address in development
 */
export function getBaseUrl(request: NextRequest | Request): string {
  const url = new URL(request.url)
  
  // In production, use the origin from the request
  if (process.env.NODE_ENV === "production") {
    return url.origin
  }

  // In development, try to get the Host header (contains the actual IP the client used)
  // The Host header contains what the client actually used to connect (e.g., 192.168.178.180:3000)
  let hostHeader: string | null = null
  
  if (request instanceof NextRequest) {
    hostHeader = request.headers.get("host")
  } else if (request.headers) {
    // For standard Request objects, try to get host header
    hostHeader = request.headers.get("host")
  }

  // If Host header exists and doesn't contain 0.0.0.0 or localhost, use it
  if (hostHeader && 
      !hostHeader.includes("0.0.0.0") && 
      !hostHeader.includes("localhost") && 
      !hostHeader.includes("127.0.0.1")) {
    const protocol = url.protocol || "http:"
    return `${protocol}//${hostHeader}`
  }

  // Try NEXT_PUBLIC_APP_URL if set and valid
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && 
      !envUrl.includes("0.0.0.0") && 
      !envUrl.includes("localhost") && 
      !envUrl.includes("127.0.0.1")) {
    return envUrl
  }

  // Fallback to IP address for development
  return "http://192.168.178.180:3000"
}

