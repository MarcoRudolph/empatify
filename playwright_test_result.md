---
description: "Post-mortem of failed Playwright test session — what went wrong and why"
---

# Playwright Test Session — Post-Mortem

## What was attempted

Run E2E tests for Pro Plan features (UpgradeModal, dashboard CreateGameSection, API gates) using Playwright.

## What actually happened: 0 tests passed

---

## Mistake 1 — Wrong tool for browser automation

**Used:** `uvx mcp2cli @playwright` (CLI wrapper)  
**Problem:** Each CLI call spawns a new subprocess MCP server. The browser session dies between calls. Navigate → screenshot in two separate commands = screenshot of `about:blank`. Every single screenshot was blank.  
**Should have used:** `mcp__playwright__browser_*` tools directly — these are persistent within the Claude Code session and maintain browser state across calls.

---

## Mistake 2 — Port collision never resolved

**Problem:** Port 3000 was occupied by "Zentrale" (different app). Playwright's `reuseExistingServer: true` silently reused it. All test navigations hit Zentrale, returned 404.  
**Fix applied:** Moved to port 3001 with `next dev -p 3001`. But this was never verified to actually work before writing the tests.

---

## Mistake 3 — Auth fixture designed without verifying the callback flow

**Problem:** `fixtures/auth.ts` navigated to `/en/auth/callback?token_hash=...` and waited for `waitForURL(/\/dashboard/)`. But `NEXT_PUBLIC_APP_URL=http://192.168.178.180:3000` caused the server-side callback to redirect to the LAN IP, not localhost. Playwright followed the redirect to the wrong host. `waitForURL` timed out after 30s × N tests = hundreds of wasted seconds.  
**Not caught because:** The callback route was never manually tested before wiring it into the fixture.

---

## Mistake 4 — global-setup login was never confirmed to work

**Problem:** `global-setup.ts` is supposed to log in once and save `tests/e2e/.auth/*.json`. This was written but never actually run to verify it produces valid auth state. All auth-gated tests depended on files that may not exist.  
**Consequence:** Every `authPage` fixture silently fell back to an unauthenticated context, and all dashboard/API tests either hit the login redirect or produced garbage results.

---

## Mistake 5 — 125 tests run in parallel before any single test was verified

**Problem:** 25 tests × 5 browsers = 125 concurrent test runs. The correct approach is: verify 1 test in 1 browser before scaling. Running all 5 browser projects simultaneously flooded the console and made it impossible to isolate failures.  
**Should have done:** `npx playwright test upgrade-modal --project=chromium` first.

---

## Mistake 6 — Dashboard duplicate key error was a symptom of the test load, not a real bug

**Problem:** The parallel auth attempts all hit `/dashboard` simultaneously, the `withCache` returned empty for all, and all 12 workers tried to INSERT the same user. This caused `duplicate key violates unique constraint`.  
**The fix (upsert) was correct** — but it was a self-inflicted problem caused by running tests without a working auth setup.

---

## Mistake 7 — Spent tokens writing tests before manually verifying selectors

**Problem:** Tests used selectors like `page.getByLabel(/Round Prompts/)`, `page.locator('.rounded-xl').filter({ hasText: 'Free Plan' })`, etc. — none verified against a live browser snapshot. The actual DOM refs from the snapshot (e.g. `ref=e140` for Upgrade button) don't match text-based selectors until confirmed.

---

## What a correct approach looks like

1. Start dev server, confirm it responds: `curl http://localhost:3001/en`
2. Use `mcp__playwright__browser_navigate` + `mcp__playwright__browser_snapshot` to inspect real DOM
3. Confirm selectors exist before writing a single `expect()`
4. Run **one** test on **one** browser: `npx playwright test upgrade-modal --project=chromium --headed`
5. Fix that test until it passes
6. Add auth: run `global-setup.ts` manually, confirm `.auth/free-user.json` exists and contains valid cookies
7. Run one auth test: `npx playwright test dashboard-create-game --project=chromium --workers=1 --headed`
8. Only then scale to all browsers

## Token cost

~10k tokens spent. 0 tests passed. Root causes: wrong tool choice, unverified assumptions about auth flow and port configuration, premature scale-up.
