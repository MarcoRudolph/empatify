import { Suspense } from "react"
import LoginPageClient from "./LoginPageClient"

/**
 * Login page. Wraps the client component that uses useSearchParams() in a Suspense
 * boundary so the route can be statically prerendered (see Next.js missing-suspense-with-csr-bailout).
 */
function LoginFallback() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center relative overflow-hidden">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
        <p className="text-neutral-600">Loading...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageClient />
    </Suspense>
  )
}
