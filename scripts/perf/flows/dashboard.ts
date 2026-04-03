/**
 * flows/dashboard.ts — authenticated dashboard load
 *
 * Key selector: button "Create Game" — only rendered after lobby list + friend list data loads
 */

import { Browser } from '@playwright/test'
import {
  BASE_URL,
  FlowMetrics,
  attachApiCollector,
  collectPaintMetrics,
  dismissCookies,
} from '../shared'
import path from 'path'

const AUTH_STATE = path.resolve(__dirname, '../auth-state.json')

export async function measureDashboard(browser: Browser): Promise<FlowMetrics> {
  const context = await browser.newContext({ storageState: AUTH_STATE })
  const page = await context.newPage()
  const getApiTimings = attachApiCollector(page)

  try {
    const navStart = Date.now()
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await dismissCookies(page)

    // Primary CTA — only visible once server data has rendered
    const keySelector = 'button:has-text("Create Game"), button:has-text("Spiel erstellen")'
    await page.waitForSelector(keySelector, { timeout: 20000 })
    const tti = Date.now() - navStart

    const { fcpMs, domContentLoadedMs } = await collectPaintMetrics(page)

    return {
      flowName: 'dashboard',
      fcpMs,
      domContentLoadedMs,
      timeToInteractiveMs: tti,
      apiTimings: getApiTimings(),
    }
  } catch (err) {
    return {
      flowName: 'dashboard',
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
