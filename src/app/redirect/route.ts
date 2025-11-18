import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { routing } from "@/i18n/routing"
import { getBaseUrl } from "@/lib/utils"

/**
 * GET /redirect
 * Handles redirects from QR codes and OAuth callbacks
 * Extracts lobbyId from query params and redirects to lobby after authentication
 * 
 * Flow:
 * 1. User scans QR code -> /redirect?lobbyId={id}
 * 2. If not authenticated -> /login?redirect=/redirect?lobbyId={id}
 * 3. After login -> /auth/callback?next=/redirect?lobbyId={id}
 * 4. Auth callback -> /redirect?lobbyId={id} (this route)
 * 5. This route -> /lobby/{id}
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const lobbyId = requestUrl.searchParams.get("lobbyId")
  const baseUrl = getBaseUrl(request)
  
  // Get locale from cookie or default
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]

  // Check if user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If not authenticated, redirect to login with redirect parameter
  if (authError || !user) {
    const redirectUrl = lobbyId
      ? `/redirect?lobbyId=${lobbyId}`
      : "/redirect"
    console.log("User not authenticated, redirecting to login:", {
      redirectUrl,
      baseUrl,
      hostHeader: request.headers.get("host"),
    })
    return NextResponse.redirect(
      new URL(`/${locale}/login?redirect=${encodeURIComponent(redirectUrl)}`, baseUrl)
    )
  }

  // User is authenticated, redirect to lobby if lobbyId is provided
  if (lobbyId) {
    console.log("User authenticated, redirecting to lobby:", {
      lobbyId,
      baseUrl,
      hostHeader: request.headers.get("host"),
    })
    return NextResponse.redirect(new URL(`/lobby/${lobbyId}`, baseUrl))
  }

  // No lobbyId, redirect to dashboard
  console.log("No lobbyId provided, redirecting to dashboard:", {
    baseUrl,
    hostHeader: request.headers.get("host"),
  })
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, baseUrl))
}

