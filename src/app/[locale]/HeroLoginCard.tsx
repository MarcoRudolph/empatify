"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

function HeroLoginCardInner() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const localeFromPath =
    typeof window !== "undefined"
      ? window.location.pathname.match(/^\/(de|en|pt|fr|es)(\/|$)/)?.[1] ?? "en"
      : "en"

  const getBaseUrl = () =>
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const redirectPath = searchParams?.get("redirect") || "/dashboard"
    const emailRedirectTo = `${getBaseUrl()}/${localeFromPath}/auth/callback?next=${encodeURIComponent(redirectPath)}`
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      })
      if (error) throw error
      setIsSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email address")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    const redirectPath = searchParams?.get("redirect") || "/dashboard"
    const redirectTo = `${getBaseUrl()}/${localeFromPath}/auth/callback?next=${encodeURIComponent(redirectPath)}`
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (error) throw error
    } catch {
      setError("Failed to sign in with Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="relative rounded-2xl border-4 border-white shadow-[0_8px_48px_rgba(0,0,0,0.18)] bg-white p-6 md:p-8 w-full">

      {isSent ? (
        <div className="text-center py-6">
          <CheckCircle2 className="size-12 text-primary-500 mx-auto mb-4" />
          <p className="font-display font-black text-lg text-neutral-900">Check your email!</p>
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            We sent you a magic link — click it to jump straight in.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Email + CTA */}
          <form onSubmit={handleEmail} className="space-y-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Type your email..."
              className="w-full px-4 py-3 h-12 rounded-xl text-base outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                background: '#ffffff',
                color: '#171717',
                border: '2px solid #FF6B00',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-12 rounded-xl font-display font-black text-base transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: '#000000',
                color: '#ffffff',
                animation: 'glow-cta 2.4s ease-in-out infinite',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading…</span>
                </>
              ) : (
                "Start to gamify your music"
              )}
            </button>
          </form>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <svg className="size-3.5 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="text-xs font-semibold text-neutral-500">56.343 active users</span>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-neutral-400 font-medium">or</span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: '#f5f5f5', color: '#171717', border: '1.5px solid #d4d4d4' }}
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-neutral-400 mt-3">
            If you already have an account, we'll log you in.
          </p>
        </>
      )}
    </div>
  )
}

export function HeroLoginCard() {
  return (
    <Suspense fallback={<div className="w-full rounded-2xl border-4 border-white bg-white/80 h-72 animate-pulse" />}>
      <HeroLoginCardInner />
    </Suspense>
  )
}
