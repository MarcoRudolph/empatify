import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { routing } from "@/i18n/routing"
import { getBaseUrl } from "@/lib/utils"

/**
 * Auth callback route for handling OAuth and Magic Link redirects
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const errorCode = requestUrl.searchParams.get("error_code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"
  const baseUrl = getBaseUrl(request)

  // Log all query parameters for debugging
  console.log("🔵 Auth Callback Request:", {
    hasCode: !!code,
    hasError: !!error,
    error,
    errorDescription,
    errorCode,
    next,
    baseUrl,
    hostHeader: request.headers.get("host"),
    fullUrl: requestUrl.toString(),
    timestamp: new Date().toISOString(),
  })

  // Handle OAuth errors from provider
  if (error) {
    console.error("🔴 OAuth Provider Error:", {
      error,
      errorDescription,
      errorCode,
      next,
      baseUrl,
      hostHeader: request.headers.get("host"),
      fullUrl: requestUrl.toString(),
      timestamp: new Date().toISOString(),
    })
    
    const cookieStore = await cookies()
    const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
    const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
    const errorParam = `error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ""}${errorCode ? `&error_code=${encodeURIComponent(errorCode)}` : ""}`
    
    return NextResponse.redirect(
      new URL(`/${locale}/login?auth_failed&${errorParam}${redirectParam}`, baseUrl)
    )
  }

  if (code) {
    const supabase = await createClient()
    console.log("🟡 Attempting to exchange code for session...")
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error("🔴 Code Exchange Error:", {
        error: exchangeError,
        errorMessage: exchangeError.message,
        errorStatus: exchangeError.status,
        code: code.substring(0, 20) + "...", // Log only first 20 chars for security
        next,
        baseUrl,
        hostHeader: request.headers.get("host"),
        fullUrl: requestUrl.toString(),
        timestamp: new Date().toISOString(),
      })
      
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
      
      return NextResponse.redirect(
        new URL(`/${locale}/login?error=auth_failed&error_description=${encodeURIComponent(exchangeError.message)}${redirectParam}`, baseUrl)
      )
    }
    
    if (!exchangeError && data) {
      console.log("✅ Auth callback successful, redirecting:", {
        next,
        baseUrl,
        hostHeader: request.headers.get("host"),
        userId: data.user?.id,
        timestamp: new Date().toISOString(),
      })
      
      // If next is a full path (starts with /), use it directly
      // Otherwise, prepend locale
      if (next.startsWith("/")) {
        // Check if it's a lobby route (no locale) or needs locale
        if (next.startsWith("/lobby/") || next.startsWith("/redirect")) {
          return NextResponse.redirect(new URL(next, baseUrl))
        }
        // For other routes, add locale
        const cookieStore = await cookies()
        const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
        return NextResponse.redirect(new URL(`/${locale}${next}`, baseUrl))
      } else {
        // Relative path, add locale
        const cookieStore = await cookies()
        const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
        return NextResponse.redirect(new URL(`/${locale}/${next}`, baseUrl))
      }
    }
  }

  // No code and no error - this shouldn't happen, but log it
  console.warn("⚠️ Auth callback called without code or error parameter:", {
    fullUrl: requestUrl.toString(),
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    timestamp: new Date().toISOString(),
  })

  // Return the user to login page on error
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
  const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
  console.error("🔴 Auth callback error (no code/exchange failed), redirecting to login:", {
    baseUrl,
    hostHeader: request.headers.get("host"),
    timestamp: new Date().toISOString(),
  })
  return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed${redirectParam}`, baseUrl))
}

