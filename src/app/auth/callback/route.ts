import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { routing } from "@/i18n/routing"

/**
 * Auth callback route for handling OAuth and Magic Link redirects
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the locale from the cookie or default to first locale
      const cookieStore = await cookies()
      const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
      
      return NextResponse.redirect(new URL(`/${locale}${next}`, requestUrl.origin))
    }
  }

  // Return the user to login page on error
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || routing.locales[0]
  return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, requestUrl.origin))
}

