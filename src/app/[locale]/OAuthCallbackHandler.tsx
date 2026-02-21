"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Client component to handle OAuth callback
 * Exchanges the code for a session client-side to preserve cookies
 */
export default function OAuthCallbackHandler({
  code,
  locale,
  next,
}: {
  code: string
  locale: string
  next?: string
}) {
  const router = useRouter()
  const hasProcessedRef = useRef(false)
  const isLocalizedPath = (path: string) => /^\/(en|de|pt|fr|es)(\/|$)/.test(path)
  const redirectPath =
    next && next.startsWith("/")
      ? isLocalizedPath(next)
        ? next
        : `/${locale}${next}`
      : `/${locale}/dashboard`

  useEffect(() => {
    // Prevent duplicate code exchanges (React Strict Mode/dev re-renders).
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    async function handleCallback() {
      try {
        const supabase = createClient()

        // Exchange code for session - this must be done client-side to preserve localStorage
        // Supabase stores the code verifier in localStorage, so it should be available
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          // In some edge cases session can already be set even if exchange reports an error.
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session?.user) {
            router.replace(redirectPath)
            return
          }

          router.replace(
            `/${locale}/login?error=auth_failed&error_description=${encodeURIComponent(error.message)}`
          )
          return;
        }

        if (data?.user) {
          router.replace(redirectPath)
        } else {
          router.replace(`/${locale}/login?error=auth_failed`)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        router.replace(`/${locale}/login?error=auth_failed&error_description=${encodeURIComponent(message)}`)
      }
    }

    handleCallback()
  }, [code, locale, redirectPath, router])

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

