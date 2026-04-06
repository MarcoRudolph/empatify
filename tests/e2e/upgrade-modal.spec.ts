/**
 * upgrade-modal.spec.ts
 *
 * Tests the Upgrade modal accessible from the footer on the landing page.
 * No auth required — these run as a guest user.
 *
 * What is verified:
 *   - Modal opens when clicking "Upgrade" in the footer
 *   - Free Plan card shows the correct trial copy and feature list
 *   - Pro Plan card shows all Pro-exclusive features (Round Prompts, Blind Mode, etc.)
 *   - Modal closes via the X button
 */

import { test, expect } from '@playwright/test'

test.describe('Upgrade modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en')
    // Scroll to footer so the Upgrade button is in view
    await page.getByRole('button', { name: 'Upgrade' }).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Upgrade' }).click()
    // Modal should be visible
    await expect(page.getByText('Choose your plan')).toBeVisible()
  })

  test('modal opens and shows both plan cards', async ({ page }) => {
    await expect(page.getByText('Free Plan')).toBeVisible()
    await expect(page.getByText('Pro Plan')).toBeVisible()
  })

  test('Free Plan shows 4-week trial pricing, not "forever"', async ({ page }) => {
    await expect(page.getByText('4-week trial')).toBeVisible()
    await expect(page.getByText('forever')).not.toBeVisible()
  })

  test('Free Plan lists correct feature set', async ({ page }) => {
    const freePlanCard = page.locator('.rounded-xl').filter({ hasText: 'Free Plan' })

    await expect(freePlanCard.getByText('Up to 3 players per lobby')).toBeVisible()
    await expect(freePlanCard.getByText(/Category games.*4-week free trial/)).toBeVisible()
    await expect(freePlanCard.getByText('Friends & in-game messaging')).toBeVisible()
    await expect(freePlanCard.getByText('Last 3 games history')).toBeVisible()
    await expect(freePlanCard.getByText(/Playlist export.*Top 3/)).toBeVisible()
    await expect(freePlanCard.getByText(/Mood Card.*blurred/)).toBeVisible()
  })

  test('Free Plan does NOT list Round Prompts or Blind Mode', async ({ page }) => {
    const freePlanCard = page.locator('.rounded-xl').filter({ hasText: 'Free Plan' })

    await expect(freePlanCard.getByText('Round Prompts')).not.toBeVisible()
    await expect(freePlanCard.getByText('Blind Mode')).not.toBeVisible()
  })

  test('Pro Plan shows correct pricing', async ({ page }) => {
    await expect(page.getByText('€4.99')).toBeVisible()
    await expect(page.getByText('/ month')).toBeVisible()
  })

  test('Pro Plan lists all Pro-exclusive features', async ({ page }) => {
    const proCard = page.locator('.rounded-xl').filter({ hasText: 'Pro Plan' })

    await expect(proCard.getByText('Unlimited players per lobby')).toBeVisible()
    await expect(proCard.getByText(/All music categories.*always on/)).toBeVisible()
    await expect(proCard.getByText(/Round Prompts/)).toBeVisible()
    await expect(proCard.getByText(/Blind Mode/)).toBeVisible()
    await expect(proCard.getByText(/Full game history/)).toBeVisible()
    await expect(proCard.getByText(/Full playlist export/)).toBeVisible()
    await expect(proCard.getByText(/Mood Card.*full.*shareable/i)).toBeVisible()
  })

  test('Pro Plan has an Upgrade to Pro button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Upgrade to Pro/i })).toBeVisible()
  })

  test('modal closes via the X button', async ({ page }) => {
    await page.getByLabel('Close').click()
    await expect(page.getByText('Choose your plan')).not.toBeVisible()
  })

  test('modal closes when clicking the backdrop', async ({ page }) => {
    // Click outside the panel (top-left corner of backdrop)
    await page.mouse.click(10, 10)
    await expect(page.getByText('Choose your plan')).not.toBeVisible()
  })
})
