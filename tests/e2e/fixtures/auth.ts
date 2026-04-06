/**
 * auth.ts — Playwright fixtures that load pre-baked auth state.
 *
 * global-setup.ts runs once before the suite and saves session cookies to
 * tests/e2e/.auth/*.json.  These fixtures simply load those files so tests
 * start already logged in — no magic-link round-trip per test.
 *
 * If a state file is missing (e.g. env vars not set), the fixture skips
 * gracefully rather than throwing, so the suite can still partially run.
 */

import { test as base, type BrowserContext, type Page } from '@playwright/test'
import * as fs from 'fs'
import { AUTH_STATE_FREE, AUTH_STATE_PRO } from '../global-setup'

type AuthFixtures = {
  /** Browser context pre-loaded with free-plan user cookies */
  authCtx: BrowserContext
  /** Page inside authCtx — use this in free-plan tests */
  authPage: Page
  /** Browser context pre-loaded with Pro-plan user cookies */
  proCtx: BrowserContext
  /** Page inside proCtx — use this in Pro-plan tests */
  proPage: Page
}

export const test = base.extend<AuthFixtures>({
  authCtx: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_STATE_FREE)) {
      console.warn(`Skipping: auth state not found at ${AUTH_STATE_FREE}`)
      // Provide an unauthenticated context so the fixture resolves
      const ctx = await browser.newContext()
      await use(ctx)
      await ctx.close()
      return
    }
    const ctx = await browser.newContext({ storageState: AUTH_STATE_FREE })
    await use(ctx)
    await ctx.close()
  },

  authPage: async ({ authCtx }, use) => {
    const page = await authCtx.newPage()
    await use(page)
    await page.close()
  },

  proCtx: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_STATE_PRO)) {
      console.warn(`Skipping: Pro auth state not found at ${AUTH_STATE_PRO}`)
      const ctx = await browser.newContext()
      await use(ctx)
      await ctx.close()
      return
    }
    const ctx = await browser.newContext({ storageState: AUTH_STATE_PRO })
    await use(ctx)
    await ctx.close()
  },

  proPage: async ({ proCtx }, use) => {
    const page = await proCtx.newPage()
    await use(page)
    await page.close()
  },
})

export { expect } from '@playwright/test'
