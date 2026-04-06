/**
 * flows/lobby-create.ts — create a lobby via API → measure lobby page load
 *
 * Uses page.evaluate() to call /api/lobby/create directly with the page's auth cookies.
 * Avoids React hydration timing issues from trying to click the UI button.
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

export interface LobbyCreateResult {
  metrics: FlowMetrics
  lobbyId: string | null
}

export async function measureLobbyCreate(browser: Browser): Promise<LobbyCreateResult> {
  const context = await browser.newContext({ storageState: AUTH_STATE })
  const page = await context.newPage()
  const getApiTimings = attachApiCollector(page)

  try {
    const navStart = Date.now()

    // Load dashboard first so the page context has all auth cookies active
    await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: 'domcontentloaded' })
    await dismissCookies(page)

    // Call the API directly from page context — uses auth cookies without UI interaction
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/lobby/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rounds: 3 }),
        credentials: 'include',
      })
      const body = await res.json()
      return { status: res.status, body }
    })

    if (result.status !== 200 && result.status !== 201) {
      throw new Error(`API ${result.status}: ${JSON.stringify(result.body).slice(0, 300)}`)
    }

    const lobbyId: string = result.body?.lobby?.id
    if (!lobbyId) throw new Error(`No lobbyId in response: ${JSON.stringify(result.body)}`)

    // Navigate to the lobby page and measure load time
    await page.goto(`${BASE_URL}/en/lobby/${lobbyId}`, { waitUntil: 'domcontentloaded' })
    const keySelector =
      '[data-testid="lobby-player-list"], [data-testid="player-count"], h2:has-text("Lobby"), h1:has-text("Lobby"), [class*="lobby"]'
    await page.waitForSelector(keySelector, { state: 'attached', timeout: 15000 })
    const tti = Date.now() - navStart

    const { fcpMs, domContentLoadedMs } = await collectPaintMetrics(page)

    return {
      metrics: {
        flowName: 'lobby-create',
        fcpMs,
        domContentLoadedMs,
        timeToInteractiveMs: tti,
        apiTimings: getApiTimings(),
      },
      lobbyId,
    }
  } catch (err) {
    return {
      metrics: {
        flowName: 'lobby-create',
        fcpMs: null,
        domContentLoadedMs: null,
        timeToInteractiveMs: null,
        apiTimings: getApiTimings(),
        errorMessage: String(err),
      },
      lobbyId: null,
    }
  } finally {
    await context.close()
  }
}
