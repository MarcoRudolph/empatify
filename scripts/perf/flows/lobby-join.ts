/**
 * flows/lobby-join.ts — join an existing lobby (created by lobby-create in the same run)
 *
 * Navigates directly to /lobby/[id]. The host is a different context so joining
 * doesn't require a separate account — we just time how fast the lobby page renders.
 * Key selector: same as lobby-create (player list / lobby heading).
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

export async function measureLobbyJoin(
  browser: Browser,
  lobbyId: string
): Promise<FlowMetrics> {
  const context = await browser.newContext({ storageState: AUTH_STATE })
  const page = await context.newPage()
  const getApiTimings = attachApiCollector(page)

  try {
    const navStart = Date.now()
    await page.goto(`${BASE_URL}/lobby/${lobbyId}`, { waitUntil: 'domcontentloaded' })
    await dismissCookies(page)

    const keySelector =
      '[data-testid="lobby-player-list"], [data-testid="player-count"], h2:has-text("Lobby"), h1:has-text("Lobby")'
    await page.waitForSelector(keySelector, { timeout: 15000 })
    const tti = Date.now() - navStart

    const { fcpMs, domContentLoadedMs } = await collectPaintMetrics(page)

    return {
      flowName: 'lobby-join',
      fcpMs,
      domContentLoadedMs,
      timeToInteractiveMs: tti,
      apiTimings: getApiTimings(),
    }
  } catch (err) {
    return {
      flowName: 'lobby-join',
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
