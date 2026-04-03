/**
 * auth-setup.ts
 *
 * One-time manual Google OAuth login for Empatify on production.
 * Saves session state to auth-state.json (gitignored, valid ~7 days).
 *
 * Run: npx tsx scripts/perf/auth-setup.ts
 */

import { chromium } from '@playwright/test'
import path from 'path'

const BASE_URL = 'https://www.empatify.de'
const AUTH_STATE_PATH = path.resolve(__dirname, 'auth-state.json')

async function main() {
  console.log('Launching browser for manual Google login...')
  const browser = await chromium.launch({ headless: false, slowMo: 50 })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(BASE_URL)

  // Dismiss cookie banner if present
  try {
    await page.waitForSelector('button[data-ref="e204"], button:has-text("Nur essenzielle")', { timeout: 5000 })
    const cookieBtn = page.locator('button[data-ref="e204"], button:has-text("Nur essenzielle")').first()
    await cookieBtn.click()
    console.log('Cookie banner dismissed.')
  } catch {
    console.log('No cookie banner found, continuing.')
  }

  // Click Google sign-in
  const googleBtn = page.locator('button:has-text("Continue with Google"), a:has-text("Continue with Google")').first()
  await googleBtn.waitFor({ state: 'visible', timeout: 10000 })
  await googleBtn.click()

  console.log('>>> Complete the Google login in the browser window <<<')
  console.log('Waiting for redirect to /dashboard...')

  // Wait for post-auth redirect
  await page.waitForURL(/\/dashboard/, { timeout: 120000 })
  console.log('Login successful. Saving auth state...')

  await context.storageState({ path: AUTH_STATE_PATH })
  console.log(`Auth state saved to: ${AUTH_STATE_PATH}`)

  await browser.close()
}

main().catch((err) => {
  console.error('auth-setup failed:', err)
  process.exit(1)
})
