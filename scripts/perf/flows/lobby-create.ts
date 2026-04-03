/**
 * flows/lobby-create.ts — create a lobby from dashboard → reach lobby page
 *
 * Returns FlowMetrics + the created lobby ID (passed to lobby-join and select-song).
 * Key selector: player list or round count — indicates lobby is fully loaded.
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
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await dismissCookies(page)

    // Open create-game modal / section
    const createBtn = page.locator('button:has-text("Create Game"), button:has-text("Spiel erstellen")').first()
    await createBtn.waitFor({ state: 'visible', timeout: 15000 })
    await createBtn.click()

    // Submit the game creation form with defaults (no category, standard rounds)
    // Try "Start" or "Create" button inside the modal/form
    const submitBtn = page
      .locator('button[type="submit"], button:has-text("Start"), button:has-text("Starten"), button:has-text("Create Lobby")')
      .first()
    await submitBtn.waitFor({ state: 'visible', timeout: 8000 })

    const navStart = Date.now()
    await submitBtn.click()

    // Wait for redirect to /lobby/[id]
    await page.waitForURL(/\/lobby\//, { timeout: 20000 })
    const lobbyUrl = page.url()
    const lobbyIdMatch = lobbyUrl.match(/\/lobby\/([^/?#]+)/)
    const lobbyId = lobbyIdMatch ? lobbyIdMatch[1] : null

    // Wait for lobby to be interactive (player list)
    const keySelector =
      '[data-testid="lobby-player-list"], [data-testid="player-count"], h2:has-text("Lobby"), h1:has-text("Lobby")'
    await page.waitForSelector(keySelector, { timeout: 15000 })
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
