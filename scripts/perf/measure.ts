/**
 * measure.ts — Main orchestrator for performance measurement
 *
 * Runs all 5 flows × 3 times each, computes medians, outputs perf-report-baseline.json
 * (or perf-report-after.json when RUN_LABEL=after).
 *
 * Usage:
 *   npx tsx scripts/perf/measure.ts
 *   RUN_LABEL=after npx tsx scripts/perf/measure.ts
 *
 * Prerequisites:
 *   - auth-state.json must exist (run auth-setup.ts first)
 *   - TEST_USER_ID and SUPABASE_SERVICE_KEY set in .env (or .env.local)
 */

import 'dotenv/config'
import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { FlowMetrics } from './shared'
import { measureLanding } from './flows/landing'
import { measureDashboard } from './flows/dashboard'
import { measureLobbyCreate } from './flows/lobby-create'
import { measureLobbyJoin } from './flows/lobby-join'
import { measureSelectSong } from './flows/select-song'
import { generateReport } from './report'
import { cleanupTestLobbies } from './cleanup'

const RUNS = 3
const RUN_LABEL = process.env.RUN_LABEL ?? 'baseline'
const AUTH_STATE = path.resolve(__dirname, 'auth-state.json')
const BASE_URL = 'https://www.empatify.de'

function median(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  if (valid.length === 0) return null
  const mid = Math.floor(valid.length / 2)
  return valid.length % 2 !== 0 ? valid[mid] : Math.round((valid[mid - 1] + valid[mid]) / 2)
}

function medianMetrics(runs: FlowMetrics[]): FlowMetrics {
  const base = runs[0]
  // Flatten all apiTimings — group by URL path pattern, report median per route
  const allUrls = [...new Set(runs.flatMap((r) => r.apiTimings.map((t) => t.url)))]
  const apiTimings = allUrls.map((url) => {
    const matching = runs.flatMap((r) => r.apiTimings.filter((t) => t.url === url))
    const medianDuration = median(matching.map((t) => t.durationMs))
    const medianSize = median(matching.map((t) => t.contentLengthBytes))
    return {
      url,
      status: matching[0]?.status ?? 0,
      durationMs: medianDuration ?? 0,
      contentLengthBytes: medianSize,
    }
  })

  return {
    flowName: base.flowName,
    fcpMs: median(runs.map((r) => r.fcpMs)),
    domContentLoadedMs: median(runs.map((r) => r.domContentLoadedMs)),
    timeToInteractiveMs: median(runs.map((r) => r.timeToInteractiveMs)),
    apiTimings,
    errorMessage: runs.some((r) => r.errorMessage)
      ? runs.map((r) => r.errorMessage).filter(Boolean).join(' | ')
      : undefined,
  }
}

async function warmup(): Promise<void> {
  console.log('Warming up Vercel deployment (throwaway navigation)...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  } catch {
    // Warmup failure is non-fatal
  } finally {
    await browser.close()
  }
  console.log('Warmup done.\n')
}

async function main() {
  if (!fs.existsSync(AUTH_STATE)) {
    console.error('ERROR: auth-state.json not found. Run auth-setup.ts first.')
    process.exit(1)
  }

  const runStartedAt = new Date().toISOString()
  const createdLobbyIds: string[] = []

  await warmup()

  const browser = await chromium.launch({ headless: true })

  const allRuns: Record<string, FlowMetrics[]> = {
    landing: [],
    dashboard: [],
    'lobby-create': [],
    'lobby-join': [],
    'select-song': [],
  }

  for (let run = 1; run <= RUNS; run++) {
    console.log(`\n=== Run ${run}/${RUNS} ===`)

    // 1. Landing
    process.stdout.write('  landing... ')
    const landingMetrics = await measureLanding(browser)
    allRuns.landing.push(landingMetrics)
    console.log(`FCP=${landingMetrics.fcpMs}ms TTI=${landingMetrics.timeToInteractiveMs}ms${landingMetrics.errorMessage ? ' [ERR]' : ''}`)

    // 2. Dashboard
    process.stdout.write('  dashboard... ')
    const dashboardMetrics = await measureDashboard(browser)
    allRuns.dashboard.push(dashboardMetrics)
    console.log(`FCP=${dashboardMetrics.fcpMs}ms TTI=${dashboardMetrics.timeToInteractiveMs}ms${dashboardMetrics.errorMessage ? ' [ERR]' : ''}`)

    // 3. Lobby create (must run before join + select-song)
    process.stdout.write('  lobby-create... ')
    const { metrics: createMetrics, lobbyId } = await measureLobbyCreate(browser)
    allRuns['lobby-create'].push(createMetrics)
    if (lobbyId) createdLobbyIds.push(lobbyId)
    console.log(`FCP=${createMetrics.fcpMs}ms TTI=${createMetrics.timeToInteractiveMs}ms lobbyId=${lobbyId ?? 'null'}${createMetrics.errorMessage ? ' [ERR]' : ''}`)

    // 4. Lobby join (requires lobbyId from step 3)
    if (lobbyId) {
      process.stdout.write('  lobby-join... ')
      const joinMetrics = await measureLobbyJoin(browser, lobbyId)
      allRuns['lobby-join'].push(joinMetrics)
      console.log(`FCP=${joinMetrics.fcpMs}ms TTI=${joinMetrics.timeToInteractiveMs}ms${joinMetrics.errorMessage ? ' [ERR]' : ''}`)
    } else {
      console.log('  lobby-join... SKIPPED (no lobbyId)')
      allRuns['lobby-join'].push({
        flowName: 'lobby-join',
        fcpMs: null,
        domContentLoadedMs: null,
        timeToInteractiveMs: null,
        apiTimings: [],
        errorMessage: 'Skipped — lobby-create returned no lobbyId',
      })
    }

    // 5. Select song (requires lobbyId; note: round must be started by host)
    if (lobbyId) {
      process.stdout.write('  select-song... ')
      const songMetrics = await measureSelectSong(browser, lobbyId)
      allRuns['select-song'].push(songMetrics as FlowMetrics)
      console.log(`FCP=${songMetrics.fcpMs}ms TTI=${songMetrics.timeToInteractiveMs}ms search=${(songMetrics as any).searchResultsMs}ms${songMetrics.errorMessage ? ' [ERR]' : ''}`)
    } else {
      console.log('  select-song... SKIPPED (no lobbyId)')
      allRuns['select-song'].push({
        flowName: 'select-song',
        fcpMs: null,
        domContentLoadedMs: null,
        timeToInteractiveMs: null,
        apiTimings: [],
        errorMessage: 'Skipped — lobby-create returned no lobbyId',
      })
    }
  }

  await browser.close()

  // Compute medians
  const medians: FlowMetrics[] = Object.values(allRuns).map((runs) => medianMetrics(runs))

  // Write report
  const reportPath = generateReport(medians, RUN_LABEL, runStartedAt)
  console.log(`\nReport written: ${reportPath}`)

  // Cleanup test lobbies
  if (createdLobbyIds.length > 0) {
    await cleanupTestLobbies(createdLobbyIds)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('measure.ts failed:', err)
  process.exit(1)
})
