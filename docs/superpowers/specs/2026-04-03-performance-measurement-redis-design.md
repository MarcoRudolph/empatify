---
description: "Performance measurement pipeline + Redis caching design for Empatify — Playwright baseline, targeted fixes, Upstash Redis caching, before/after comparison"
paths:
  - "../../CLAUDE.md"
  - "../../../scripts/perf/"
  - "../../../src/lib/cache.ts"
---

# Empatify Performance Measurement + Redis Caching

**Date:** 2026-04-03  
**Goal:** Measure real loading times across all key flows on production (`www.empatify.de`), fix identified bottlenecks, add Upstash Redis caching to hot paths, and verify improvements with a second Playwright run.

---

## Overview

Four sequential phases:

1. **Baseline** — Playwright scripts run all flows on production, capture FCP + API timing, output `perf-report-baseline.json`
2. **Code fixes** — Address bottlenecks found in baseline (parallel fetches, debounce, etc.)
3. **Redis caching** — Add Upstash Redis wrapper around Spotify search, dashboard data, user profile, and Spotify Client Credentials token
4. **Re-measure** — Same Playwright scripts → `perf-report-after.json` → diff report shows % improvement per flow

---

## Phase 1 — Baseline Measurement

### Script structure

```
scripts/perf/
  auth-setup.ts          # one-time: manual Google login → saves auth-state.json
  measure.ts             # main runner: all flows × 3 runs → median report
  flows/
    landing.ts           # unauthenticated landing page
    dashboard.ts         # dashboard load (lobby list, friend list)
    lobby-create.ts      # create lobby → lobby page
    lobby-join.ts        # join existing lobby → lobby page
    select-song.ts       # Spotify search + song submission
  report.ts              # aggregates runs → JSON + markdown table
  cleanup.ts             # deletes test lobbies created during measurement
  auth-state.json        # gitignored — real session tokens, never commit
```

### Auth setup (one-time)

`auth-setup.ts` opens Playwright browser, navigates to `https://www.empatify.de`, dismisses cookie banner, clicks "Continue with Google", waits for user to complete OAuth manually, then waits for URL to match `/dashboard` before calling `context.storageState({ path: 'scripts/perf/auth-state.json' })`.

`auth-state.json` is gitignored. It contains Supabase JWT + refresh token (valid 7 days). Re-run auth-setup when expired.

### Measurement protocol

Each flow runs **3 times**. The **median** of the 3 runs is reported. Before timed runs begin, a single throwaway navigation warms the Vercel deployment (prevents cold-start skew in results).

Each run loads `auth-state.json` via `browser.newContext({ storageState })`.

### Metrics captured per flow

| Metric | How captured |
|---|---|
| First Contentful Paint (FCP) | `page.evaluate(() => performance.getEntriesByType('paint'))` after load |
| DOM Content Loaded | `performance.timing.domContentLoadedEventEnd - navigationStart` |
| Time to interactive (key element) | `page.waitForSelector(selector)` — see per-flow selectors below |
| API response time (per route) | `page.on('response', ...)` filtering `/api/*` |
| API response size | `response.headers()['content-length']` — proxy for cache hit vs miss |

**No `networkidle`** — unreliable with Next.js App Router streaming. Use explicit element selectors instead.

### Per-flow selectors (time-to-interactive signal)

| Flow | Wait selector | Notes |
|---|---|---|
| Landing | `button:has-text("Continue with Google")` | Above fold, visible without scroll |
| Dashboard | `button:has-text("Create Game")` | Primary CTA, only renders after data loads |
| Lobby create | `[data-testid="lobby-player-list"]` or player count element | Lobby ready state |
| Lobby join | Same as lobby create | Joins a lobby pre-created by `lobby-create` flow in the same run |
| Select song | `input[placeholder*="Search"]` or Spotify search input | Input enabled = Spotify token ready; requires active round (lobby-create must run first) |

> If selectors don't match exactly, update after first run against live DOM.

### Cookie banner handling

All flows call a shared `dismissCookies(page)` helper at start: clicks "Nur essenzielle" button (`ref=e204` in current DOM) if present, else no-ops.

### Test data cleanup

`cleanup.ts` runs after all flows complete. It calls the Supabase REST API directly using the service key (`SUPABASE_SERVICE_KEY` env var) to delete any lobby rows where `host_id = TEST_USER_ID AND created_at > [run start timestamp]`. This keeps production data clean.

