/**
 * dashboard-create-game.spec.ts
 *
 * Tests the "Create Game" card on the dashboard — specifically the Pro Plan
 * features: Round Prompts, Blind Mode, configurable rounds, and category selection.
 *
 * Requires:
 *   TEST_USER_EMAIL       — a valid Empatify account (free plan)
 *   TEST_PRO_USER_EMAIL   — a valid Empatify account (Pro plan)
 *   SUPABASE_SERVICE_KEY  — admin key to generate magic-link tokens
 */

import { test, expect } from './fixtures/auth'

test.describe('Dashboard — Create Game card (free user)', () => {
  test.beforeEach(async ({ authPage: page }) => {
    await page.goto('/en/dashboard')
    // Wait for the Create Game card to be rendered
    await expect(page.getByRole('heading', { name: /create game/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Round Prompts checkbox is present', async ({ authPage: page }) => {
    await expect(page.getByLabel(/Round Prompts/)).toBeVisible()
  })

  test('toggling Round Prompts shows prompt input fields', async ({ authPage: page }) => {
    const checkbox = page.getByLabel(/Round Prompts/)
    await checkbox.check()

    // Default rounds = 5, so 5 inputs should appear
    const inputs = page.locator('input[placeholder*="Round"]')
    await expect(inputs).toHaveCount(5)
  })

  test('prompt input count matches selected round count', async ({ authPage: page }) => {
    // Change rounds to 3
    await page.selectOption('#rounds', '3')

    const checkbox = page.getByLabel(/Round Prompts/)
    await checkbox.check()

    await expect(page.locator('input[placeholder*="Round"]')).toHaveCount(3)
  })

  test('Round Prompts inputs update when rounds count changes while open', async ({ authPage: page }) => {
    await page.getByLabel(/Round Prompts/).check()

    // Change rounds from 5 to 2 while prompts are shown
    await page.selectOption('#rounds', '2')
    await expect(page.locator('input[placeholder*="Round"]')).toHaveCount(2)
  })

  test('Blind Mode toggle is present', async ({ authPage: page }) => {
    await expect(page.getByText('Blind Mode')).toBeVisible()
  })

  test('Blind Mode toggle changes visual state on click', async ({ authPage: page }) => {
    // Find the toggle container (the div that acts as the toggle)
    const toggle = page.locator('label').filter({ hasText: 'Blind Mode' }).locator('div').first()

    // Initial state: bg-neutral-300 (off)
    await expect(toggle).toHaveClass(/bg-neutral-300/)

    await toggle.click()

    // After click: border-neutral-200 style (on — transparent background with border)
    await expect(toggle).toHaveClass(/border-neutral-200/)
  })

  test('Rounds dropdown has options 1 through 10', async ({ authPage: page }) => {
    const options = await page.locator('#rounds option').allTextContents()
    expect(options.map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  test('Category dropdown includes standard categories', async ({ authPage: page }) => {
    const options = await page.locator('#category option').allTextContents()
    const values = options.map((o) => o.toLowerCase())

    // These must all be present
    for (const expected of ['all', '80s', '90s', 'techno', 'hip-hop', 'rock', 'pop']) {
      expect(values.some((v) => v.includes(expected))).toBe(true)
    }
  })

  test('Game Mode toggle switches between single-device and multi-device', async ({ authPage: page }) => {
    const singleBtn = page.getByRole('button', { name: /single.?device/i })
    const multiBtn  = page.getByRole('button', { name: /multi.?device/i })

    // Default is multi-device (has primary-500 bg)
    await expect(multiBtn).toHaveClass(/bg-primary-500/)

    await singleBtn.click()
    await expect(singleBtn).toHaveClass(/bg-primary-500/)
    await expect(multiBtn).not.toHaveClass(/bg-primary-500/)
  })
})

test.describe('Dashboard — Create Game card (Pro user)', () => {
  test.beforeEach(async ({ proPage: page }) => {
    await page.goto('/en/dashboard')
    await expect(page.getByRole('heading', { name: /create game/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Pro user sees identical UI controls for Round Prompts and Blind Mode', async ({ proPage: page }) => {
    await expect(page.getByLabel(/Round Prompts/)).toBeVisible()
    await expect(page.getByText('Blind Mode')).toBeVisible()
  })
})
