/**
 * flows/landing.ts — unauthenticated landing page measurement
 *
 * Key selector: button "Continue with Google" (above fold, no auth required)
 */

import { Browser } from '@playwright/test'
import {
  BASE_URL,
  FlowMetrics,
  attachApiCollector,
  collectPaintMetrics,
  dismissCookies,
} from '../shared'

export async function measureLanding(browser: Browser): Promise<FlowMetrics> {
  const context = await browser.newContext()
  const page = await context.newPage()
  const getApiTimings = attachApiCollector(page)

  try {
    const navStart = Date.now()
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await dismissCookies(page)

    const keySelector = 'button:has-text("Continue with Google"), a:has-text("Continue with Google")'
    await page.waitForSelector(keySelector, { timeout: 15000 })
    const tti = Date.now() - navStart

    const { fcpMs, domContentLoadedMs } = await collectPaintMetrics(page)

    return {
      flowName: 'landing',
      fcpMs,
      domContentLoadedMs,
      timeToInteractiveMs: tti,
      apiTimings: getApiTimings(),
    }
  } catch (err) {
    return {
      flowName: 'landing',
      fcpMs: null,
      domContentLoadedMs: null,
      timeToInteractiveMs: null,
      apiTimings: getApiTimings(),
      errorMessage: String(err),
    }
  } finally {
    await context.close()
  }
}
