"use client"

import dynamic from "next/dynamic"

const CookieConsent = dynamic(
  () => import("./CookieConsent").then((m) => ({ default: m.CookieConsent })),
  { ssr: false, loading: () => null }
)

export function CookieConsentLazy() {
  return <CookieConsent />
}
