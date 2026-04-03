/**
 * flows/select-song.ts — Spotify song search + submission timing
 *
 * Navigates to the select-song page for an active lobby (requires lobby-create ran first
 * AND a round has been started by the host).
 *
 * Key selector: Spotify search input — enabled once Spotify Client Credentials token is ready.
 * Also measures how long until first search results appear after typing.
 */

import { Browser } from '@playwright/test'
import {
  BASE_URL,
  FlowMetrics,
  ApiTiming,
  attachApiCollector,
  collectPaintMetrics,
  dismissCookies,
} from '../shared'
import path from 'path'

const AUTH_STATE = path.resolve(__dirname, '../auth-state.json')

export interface SelectSongMetrics extends FlowMetrics {
  searchResultsMs: number | null  // time from keystroke to first results rendered
}

export async function measureSelectSong(
  browser: Browser,
  lobbyId: string
): Promise<SelectSongMetrics> {
  const context = await browser.newContext({ storageState: AUTH_STATE })
  const page = await context.newPage()
  const getApiTimings = attachApiCollector(page)

  try {
    const navStart = Date.now()
    await page.goto(`${BASE_URL}/lobby/${lobbyId}/select-song`, { waitUntil: 'domcontentloaded' })
    await dismissCookies(page)

    // Input appears once Spotify CC token is acquired
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="Suche"], input[type="search"]'
    ).first()
    await searchInput.waitFor({ state: 'visible', timeout: 20000 })
    const tti = Date.now() - navStart

    // Measure search result latency: type a query, wait for results list
    const searchStart = Date.now()
    await searchInput.fill('the beatles')

    let searchResultsMs: number | null = null
    try {
      // Results should appear as list items or cards
      await page.waitForSelector(
        '[data-testid="song-result"], [data-testid="search-result"], ul li:has(img), .song-result',
        { timeout: 10000 }
      )
      searchResultsMs = Date.now() - searchStart
    } catch {
      // Selector mismatch — update after first run against live DOM
      searchResultsMs = null
    }

    const { fcpMs, domContentLoadedMs } = await collectPaintMetrics(page)

    return {
      flowName: 'select-song',
      fcpMs,
      domContentLoadedMs,
      timeToInteractiveMs: tti,
      searchResultsMs,
      apiTimings: getApiTimings(),
    }
  } catch (err) {
    return {
      flowName: 'select-song',
      fcpMs: null,
      domContentLoadedMs: null,
      timeToInteractiveMs: null,
      searchResultsMs: null,
      apiTimings: getApiTimings(),
      errorMessage: String(err),
    }
  } finally {
    await context.close()
  }
}
