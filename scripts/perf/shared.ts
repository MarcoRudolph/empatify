/**
 * shared.ts — utilities shared across all flow scripts
 */

import { Page, Response } from '@playwright/test'

export const BASE_URL = 'https://www.empatify.de'

export interface ApiTiming {
  url: string
  status: number
  durationMs: number
  contentLengthBytes: number | null
}

export interface FlowMetrics {
  flowName: string
  fcpMs: number | null
  domContentLoadedMs: number | null
  timeToInteractiveMs: number | null   // ms until key selector appears
  apiTimings: ApiTiming[]
  errorMessage?: string
}

/** Dismiss the Empatify cookie consent banner if present. */
export async function dismissCookies(page: Page): Promise<void> {
  try {
    await page.waitForSelector(
      'button[data-ref="e204"], button:has-text("Nur essenzielle")',
      { timeout: 4000 }
    )
    await page
      .locator('button[data-ref="e204"], button:has-text("Nur essenzielle")')
      .first()
      .click()
  } catch {
    // No banner — silently continue
  }
}

/** Attach an API response collector. Returns a getter for the accumulated list. */
export function attachApiCollector(page: Page): () => ApiTiming[] {
  const timings: ApiTiming[] = []
  const inFlight = new Map<string, number>()

  page.on('request', (req) => {
    if (req.url().includes('/api/')) {
      inFlight.set(req.url(), Date.now())
    }
  })

  page.on('response', (res: Response) => {
    const url = res.url()
    if (!url.includes('/api/')) return
    const start = inFlight.get(url)
    if (start === undefined) return
    inFlight.delete(url)
    const contentLength = res.headers()['content-length']
    timings.push({
      url,
      status: res.status(),
      durationMs: Date.now() - start,
      contentLengthBytes: contentLength ? parseInt(contentLength, 10) : null,
    })
  })

  return () => [...timings]
}

/** Collect FCP + DCL from the browser performance API after navigation. */
export async function collectPaintMetrics(
  page: Page
): Promise<{ fcpMs: number | null; domContentLoadedMs: number | null }> {
  const result = await page.evaluate(() => {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint')
    const timing = performance.timing
    const dcl =
      timing.domContentLoadedEventEnd > 0 && timing.navigationStart > 0
        ? timing.domContentLoadedEventEnd - timing.navigationStart
        : null
    return {
      fcpMs: fcp ? Math.round(fcp.startTime) : null,
      domContentLoadedMs: dcl ? Math.round(dcl) : null,
    }
  })
  return result
}
