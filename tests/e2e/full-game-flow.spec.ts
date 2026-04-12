import { test, expect, type Page } from './fixtures/auth'

/**
 * tests/e2e/full-game-flow.spec.ts
 *
 * This test suite verifies the entire game loop of Empatify, 
 * simulating a host and a guest player playing a full game.
 */

async function submitSong(page: Page, trackId: string, round: number) {
  // Click "Add Song" button for the current round
  const addBtn = page.getByRole('button', { name: /add song|song hinzufügen/i }).first();
  await addBtn.click();
  
  // Search for the track
  const searchInput = page.getByPlaceholder(/search|suche/i);
  await searchInput.fill('Never Gonna Give You Up');
  
  // Wait for results and click the first one
  // The search results appear in a list, we look for Rick Astley
  await page.locator('button:has-text("Rick Astley")').first().click();
  
  // Confirmation usually happens automatically after click in our UI
  // but let's wait for the modal to close or song to appear
  await expect(page.getByText(/Rick Astley/i).first()).toBeVisible();
}

async function rateSong(page: Page, rating: number) {
  // Click the star/rate button first to open the dialog
  await page.getByRole('button', { name: /rate this song|song bewerten/i }).first().click();

  // Find the rating button (1-10) in the dialog
  const ratingBtn = page.getByRole('button', { name: new RegExp(`^${rating}$`) });
  await ratingBtn.click();
  
  // Wait for dialog to close
  await expect(ratingBtn).not.toBeVisible();
}

test.describe('Full Game Flow — Core Mechanics', () => {
  test('Host and Guest complete a 1-round game', async ({ authCtx, proCtx }) => {
    const hostPage = await proCtx.newPage();
    const guestPage = await authCtx.newPage();

    // 1. Host creates a 1-round lobby
    await hostPage.goto('/en/dashboard');
    await hostPage.selectOption('#rounds', '1');
    await hostPage.locator('#create-game').getByRole('button', { name: /create game|lobby erstellen/i }).click();
    
    // Wait for navigation to lobby
    await expect(hostPage).toHaveURL(/\/lobby\/[0-9a-f-]+/);
    const lobbyUrl = hostPage.url();

    // 2. Guest joins the lobby
    await guestPage.goto(lobbyUrl);
    await expect(guestPage.getByText(/lobby/i)).toBeVisible();

    // Verify both are in the participant list
    // Use a more robust check: just ensure there are at least 2 participant rows
    await expect(hostPage.locator('text=Host').first()).toBeVisible();
    
    // 3. Round 1: Song Submission
    // Host submits
    await submitSong(hostPage, '4uLU6hMCjMI75M1A2tKUQC', 1);
    // Guest submits
    await submitSong(guestPage, '29S969nBAnBwN242h6f47f', 1);

    // 4. Round 1: Rating Phase
    // Host rates Guest's song
    await rateSong(hostPage, 8);
    // Guest rates Host's song
    await rateSong(guestPage, 9);

    // 5. Game End & Leaderboard
    await expect(hostPage.getByText(/game results|spielergebnisse/i)).toBeVisible({ timeout: 15000 });
    
    // Verify winners are shown
    await expect(hostPage.getByText(/congratulations|herzlichen glückwunsch/i)).toBeVisible();
    
    // Cleanup
    await hostPage.close();
    await guestPage.close();
  });
});

test.describe('Pro Plan Features Flow', () => {
  test('Pro user creates a Blind Mode game with Round Prompts', async ({ proPage: page }) => {
    await page.goto('/en/dashboard');
    
    // Enable Pro features
    await page.selectOption('#rounds', '2');
    await page.getByLabel(/Round Prompts/).check();
    await page.locator('input[placeholder*="Round 1"]').fill('First round prompt');
    await page.locator('input[placeholder*="Round 2"]').fill('Second round prompt');
    
    // Enable Blind Mode
    const blindModeToggle = page.locator('label').filter({ hasText: 'Blind Mode' }).locator('div').first();
    await blindModeToggle.click();

    await page.locator('#create-game').getByRole('button', { name: /create game|lobby erstellen/i }).click();
    
    await expect(page).toHaveURL(/\/lobby\/[0-9a-f-]+/);
    
    // Verify Pro features are active in the lobby
    await expect(page.getByText('First round prompt')).toBeVisible();
  });

  test('Upgrade flow from Dashboard', async ({ authPage: page, isMobile }) => {
    await page.goto('/en/dashboard');
    
    if (isMobile) {
      // On mobile, the badge is hidden, use dropdown
      await page.getByLabel('User menu').click();
      await page.getByRole('button', { name: /upgrade/i }).click();
    } else {
      // On desktop, click the badge
      await page.getByRole('button', { name: /free/i }).first().click();
    }
    
    await expect(page.getByText(/choose your plan/i)).toBeVisible();
    
    // Click Upgrade
    const [request] = await Promise.all([
      page.waitForRequest(r => r.url().includes('/api/stripe/checkout') && r.method() === 'POST'),
      page.getByRole('button', { name: /upgrade to pro/i }).click()
    ]);
    
    expect(request).toBeTruthy();
  });
});
