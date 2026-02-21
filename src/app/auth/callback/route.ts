import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { defaultLocale } from "@/i18n"
import { getBaseUrl } from "@/lib/utils"

/**
 * Auth callback route for handling OAuth and Magic Link redirects
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token = requestUrl.searchParams.get("token")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const errorCode = requestUrl.searchParams.get("error_code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"
  const baseUrl = getBaseUrl(request)
  const localeFromPath = requestUrl.pathname.split("/")[1]
  const localeFromQueryPath = next.match(/^\/(en|de|pt|fr|es)(\/|$)/)?.[1]
  const cookieStore = await cookies()
  const activeLocale =
    localeFromQueryPath ||
    (["en", "de", "pt", "fr", "es"].includes(localeFromPath) ? localeFromPath : null) ||
    cookieStore.get("NEXT_LOCALE")?.value ||
    defaultLocale

  const normalizeNextPath = (nextPath: string) => {
    if (nextPath.startsWith("/")) {
      if (/^\/(en|de|pt|fr|es)(\/|$)/.test(nextPath)) {
        return nextPath
      }
      return `/${activeLocale}${nextPath}`
    }
    return `/${activeLocale}/${nextPath}`
  }

  // Log all query parameters for debugging
  console.log("🔵 Auth Callback Request:", {
    hasCode: !!code,
    hasToken: !!token,
    hasTokenHash: !!token_hash,
    type,
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
    
    const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
    const errorParam = `error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ""}${errorCode ? `&error_code=${encodeURIComponent(errorCode)}` : ""}`
    
    return NextResponse.redirect(
      new URL(`/${activeLocale}/login?error=auth_failed&${errorParam}${redirectParam}`, baseUrl)
    )
  }

  const supabase = await createClient()

  // Check if user is already authenticated (Supabase may have verified the token already)
  const { data: { user } } = await supabase.auth.getUser()
  if (user && !code && !token_hash && !token) {
    console.log("✅ User already authenticated, redirecting:", {
      userId: user.id,
      next,
      baseUrl,
      timestamp: new Date().toISOString(),
    })
    // Handle redirect
    return NextResponse.redirect(new URL(normalizeNextPath(next), baseUrl))
  }

  // Handle PKCE flow (code parameter)
  // Code verifier lives in the browser (localStorage); do not exchange on the server.
  // Redirect to a client page so exchangeCodeForSession runs where the verifier is available.
  if (code) {
    const clientCallbackUrl = new URL(`/${activeLocale}`, baseUrl)
    clientCallbackUrl.searchParams.set("code", code)
    if (next) clientCallbackUrl.searchParams.set("next", next)
    console.log("🟡 PKCE: redirecting to client for code exchange:", {
      locale: activeLocale,
      next,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.redirect(clientCallbackUrl)
  }

  // Handle Magic Link flow (token_hash or token parameter)
  // Note: Supabase may send token_hash or token depending on the flow
  const magicLinkToken = token_hash || token
  if (magicLinkToken && (type === "magiclink" || type === "signup" || type === "email" || !type)) {
    console.log("🟡 Attempting to verify magic link token...", {
      hasToken: !!token,
      hasTokenHash: !!token_hash,
      type,
    })
    
    const verifyParams: {
      type: "magiclink" | "signup" | "email"
      token_hash: string
    } = {
      type: type === "signup" ? "signup" : type === "email" ? "email" : "magiclink",
      token_hash: token_hash ?? token ?? "",
    }
    const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyParams)
    
    if (verifyError) {
      console.error("🔴 Magic Link Verify Error:", {
        error: verifyError,
        errorMessage: verifyError.message,
        errorStatus: verifyError.status,
        type,
        next,
        baseUrl,
        hostHeader: request.headers.get("host"),
        fullUrl: requestUrl.toString(),
        timestamp: new Date().toISOString(),
      })
      
      const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
      
      return NextResponse.redirect(
        new URL(`/${activeLocale}/login?error=auth_failed&error_description=${encodeURIComponent(verifyError.message)}${redirectParam}`, baseUrl)
      )
    }
    
    if (!verifyError && data) {
      console.log("✅ Magic link verification successful, redirecting:", {
        next,
        baseUrl,
        hostHeader: request.headers.get("host"),
        userId: data.user?.id,
        timestamp: new Date().toISOString(),
      })
      
      // Handle redirect
      return NextResponse.redirect(new URL(normalizeNextPath(next), baseUrl))
    }
  }

  // No code and no error - this shouldn't happen, but log it
  console.warn("⚠️ Auth callback called without code or error parameter:", {
    fullUrl: requestUrl.toString(),
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    timestamp: new Date().toISOString(),
  })

  // Return the user to login page on error
  const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
  console.error("🔴 Auth callback error (no code/exchange failed), redirecting to login:", {
    baseUrl,
    hostHeader: request.headers.get("host"),
    timestamp: new Date().toISOString(),
  })
  return NextResponse.redirect(new URL(`/${activeLocale}/login?error=auth_failed${redirectParam}`, baseUrl))
}