`TEST_USER_ID` and `SUPABASE_SERVICE_KEY` are set in `.env.local`. The service key is the Supabase project's `service_role` key (not the anon key) — available in the Supabase dashboard under Project Settings → API.

**Flow execution order:** `lobby-create` must run before `lobby-join` and `select-song` in each measurement cycle. `measure.ts` enforces this order and passes the created lobby ID between flows via a shared context object.

---

## Phase 2 — Code Fixes

Fixes applied after reviewing baseline output. Likely candidates based on stack analysis:

**Dashboard data fetching**  
Dashboard probably fetches lobby list → friend list sequentially (waterfall). Fix: wrap in `Promise.all([fetchLobbies(), fetchFriends()])` in the Server Component or route handler.

**Spotify search debounce**  
Song search input likely fires an API call on every keystroke. Fix: 300ms debounce + `AbortController` to cancel in-flight requests when a new keystroke arrives.

**Supabase query optimization**  
Check for N+1 queries on lobby list (fetching player count per lobby in a loop). Fix: single query with `COUNT` join.

> Actual fixes determined by baseline report. This section is updated after Phase 1 runs.

---

## Phase 3 — Redis Caching (Upstash)

### Setup

**Provider:** Upstash Redis — serverless, free tier (10k requests/day), native Vercel integration.  
**Package:** `@upstash/redis`  
**Config:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel env vars and `.env.local`.

### Cache wrapper

`src/lib/cache.ts` — thin wrapper, no magic:

```ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached
  const value = await fn()
  await redis.set(key, value, { ex: ttlSeconds })
  return value
}
```

### Cache targets

| What | Cache key pattern | TTL | Rationale |
|---|---|---|---|
| Spotify track search | `spotify:search:{query}` | 3600s (1h) | Track metadata doesn't change; same query always returns same results |
| Dashboard lobby list | `lobbies:user:{userId}` | 30s | Acceptable staleness for overview; saves Supabase round-trip on every navigation |
| User profile + plan | `user:profile:{userId}` | 300s (5min) | Plan status doesn't change mid-session |
| Spotify Client Credentials token | `spotify:token:cc` | 3500s | Expires every 3600s — cache prevents re-auth on every Vercel cold start |

**Not cached:**
- Lobby real-time state (`/api/lobby/[id]` game state) — changes every few seconds as players join/submit/rate. Stale data causes incorrect game state. Use Supabase Realtime for this.
- Individual song ratings — write-heavy, real-time requirement.

### Cache invalidation

- Lobby list cache (`lobbies:user:{userId}`) is invalidated explicitly when the user creates or deletes a lobby: call `redis.del('lobbies:user:' + userId)` in the relevant API route handlers.
- User profile cache is invalidated on plan upgrade.
- Spotify caches are TTL-only (no manual invalidation needed).

---

## Phase 4 — Re-measure + Comparison

Same `measure.ts` script, second run. Outputs `perf-report-after.json`.

`report.ts` diffs baseline vs after and prints a table (numbers below are illustrative — actual values come from real runs):

```
Flow              | Baseline FCP | After FCP | Δ FCP  | Baseline API | After API | Δ API
Landing           |  ????ms      |  ????ms   |  ?%    |  —           |  —        |  —
Dashboard         |  ????ms      |  ????ms   |  ?%    |  ????ms      |  ????ms   |  ?%
Select Song       |  ????ms      |  ????ms   |  ?%    |  ????ms      |  ????ms   |  ?%
```

The `Δ API` column is where Redis impact is visible. Response size drop (`content-length`) confirms cache hits.

---

## Constraints

- Playwright runs against **production only** — no localhost measurement (Vercel cold starts and real Supabase latency are the actual problem space)
- Google OAuth cannot be automated — one manual login required per 7-day session window
- Lobby real-time state is **excluded** from caching — correctness over performance for in-game data
- Cache wrapper is additive only — no existing route handler logic is modified, only wrapped

---

## Success Criteria

- Baseline report generated with valid timings for all 5 flows
- Dashboard FCP reduced by ≥ 40% after fixes + caching
- Spotify song search first-result time reduced by ≥ 50%
- No regression in lobby join / song submission correctness
- Upstash free tier sufficient (< 10k Redis requests/day at current traffic)
