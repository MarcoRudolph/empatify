"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { Link } from "@/i18n/routing"

/**
 * Client-side login UI. Uses useSearchParams(); must be rendered inside a Suspense boundary.
 * Empatify-branded sign-in page with Google OAuth (primary) and Magic Link (secondary).
 */
export default function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const localeFromPath =
    typeof window !== "undefined"
      ? window.location.pathname.match(/^\/(de|en|pt|fr|es)(\/|$)/)?.[1] ?? "en"
      : "en"

  const supabase = useMemo(() => createClient(), [])

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const redirectParam = searchParams.get("redirect")
          if (redirectParam) {
            router.push(redirectParam)
          } else {
            const pathname = window.location.pathname
            const localeMatch = pathname.match(/^\/(de|en|pt|fr|es)\//)
            const locale = localeMatch ? localeMatch[1] : "en"
            router.push(`/${locale}/dashboard`)
          }
          return
        }
      } catch (err) {
        console.error("Error checking auth:", err)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, searchParams, supabase])

  useEffect(() => {
    if (isCheckingAuth) return

    const errorParam = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (errorParam) {
      console.error("🔴 Authentication Error Detected:", {
        error: errorParam,
        errorDescription,
        fullUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
        timestamp: new Date().toISOString(),
      })

      if (errorParam === "auth_failed") {
        setError(t("authFailed"))
      } else if (errorParam === "access_denied" || errorDescription?.toLowerCase().includes("invalid") || errorDescription?.toLowerCase().includes("expired")) {
        setError(t("magicLinkExpired"))
      } else {
        setError(`${t("authenticationError")}: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ""}`)
      }
    }
  }, [searchParams, isCheckingAuth, t])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const redirectParam = searchParams.get("redirect")
    const redirectPath = redirectParam || "/dashboard"

    const getBaseUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_APP_URL
      if (envUrl) return envUrl
      return window.location.origin
    }

    const baseUrl = getBaseUrl()
    const emailRedirectTo = `${baseUrl}/${localeFromPath}/auth/callback?next=${encodeURIComponent(redirectPath)}`

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      })

      if (error) throw error

      setIsMagicLinkSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("invalidEmail")
      console.error("🔴 Magic Link error:", {
        error: err,
        email,
        emailRedirectTo,
        baseUrl,
        redirectPath,
        timestamp: new Date().toISOString(),
      })
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    const redirectParam = searchParams.get("redirect")
    const redirectPath = redirectParam || "/dashboard"

    const getBaseUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_APP_URL
      if (envUrl) return envUrl
      return window.location.origin
    }

    const baseUrl = getBaseUrl()
    const redirectTo = `${baseUrl}/${localeFromPath}/auth/callback?next=${encodeURIComponent(redirectPath)}`

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      })

      if (error) throw error
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google"
      console.error("Google sign-in error:", err)
      setError(message)
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center relative overflow-hidden py-12 md:py-20">
      <DotPattern
        className="opacity-[0.06]"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      <div className="relative z-10 w-full max-w-[440px] mx-auto px-6 flex flex-col items-center gap-8">
        {/* Brand mark — outside the card, on the dark background */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="spin-slow text-primary-500 size-8 shrink-0">
              <svg viewBox="2 1 36 38" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-8" aria-hidden="true">
                <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
                <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
                <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
                <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
                <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
                <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
                <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
              </svg>
            </div>
            <span className="font-display text-2xl font-black tracking-tight text-white">
              empatify
            </span>
          </div>
          <p className="text-sm text-neutral-400 tracking-wide">
            {t("tagline")}
          </p>
        </div>

        {/* Auth card */}
        <MagicCard
          className="w-full p-8 md:p-10 rounded-2xl shadow-2xl"
          gradientFrom="var(--color-primary-500)"
          gradientTo="var(--color-primary-600)"
          gradientSize={400}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 mb-7 group"
            aria-label={tCommon("back")}
          >
            <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>{tCommon("back")}</span>
          </button>

          {error && (
            <div
              className="mb-6 p-4 bg-neutral-100 border border-neutral-300 rounded-lg flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="size-5 text-primary-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-neutral-900">{error}</p>
            </div>
          )}

          {isMagicLinkSent ? (
            <div
              className="py-6 text-center"
              role="status"
            >
              <CheckCircle2 className="size-12 text-primary-500 mx-auto mb-4" />
              <p className="font-semibold text-lg text-white">
                {t("magicLinkSent")}
              </p>
            </div>
          ) : (
            <>
              {/* Primary: Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 h-12 border border-neutral-300 rounded-full bg-white text-neutral-900 font-semibold hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span>{t("continueWithGoogle")}</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-neutral-100 px-4 text-neutral-500 uppercase tracking-wider">
                    {t("orContinueWithEmail")}
                  </span>
                </div>
              </div>

              {/* Secondary: Magic link */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 size-5 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 h-12 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      placeholder={t("enterEmail")}
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={error ? "email-error" : undefined}
                    />
                  </div>
                </div>

                <ShimmerButton
                  type="submit"
                  disabled={isLoading || !email}
                  background="var(--color-primary-500)"
                  shimmerColor="var(--color-neutral-900)"
                  borderRadius="9999px"
                  className="w-full font-bold text-base h-12 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      <span>{tCommon("loading")}</span>
                    </span>
                  ) : (
                    t("sendMagicLink")
                  )}
                </ShimmerButton>
              </form>
            </>
          )}

          {/* Privacy notice */}
          <p className="mt-6 text-center text-xs text-neutral-500">
            {t("privacyNotice")}{" "}
            <Link href="/datenschutz" className="underline underline-offset-2 hover:text-neutral-700 transition-colors">
              {t("privacyPolicy")}
            </Link>
          </p>
        </MagicCard>
      </div>
    </div>
  )
}
