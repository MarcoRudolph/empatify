/**
 * auth-setup.ts
 *
 * Generates a Supabase magic link via the Admin API, navigates Playwright to it
 * headlessly, and captures the full browser state (cookies + localStorage) once
 * the app lands on /dashboard.
 *
 * No Google OAuth. No manual DevTools steps. Fully automated.
 *
 * Run: npx tsx scripts/perf/auth-setup.ts
 * Requires: SUPABASE_SERVICE_KEY + TEST_USER_EMAIL in .env
 */

import 'dotenv/config'
import { chromium } from '@playwright/test'
import path from 'path'

const AUTH_STATE_PATH = path.resolve(__dirname, 'auth-state.json')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!

interface GenerateLinkResponse {
  hashed_token: string
  verification_type: string
}

async function generateHashedToken(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'magiclink',
      email: TEST_USER_EMAIL,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Admin API error ${res.status}: ${body}`)
  }

  const data = await res.json() as GenerateLinkResponse
  if (!data.hashed_token) throw new Error('No hashed_token in response')
  return data.hashed_token
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY || !TEST_USER_EMAIL) {
    console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, TEST_USER_EMAIL')
    process.exit(1)
  }

  // Generate token — each call produces a single-use hashed_token
  console.log(`Generating magic link token for ${TEST_USER_EMAIL}...`)
  const hashedToken = await generateHashedToken()
  console.log('Token generated.')

  // Build callback URL directly — this goes through the server-side /auth/callback route
  // which calls supabase.auth.verifyOtp() server-side, sets SSR cookies in the HTTP response,
  // and redirects to /dashboard. Bypasses implicit flow (tokens-in-hash) entirely.
  const callbackUrl =
    `https://www.empatify.de/en/auth/callback` +
    `?token_hash=${hashedToken}&type=magiclink&next=%2Fdashboard`

  console.log('Launching headless Chromium...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('Navigating to server-side auth callback...')
  await page.goto(callbackUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Server sets cookies + redirects to /en/dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })
  console.log(`Landed on: ${page.url()}`)

  // Capture FULL browser state: all cookies (incl. HttpOnly SSR cookies) + localStorage
  await context.storageState({ path: AUTH_STATE_PATH })
  console.log(`\nauth-state.json saved: ${AUTH_STATE_PATH}`)
  console.log('Run: npm run perf:measure')

  await browser.close()
}

main().catch((err) => {
  console.error('auth-setup failed:', err.message ?? err)
  process.exit(1)
})
