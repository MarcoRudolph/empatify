/**
 * global-setup.ts
 *
 * Runs ONCE before the entire Playwright suite.
 * Generates Supabase magic-link sessions for the free and Pro test users and
 * saves browser storage state (cookies + localStorage) to disk.
 * The fixture in fixtures/auth.ts then loads those files — no per-test login.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   TEST_USER_EMAIL
 *   TEST_PRO_USER_EMAIL  (optional — skip Pro tests if not set)
 */

import { chromium, type FullConfig } from '@playwright/test'
import * as path from 'path'
import 'dotenv/config'

export const AUTH_STATE_FREE = path.resolve(__dirname, '.auth/free-user.json')
export const AUTH_STATE_PRO  = path.resolve(__dirname, '.auth/pro-user.json')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

async function generateToken(email: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email }),
  })
  if (!res.ok) throw new Error(`Supabase admin API ${res.status}: ${await res.text()}`)
  const data = await res.json() as { hashed_token: string }
  return data.hashed_token
}

async function saveAuthState(baseURL: string, email: string, outputPath: string) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page    = await context.newPage()

  const token = await generateToken(email)
  await page.goto(
    `${baseURL}/en/auth/callback?token_hash=${token}&type=magiclink&next=%2Fdashboard`,
  )
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

  // Persist the full browser state (HttpOnly SSR cookies + localStorage)
  await context.storageState({ path: outputPath })
  await browser.close()
  console.log(`✅ Auth state saved: ${outputPath}`)
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3001'

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY missing — skipping auth setup')
    return
  }

  const freeEmail = process.env.TEST_USER_EMAIL
  const proEmail  = process.env.TEST_PRO_USER_EMAIL

  // Ensure output directory exists
  const fs = await import('fs')
  const authDir = path.dirname(AUTH_STATE_FREE)
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  if (freeEmail) {
    await saveAuthState(baseURL, freeEmail, AUTH_STATE_FREE)
  } else {
    console.warn('⚠️  TEST_USER_EMAIL not set — auth-gated tests will fail')
  }

  if (proEmail) {
    await saveAuthState(baseURL, proEmail, AUTH_STATE_PRO)
  } else {
    console.warn('⚠️  TEST_PRO_USER_EMAIL not set — Pro-plan tests will be skipped')
  }
}
