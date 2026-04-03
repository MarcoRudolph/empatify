/**
 * report.ts — Aggregates flow metrics into JSON + markdown table
 *
 * Called by measure.ts after all runs complete.
 * Also exports diffReports() for Phase 4 baseline vs after comparison.
 */

import fs from 'fs'
import path from 'path'
import { FlowMetrics } from './shared'

export interface PerfReport {
  label: string
  generatedAt: string
  runStartedAt: string
  flows: FlowMetrics[]
}

export function generateReport(
  flows: FlowMetrics[],
  label: string,
  runStartedAt: string
): string {
  const report: PerfReport = {
    label,
    generatedAt: new Date().toISOString(),
    runStartedAt,
    flows,
  }

  const outputDir = path.resolve(__dirname)
  const jsonPath = path.join(outputDir, `perf-report-${label}.json`)
  const mdPath = path.join(outputDir, `perf-report-${label}.md`)

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  const md = buildMarkdownTable(flows, label)
  fs.writeFileSync(mdPath, md)

  return jsonPath
}

function buildMarkdownTable(flows: FlowMetrics[], label: string): string {
  const header = `# Empatify Performance Report — ${label}\n\nGenerated: ${new Date().toISOString()}\n\n`

  const tableHeader =
    '| Flow | FCP (ms) | DCL (ms) | TTI (ms) | Errors |\n' +
    '|------|----------|----------|----------|--------|\n'

  const rows = flows
    .map((f) => {
      const fcp = f.fcpMs !== null ? f.fcpMs : '—'
      const dcl = f.domContentLoadedMs !== null ? f.domContentLoadedMs : '—'
      const tti = f.timeToInteractiveMs !== null ? f.timeToInteractiveMs : '—'
      const err = f.errorMessage ? `⚠ ${f.errorMessage.slice(0, 60)}` : '—'
      return `| ${f.flowName} | ${fcp} | ${dcl} | ${tti} | ${err} |`
    })
    .join('\n')

  const apiSection = buildApiSection(flows)

  return header + tableHeader + rows + '\n\n' + apiSection
}

function buildApiSection(flows: FlowMetrics[]): string {
  const lines: string[] = ['## API Response Times\n']
  lines.push('| Flow | Route | Status | Duration (ms) | Size (bytes) |')
  lines.push('|------|-------|--------|---------------|--------------|')

  for (const flow of flows) {
    for (const api of flow.apiTimings) {
      const routeShort = api.url.replace(/https?:\/\/[^/]+/, '')
      const size = api.contentLengthBytes !== null ? api.contentLengthBytes : '—'
      lines.push(`| ${flow.flowName} | ${routeShort} | ${api.status} | ${api.durationMs} | ${size} |`)
    }
  }

  return lines.join('\n') + '\n'
}

/** Phase 4: diff two reports and print improvement table */
export function diffReports(baselinePath: string, afterPath: string): void {
  const baseline: PerfReport = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  const after: PerfReport = JSON.parse(fs.readFileSync(afterPath, 'utf8'))

  console.log('\n=== Performance Improvement Report ===\n')
  console.log(
    'Flow'.padEnd(18) +
      'Before FCP'.padStart(12) +
      'After FCP'.padStart(12) +
      'Δ FCP'.padStart(10) +
      'Before TTI'.padStart(12) +
      'After TTI'.padStart(12) +
      'Δ TTI'.padStart(10)
  )
  console.log('-'.repeat(86))

  for (const bFlow of baseline.flows) {
    const aFlow = after.flows.find((f) => f.flowName === bFlow.flowName)
    if (!aFlow) continue

    const deltaFcp =
      bFlow.fcpMs && aFlow.fcpMs
        ? `${Math.round(((aFlow.fcpMs - bFlow.fcpMs) / bFlow.fcpMs) * 100)}%`
        : '—'
    const deltaTti =
      bFlow.timeToInteractiveMs && aFlow.timeToInteractiveMs
        ? `${Math.round(((aFlow.timeToInteractiveMs - bFlow.timeToInteractiveMs) / bFlow.timeToInteractiveMs) * 100)}%`
        : '—'

    console.log(
      bFlow.flowName.padEnd(18) +
        String(bFlow.fcpMs ?? '—').padStart(12) +
        String(aFlow.fcpMs ?? '—').padStart(12) +
        deltaFcp.padStart(10) +
        String(bFlow.timeToInteractiveMs ?? '—').padStart(12) +
        String(aFlow.timeToInteractiveMs ?? '—').padStart(12) +
        deltaTti.padStart(10)
    )
  }

  // API timing diff
  console.log('\n=== API Timing Improvement ===\n')
  for (const bFlow of baseline.flows) {
    const aFlow = after.flows.find((f) => f.flowName === bFlow.flowName)
    if (!aFlow || bFlow.apiTimings.length === 0) continue
    for (const bApi of bFlow.apiTimings) {
      const aApi = aFlow.apiTimings.find((a) => a.url === bApi.url)
      if (!aApi) continue
      const delta = Math.round(((aApi.durationMs - bApi.durationMs) / bApi.durationMs) * 100)
      const route = bApi.url.replace(/https?:\/\/[^/]+/, '').slice(0, 45)
      console.log(`  ${bFlow.flowName} ${route}: ${bApi.durationMs}ms → ${aApi.durationMs}ms (${delta >= 0 ? '+' : ''}${delta}%)`)
    }
  }
}

// Allow running as: npx tsx scripts/perf/report.ts diff
if (process.argv[2] === 'diff') {
  const baselinePath = path.resolve(__dirname, 'perf-report-baseline.json')
  const afterPath = path.resolve(__dirname, 'perf-report-after.json')
  if (!fs.existsSync(baselinePath) || !fs.existsSync(afterPath)) {
    console.error('Both perf-report-baseline.json and perf-report-after.json are required.')
    process.exit(1)
  }
  diffReports(baselinePath, afterPath)
}
