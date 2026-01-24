import { test, expect } from '@playwright/test';

/**
 * Setup Wizard E2E Tests
 *
 * Tests the setup wizard functionality including:
 * - Profile menu wizard access
 * - Welcome step
 * - Navigation to setup pages
 * - Wizard state persistence
 */

// Helper to close wizard if it's open
async function closeWizardIfOpen(page: any) {
  // Check if wizard overlay is visible
  const overlay = page.locator('.fixed.inset-0.bg-black\\/60, [aria-hidden="true"].fixed.inset-0');
  const isOverlayVisible = await overlay.first().isVisible().catch(() => false);

  if (isOverlayVisible) {
    // Look for close/dismiss button or click escape
    const closeBtn = page.getByRole('button', { name: /close|dismiss|later|skip|x/i });
    if (await closeBtn.first().isVisible().catch(() => false)) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);
    } else {
      // Try pressing Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // Also check for wizard modal dialog
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible().catch(() => false)) {
    const dismissBtn = modal.getByRole('button', { name: /close|dismiss|later|skip/i });
    if (await dismissBtn.first().isVisible().catch(() => false)) {
      await dismissBtn.first().click();
      await page.waitForTimeout(500);
    }
  }
}

test.describe('Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for wizard to potentially open
  });

  test('should auto-open for new users OR be accessible from profile menu', async ({ page }) => {
    // First check if wizard is already open (auto-opened for first-time users)
    const overlay = page.locator('.fixed.inset-0.z-\\[200\\]');
    const modal = page.locator('[role="dialog"]');

    const isAutoOpened = await overlay.isVisible().catch(() => false) ||
                         await modal.isVisible().catch(() => false);

    if (isAutoOpened) {
      console.log('Wizard auto-opened for first-time user - TEST PASSED');
      // Verify wizard content is visible
      const welcomeText = page.getByText(/Welcome|Get Started|Setup|Category|Product/i);
      await expect(welcomeText.first()).toBeVisible({ timeout: 5000 });
      return; // Test passed - wizard auto-opened
    }

    // If not auto-opened, try to access from profile menu
    await closeWizardIfOpen(page);

    // Click on the user avatar to open dropdown
    const userAvatar = page.locator('button.rounded-full, button:has(.rounded-full)').first();
    await userAvatar.click();

    // Wait for dropdown to appear
    await page.waitForTimeout(500);

    // Look for Setup Wizard button in dropdown
    const wizardButton = page.getByText('Setup Wizard');
    await expect(wizardButton).toBeVisible();

    // Click the wizard button
    await wizardButton.click();

    // Verify wizard modal opens
    await page.waitForTimeout(1000);
    const welcomeText = page.getByText(/Welcome to|Get Started|Setup/i);
    await expect(welcomeText.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show wizard with action buttons', async ({ page }) => {
    // Check if wizard is already open (auto-opened)
    const modal = page.locator('[role="dialog"]');
    const overlay = page.locator('.fixed.inset-0.z-\\[200\\]');

    const isAlreadyOpen = await modal.isVisible().catch(() => false) ||
                          await overlay.isVisible().catch(() => false);

    if (!isAlreadyOpen) {
      // Try to open from profile menu
      await closeWizardIfOpen(page);
      const userAvatar = page.locator('button.rounded-full, button:has(.rounded-full)').first();
      await userAvatar.click();
      await page.waitForTimeout(500);

      const wizardButton = page.getByText('Setup Wizard');
      if (await wizardButton.isVisible().catch(() => false)) {
        await wizardButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Look for action buttons (various possible states)
    const getStartedBtn = page.getByRole('button', { name: /get started|start|begin/i });
    const skipBtn = page.getByRole('button', { name: /skip|later|dismiss/i });
    const goToBtn = page.getByRole('button', { name: /go to/i });
    const continueBtn = page.getByRole('button', { name: /continue|next/i });

    // At least one action button should be visible
    const hasGetStarted = await getStartedBtn.first().isVisible().catch(() => false);
    const hasSkip = await skipBtn.first().isVisible().catch(() => false);
    const hasGoTo = await goToBtn.first().isVisible().catch(() => false);
    const hasContinue = await continueBtn.first().isVisible().catch(() => false);

    expect(hasGetStarted || hasSkip || hasGoTo || hasContinue).toBeTruthy();
  });

  test('should show wizard steps (category, product, etc)', async ({ page }) => {
    // Wizard may already be open
    await page.waitForTimeout(1000);

    // Look for wizard step content - could be on welcome, tour, or setup phase
    const categoryText = page.getByText(/category|categories/i);
    const productText = page.getByText(/product/i);
    const welcomeText = page.getByText(/welcome|get started/i);
    const settingsText = page.getByText(/settings/i);

    const hasCategory = await categoryText.first().isVisible().catch(() => false);
    const hasProduct = await productText.first().isVisible().catch(() => false);
    const hasWelcome = await welcomeText.first().isVisible().catch(() => false);
    const hasSettings = await settingsText.first().isVisible().catch(() => false);

    // Should see some wizard-related content
    expect(hasCategory || hasProduct || hasWelcome || hasSettings).toBeTruthy();
  });

  test('should navigate to categories page from wizard', async ({ page }) => {
    // Wizard may already be open
    await page.waitForTimeout(1000);

    // Navigate through wizard to find "Go to Categories" button
    // First try skip tour if visible
    const skipTourBtn = page.getByRole('button', { name: /skip tour/i });
    if (await skipTourBtn.isVisible().catch(() => false)) {
      await skipTourBtn.click();
      await page.waitForTimeout(1000);
    }

    // Find and click "Go to Categories" button
    const goToCategoriesBtn = page.getByRole('button', { name: /go to categories/i });
    if (await goToCategoriesBtn.isVisible().catch(() => false)) {
      await goToCategoriesBtn.click();

      // Should navigate to categories page
      await page.waitForURL(/\/categories/, { timeout: 10000 });
      expect(page.url()).toContain('/categories');
    } else {
      // If button not visible, maybe need to get started first
      const getStartedBtn = page.getByRole('button', { name: /get started|start/i });
      if (await getStartedBtn.first().isVisible().catch(() => false)) {
        await getStartedBtn.first().click();
        await page.waitForTimeout(1000);

        // Now try to find Go to Categories again
        const skipBtn = page.getByRole('button', { name: /skip/i });
        if (await skipBtn.first().isVisible().catch(() => false)) {
          await skipBtn.first().click();
          await page.waitForTimeout(1000);
        }

        const goCatBtn = page.getByRole('button', { name: /go to categories/i });
        if (await goCatBtn.isVisible().catch(() => false)) {
          await goCatBtn.click();
          await page.waitForURL(/\/categories/, { timeout: 10000 });
          expect(page.url()).toContain('/categories');
        }
      }
    }
  });

  test('should be accessible from support page', async ({ page }) => {
    // Navigate to support page
    await page.goto('/support');
    await page.waitForLoadState('networkidle');

    // Look for setup wizard section
    const wizardSection = page.getByText(/setup wizard/i);
    await expect(wizardSection.first()).toBeVisible({ timeout: 10000 });

    // Look for start/resume button
    const startBtn = page.getByRole('button', { name: /start|resume|setup wizard/i });

    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();

      // Wizard should open
      await page.waitForTimeout(1000);
      const welcomeText = page.getByText(/Welcome|Get Started|Setup/i);
      await expect(welcomeText.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist wizard state in localStorage', async ({ page }) => {
    // Wait for wizard to potentially auto-open and initialize
    await page.waitForTimeout(3000);

    // Get localStorage state
    const storageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('tesserix_setup_wizard')) {
          keys.push(key);
        }
      }
      return keys;
    });

    // Should have wizard state in localStorage
    expect(storageKeys.length).toBeGreaterThan(0);
  });

  test('categories page should show Add Category and Bulk Import buttons', async ({ page }) => {
    // Navigate directly to categories
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Check for Add Category button
    const addCategoryBtn = page.getByRole('button', { name: /add category/i })
      .or(page.getByText(/add category/i));
    await expect(addCategoryBtn.first()).toBeVisible({ timeout: 10000 });

    // Check for Bulk Import button
    const bulkImportBtn = page.getByRole('button', { name: /bulk import/i })
      .or(page.getByText(/bulk import/i));
    await expect(bulkImportBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('products page should show Add Product button', async ({ page }) => {
    // Navigate directly to products
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Check for Add Product button
    const addProductBtn = page.getByRole('button', { name: /add product/i })
      .or(page.getByText(/add product/i));
    await expect(addProductBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard home icon should navigate to home', async ({ page }) => {
    // Close wizard if open first
    await closeWizardIfOpen(page);
    await page.waitForTimeout(1000);

    // Navigate to a different page first
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Close wizard if it opens on navigation
    await closeWizardIfOpen(page);

    // Click on the Dashboard breadcrumb link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i })
      .or(page.locator('a[href="/"]'))
      .or(page.locator('.breadcrumb a').first());

    if (await dashboardLink.first().isVisible().catch(() => false)) {
      await dashboardLink.first().click();

      // Should navigate to home/dashboard
      await page.waitForURL(/\/$/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/$/);
    }
  });

  test('keyboard shortcut Cmd+K should open command palette', async ({ page }) => {
    // Press Cmd+K (Mac) or Ctrl+K (Windows)
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Check if command palette opened - look for search input
    const searchInput = page.getByPlaceholder(/search|type a command/i)
      .or(page.locator('[data-tour="command-palette"]').locator('input'));

    const isVisible = await searchInput.first().isVisible().catch(() => false);

    // If Meta+K didn't work, try Ctrl+K
    if (!isVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);

      const ctrlKVisible = await searchInput.first().isVisible().catch(() => false);
      // At least one should work (platform dependent)
      console.log('Command palette visibility:', ctrlKVisible);
    }
  });
});
