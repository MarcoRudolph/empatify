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
  const token = requestUrl.searchParams.get("token")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const errorCode = requestUrl.searchParams.get("error_code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"
  const baseUrl = getBaseUrl(request)

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
    
    const cookieStore = await cookies()
    const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
    const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
    const errorParam = `error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ""}${errorCode ? `&error_code=${encodeURIComponent(errorCode)}` : ""}`
    
    return NextResponse.redirect(
      new URL(`/${locale}/login?auth_failed&${errorParam}${redirectParam}`, baseUrl)
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
    if (next.startsWith("/")) {
      if (next.startsWith("/lobby/") || next.startsWith("/redirect")) {
        return NextResponse.redirect(new URL(next, baseUrl))
      }
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(new URL(`/${locale}${next}`, baseUrl))
    } else {
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      return NextResponse.redirect(new URL(`/${locale}/${next}`, baseUrl))
    }
  }

  // Handle PKCE flow (code parameter)
  if (code) {
    console.log("🟡 Attempting to exchange code for session (PKCE flow)...")
    
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
      console.log("✅ Auth callback successful (PKCE), redirecting:", {
        next,
        baseUrl,
        hostHeader: request.headers.get("host"),
        userId: data.user?.id,
        timestamp: new Date().toISOString(),
      })
      
      // Handle redirect
      if (next.startsWith("/")) {
        if (next.startsWith("/lobby/") || next.startsWith("/redirect")) {
          return NextResponse.redirect(new URL(next, baseUrl))
        }
        const cookieStore = await cookies()
        const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
        return NextResponse.redirect(new URL(`/${locale}${next}`, baseUrl))
      } else {
        const cookieStore = await cookies()
        const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
        return NextResponse.redirect(new URL(`/${locale}/${next}`, baseUrl))
      }
    }
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
    
    // Use token_hash if available, otherwise try token
    const verifyParams: any = {
      type: type === "signup" ? "signup" : type === "email" ? "email" : "magiclink",
    }
    
    if (token_hash) {
      verifyParams.token_hash = token_hash
    } else if (token) {
      // Some Supabase flows use 'token' instead of 'token_hash'
      verifyParams.token_hash = token
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
      
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      const redirectParam = next ? `&redirect=${encodeURIComponent(next)}` : ""
      
      return NextResponse.redirect(
        new URL(`/${locale}/login?error=auth_failed&error_description=${encodeURIComponent(verifyError.message)}${redirectParam}`, baseUrl)
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
      if (next.startsWith("/")) {
        if (next.startsWith("/lobby/") || next.startsWith("/redirect")) {
          return NextResponse.redirect(new URL(next, baseUrl))
        }
        const cookieStore = await cookies()
        const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
        return NextResponse.redirect(new URL(`/${locale}${next}`, baseUrl))
      } else {
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

