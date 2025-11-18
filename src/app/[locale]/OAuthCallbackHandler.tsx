"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Client component to handle OAuth callback
 * Exchanges the code for a session client-side to preserve cookies
 */
export default function OAuthCallbackHandler({
  code,
  locale,
}: {
  code: string
  locale: string
}) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleCallback() {
      try {
        // Log current URL and pathname
        const currentUrl = window.location.href
        const currentPathname = window.location.pathname
        const currentSearch = window.location.search
        
        // Log ALL localStorage keys (not just Supabase ones) to see what's there
        const allLocalStorageKeys = Object.keys(localStorage)
        const localStorageKeys = allLocalStorageKeys.filter(key => 
          key.includes('supabase') || 
          key.includes('code-verifier') ||
          key.includes('pkce') ||
          key.startsWith('sb-')
        )
        
        // Log cookies for debugging
        const allCookies = document.cookie.split(';').map(c => c.trim())
        const supabaseCookies = allCookies.filter(c => 
          c.startsWith('sb-') || 
          c.includes('supabase') ||
          c.includes('code-verifier') ||
          c.includes('pkce')
        )
        
        // Log ALL localStorage to see what Supabase might have stored
        console.log("🟡 Client-side OAuth callback handler - FULL DEBUG:", {
          currentUrl,
          currentPathname,
          currentSearch,
          hasCode: !!code,
          codeLength: code.length,
          codePreview: code.substring(0, 20) + "...",
          allLocalStorageKeysCount: allLocalStorageKeys.length,
          allLocalStorageKeys: allLocalStorageKeys, // Show ALL keys
          supabaseLocalStorageKeys: localStorageKeys,
          localStorageValues: localStorageKeys.map(key => ({
            key,
            valueLength: localStorage.getItem(key)?.length || 0,
            valuePreview: localStorage.getItem(key)?.substring(0, 50) || null,
            fullValue: localStorage.getItem(key), // Show full value for debugging
          })),
          allCookiesCount: allCookies.length,
          allCookies: allCookies, // Show ALL cookies
          supabaseCookiesCount: supabaseCookies.length,
          supabaseCookies: supabaseCookies.map(c => {
            const [name, ...rest] = c.split('=')
            return {
              name: name.trim(),
              valueLength: rest.join('=').trim().length,
              valuePreview: rest.join('=').trim().substring(0, 30),
            }
          }),
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          // Check if code verifier key contains URL information
          codeVerifierUrlMatch: localStorageKeys.find(key => {
            const value = localStorage.getItem(key)
            return value && (value.includes('auth/callback') || value.includes('/de') || value.includes('/en'))
          }),
          timestamp: new Date().toISOString(),
        })
        
        // Try to find code verifier in ALL localStorage keys
        const codeVerifierKey = allLocalStorageKeys.find(key => 
          key.toLowerCase().includes('verifier') || 
          key.toLowerCase().includes('pkce') ||
          key.toLowerCase().includes('code')
        )
        if (codeVerifierKey) {
          console.log("🔍 Found potential code verifier key:", {
            key: codeVerifierKey,
            value: localStorage.getItem(codeVerifierKey),
          })
        } else {
          console.warn("⚠️ No code verifier key found in localStorage!")
        }

        // Exchange code for session - this must be done client-side to preserve localStorage
        // Supabase stores the code verifier in localStorage, so it should be available
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("🔴 Client-side code exchange error:", {
            error,
            errorMessage: error.message,
            errorStatus: error.status,
            timestamp: new Date().toISOString(),
          })
          
          // Redirect to login with error
          router.push(`/${locale}/login?error=auth_failed&error_description=${encodeURIComponent(error.message)}`)
          return
        }

        if (data?.user) {
          console.log("✅ Client-side code exchange successful:", {
            userId: data.user.id,
            email: data.user.email,
            timestamp: new Date().toISOString(),
          })
          
          // Redirect to dashboard
          router.push(`/${locale}/dashboard`)
        } else {
          console.warn("⚠️ Code exchange returned no user data")
          router.push(`/${locale}/login?error=auth_failed`)
        }
      } catch (err: any) {
        console.error("🔴 Unexpected error in OAuth callback handler:", {
          error: err,
          errorMessage: err.message,
          timestamp: new Date().toISOString(),
        })
        router.push(`/${locale}/login?error=auth_failed`)
      }
    }

    handleCallback()
  }, [code, locale, router, supabase])

  // Show loading state while processing
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-neutral-600">Completing sign in...</p>
      </div>
    </div>
  )
}

