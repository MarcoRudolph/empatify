"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"

/**
 * Modern login page with Google OAuth and Magic Link authentication
 * Follows design.mdc and design.checklist.mdc standards
 * Uses tokens from .cursor/tokens.json exclusively
 */
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const supabase = createClient()

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (user && !authError) {
          // User is authenticated, redirect to dashboard
          const redirectParam = searchParams.get("redirect")
          if (redirectParam) {
            router.push(redirectParam)
          } else {
            // Get locale from URL or default
            const pathname = window.location.pathname
            const localeMatch = pathname.match(/^\/(de|en|pt|fr|es)\//)
            const locale = localeMatch ? localeMatch[1] : "de"
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
    // Only show errors if we're not checking auth
    if (isCheckingAuth) return

    const errorParam = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const errorCode = searchParams.get("error_code")
    
    if (errorParam) {
      console.error("🔴 Authentication Error Detected:", {
        error: errorParam,
        errorDescription,
        errorCode,
        fullUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
        timestamp: new Date().toISOString(),
      })
      
      if (errorParam === "auth_failed") {
        setError("Authentication failed. Please try again.")
      } else {
        setError(`Authentication error: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ""}`)
      }
    }
  }, [searchParams, isCheckingAuth])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get redirect parameter from URL
      const redirectParam = searchParams.get("redirect")
      const redirectPath = redirectParam || "/dashboard"
      
      // Get base URL - use IP address in development instead of localhost
      const getBaseUrl = () => {
        if (process.env.NODE_ENV === "production") {
          return window.location.origin
        }
        // In development, use IP address if available, otherwise use origin
        const envUrl = process.env.NEXT_PUBLIC_APP_URL
        if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
          return envUrl
        }
        // Fallback to IP address for OAuth redirects
        return "http://192.168.178.180:3000"
      }
      
      const baseUrl = getBaseUrl()
      const emailRedirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      })

      if (error) throw error

      setIsMagicLinkSent(true)
    } catch (err: any) {
      console.error("🔴 Magic Link error:", {
        error: err,
        errorMessage: err.message,
        errorStack: err.stack,
        email,
        emailRedirectTo,
        baseUrl,
        redirectPath,
        timestamp: new Date().toISOString(),
      })
      setError(err.message || t("invalidEmail"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get redirect parameter from URL
      const redirectParam = searchParams.get("redirect")
      const redirectPath = redirectParam || "/dashboard"
      
      // Get base URL - use IP address in development instead of localhost
      const getBaseUrl = () => {
        if (process.env.NODE_ENV === "production") {
          return window.location.origin
        }
        // In development, use IP address if available, otherwise use origin
        const envUrl = process.env.NEXT_PUBLIC_APP_URL
        if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
          return envUrl
        }
        // Fallback to IP address for OAuth redirects
        return "http://192.168.178.180:3000"
      }
      
      const baseUrl = getBaseUrl()
      
      // IMPORTANT: Supabase uses the Site URL as the base for PKCE code verifier storage
      // If the Site URL doesn't match where the code lands, the code verifier won't match
      // We need to ensure the redirectTo URL matches what Supabase expects
      
      // Build redirect URL - use absolute URL to ensure Supabase stores code verifier correctly
      // The redirectTo MUST match the Site URL or be in the Redirect URLs list in Supabase
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`
      
      // Log for debugging (remove in production)
      if (process.env.NODE_ENV === "development") {
        console.log("OAuth Redirect Debug:", {
          baseUrl,
          redirectTo,
          redirectPath,
          windowOrigin: window.location.origin,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        })
      }

      // Log before OAuth call to see what we're sending
      console.log("🟢 Starting OAuth flow:", {
        redirectTo,
        baseUrl,
        windowLocation: window.location.href,
        windowOrigin: window.location.origin,
        redirectPath,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        timestamp: new Date().toISOString(),
      })

      // Check localStorage before OAuth (should be empty)
      const localStorageBefore = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('code-verifier') || key.includes('pkce') || key.startsWith('sb-')
      )
      console.log("📦 LocalStorage before OAuth:", {
        keys: localStorageBefore,
        count: localStorageBefore.length,
      })

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      })

      if (error) throw error
      
      // Log after OAuth call to see what Supabase stored
      // Note: This might not execute if Supabase redirects immediately
      setTimeout(() => {
        const localStorageAfter = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('code-verifier') || key.includes('pkce') || key.startsWith('sb-')
        )
        console.log("📦 LocalStorage after OAuth (if still on page):", {
          keys: localStorageAfter,
          count: localStorageAfter.length,
          values: localStorageAfter.map(key => ({
            key,
            valueLength: localStorage.getItem(key)?.length || 0,
            valuePreview: localStorage.getItem(key)?.substring(0, 30) || null,
          })),
        })
      }, 100)
      
      // Note: Supabase will redirect automatically, so we don't need to handle the response
    } catch (err: any) {
      console.error("🔴 Google sign-in error:", {
        error: err,
        errorMessage: err.message,
        errorStack: err.stack,
        redirectTo,
        baseUrl,
        redirectPath,
        windowOrigin: window.location.origin,
        timestamp: new Date().toISOString(),
      })
      setError(err.message || "Failed to sign in with Google")
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center relative overflow-hidden py-12 md:py-20">
      {/* Background Pattern */}
      <DotPattern
        className="opacity-[0.08]"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[440px] mx-auto px-6">
        <MagicCard
          className="p-8 md:p-10 rounded-2xl shadow-lg"
          gradientFrom="#FF6B00"
          gradientTo="#E65F00"
          gradientSize={400}
        >
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 mb-6 group"
            aria-label={tCommon("back")}
          >
            <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>{tCommon("back")}</span>
          </button>

          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <AnimatedGradientText
                speed={1.5}
                colorFrom="#FF6B00"
                colorTo="#E65F00"
                className="text-4xl md:text-5xl"
              >
                {tCommon("login")}
              </AnimatedGradientText>
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 bg-neutral-100 border border-neutral-300 rounded-lg flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="size-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isMagicLinkSent && (
            <div
              className="mb-6 p-4 bg-neutral-100 border border-neutral-300 rounded-lg flex items-start gap-3"
              role="status"
            >
              <CheckCircle2 className="size-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {t("magicLinkSent")}
                </p>
              </div>
            </div>
          )}

          {/* Magic Link Form */}
          {!isMagicLinkSent && (
            <form onSubmit={handleMagicLink} className="space-y-6 mb-6">
              <div>
                {/* Visually hidden label for accessibility */}
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
                background="#FF6B00"
                shimmerColor="#ffffff"
                borderRadius="9999px"
                className="w-full font-bold text-lg h-12 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
          )}

          {/* Divider */}
          {!isMagicLinkSent && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-neutral-100 px-4 text-neutral-500">
                  {t("loginWithGoogle")}
                </span>
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          {!isMagicLinkSent && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-6 py-3 h-12 border-2 border-neutral-300 rounded-full bg-neutral-100 text-neutral-900 font-medium hover:bg-neutral-200 hover:border-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-100 disabled:hover:border-neutral-300"
            >
              <svg
                className="size-5 flex-shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{t("loginWithGoogle")}</span>
            </button>
          )}
        </MagicCard>
      </div>
    </div>
  )
}

