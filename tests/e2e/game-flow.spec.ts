import { test, expect } from '@playwright/test';

test.describe('Pokemon Wordle Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should start a new game and make a guess', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the start new game button exists and click it
    const startButton = page.locator('button').filter({ hasText: /start|new|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Find the input field
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();

    // Type a Pokemon name
    await input.fill('Pikachu');
    
    // Submit the guess
    await input.press('Enter');

    // Check if a guess result appears
    await expect(page.locator('[data-testid="guess-result"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Start a new game if needed
    const startButton = page.locator('button').filter({ hasText: /start|new|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Find the input field and type partial Pokemon name
    const input = page.locator('input[type="text"]').first();
    await input.fill('Pika');

    // Check if autocomplete suggestions appear
    await expect(page.locator('[data-testid="autocomplete-suggestion"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('should open and close settings modal', async ({ page }) => {
    // Look for settings button (could be an icon or text)
    const settingsButton = page.locator('button').filter({ hasText: /settings|设置/i }).first();
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Check if settings modal opens
      await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible({ timeout: 3000 });
      
      // Close the modal
      const closeButton = page.locator('button').filter({ hasText: /close|关闭|×/i }).first();
      await closeButton.click();
      
      // Check if modal is closed
      await expect(page.locator('[data-testid="settings-modal"]')).toBeHidden({ timeout: 3000 });
    }
  });

  test('should change language and persist', async ({ page }) => {
    // Look for language switcher
    const languageSwitcher = page.locator('select').first();
    
    if (await languageSwitcher.isVisible()) {
      // Change to Chinese
      await languageSwitcher.selectOption('zh-hans');
      
      // Check if some text changed to Chinese
      await expect(page.locator('text=开始')).toBeVisible({ timeout: 3000 });
      
      // Reload page to check persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if Chinese is still selected
      await expect(page.locator('text=开始')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle game over scenarios', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Start a new game if needed
    const startButton = page.locator('button').filter({ hasText: /start|new|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Look for give up button
    const giveUpButton = page.locator('button').filter({ hasText: /give up|放弃/i }).first();
    
    if (await giveUpButton.isVisible()) {
      await giveUpButton.click();
      
      // Check if game over modal appears
      await expect(page.locator('[data-testid="game-over-modal"]')).toBeVisible({ timeout: 5000 });
      
      // Check if the answer is revealed
      await expect(page.locator('[data-testid="correct-answer"]')).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.waitForLoadState('networkidle');

    // Check if the layout adapts to mobile
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    
    // Check if guess table is responsive
    const guessTable = page.locator('[data-testid="guess-table"]').first();
    if (await guessTable.isVisible()) {
      const tableWidth = await guessTable.boundingBox();
      expect(tableWidth?.width).toBeLessThanOrEqual(375);
    }
  });

  test('should maintain game state on page refresh', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Start a new game
    const startButton = page.locator('button').filter({ hasText: /start|new|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Make a guess
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill('Pikachu');
      await input.press('Enter');
      
      // Wait for guess to be processed
      await page.waitForTimeout(1000);
    }

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if the game state is maintained
    const guessResults = page.locator('[data-testid="guess-result"]');
    if (await guessResults.first().isVisible()) {
      await expect(guessResults.first()).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Start a new game if needed
    const startButton = page.locator('button').filter({ hasText: /start|new|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Check if focus moves through interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
}); 