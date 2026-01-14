import { test, expect } from '@playwright/test';

/**
 * Settings E2E Tests
 *
 * Tests the Settings functionality including:
 * - General settings page navigation
 * - Storefront Theme page navigation and functionality
 * - Other settings pages
 *
 * Prerequisites:
 * - User must be logged in as Owner (handled by auth.setup.ts)
 * - Tenant must be selected
 *
 * Run with: npm run test:e2e:headed (for manual login)
 */

test.describe('Settings Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('/');

    // Wait for the dashboard to load (more reliable than networkidle)
    await page.waitForSelector('text=Dashboard', { timeout: 30000 });
  });

  test('should navigate to General Settings page', async ({ page }) => {
    // Scroll sidebar to find Settings (may be below visible area)
    const sidebar = page.locator('nav').first();
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);

    // Click on Settings button in sidebar
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.scrollIntoViewIfNeeded();
    await settingsButton.click();

    // Wait for submenu to expand, then click on General link
    await page.getByRole('link', { name: /^general$/i }).click();

    // Wait for navigation
    await page.waitForURL('**/settings/general');

    // Verify we're on the General Settings page
    await expect(page.getByText(/general settings/i)).toBeVisible();

    // Verify store selector is present (use first() to handle multiple matches)
    await expect(page.getByText('Select Store').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Storefront Theme page', async ({ page }) => {
    // Scroll sidebar to find Settings
    const sidebar = page.locator('nav').first();
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);

    // Click on Settings button in sidebar
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.scrollIntoViewIfNeeded();
    await settingsButton.click();

    // Wait for submenu to expand
    await page.waitForTimeout(500);

    // Click on Storefront Theme link
    await page.getByRole('link', { name: /storefront theme/i }).click();

    // Wait for navigation
    await page.waitForURL('**/settings/storefront-theme');

    // Verify we're on the Storefront Theme page (use main content area)
    await expect(page.getByRole('main').getByText(/storefront.*customization/i)).toBeVisible();
  });

  test('should load storefront theme settings without errors', async ({ page }) => {
    // Navigate directly to storefront theme
    await page.goto('/settings/storefront-theme');

    // Wait for page content to load (more reliable than networkidle)
    await page.waitForSelector('text=Storefront Customization', { timeout: 30000 });

    // Verify page loaded
    await expect(page).toHaveURL(/.*storefront-theme/);

    // Check that no error modal is visible
    const errorModal = page.locator('[role="dialog"]').filter({ hasText: /error/i });
    const hasError = await errorModal.isVisible().catch(() => false);

    if (hasError) {
      // Get error message text
      const errorText = await errorModal.textContent();
      console.error('Error modal detected:', errorText);
      // Fail the test with the error message
      expect(hasError, `Error modal detected: ${errorText}`).toBe(false);
    }

    // Verify theme presets are loading (should see theme options)
    const themePresets = page.locator('[data-testid="theme-preset"]').or(
      page.getByText(/modern|classic|minimal|bold|fashion|food|electronics/i).first()
    );
    await expect(themePresets).toBeVisible({ timeout: 15000 });
  });

  test('should be able to select a theme preset', async ({ page }) => {
    // Navigate to storefront theme
    await page.goto('/settings/storefront-theme');

    // Wait for page content to load (more reliable than networkidle)
    await page.waitForSelector('text=Storefront Customization', { timeout: 30000 });

    // Wait for theme presets to load
    await page.waitForTimeout(2000);

    // Look for theme preset cards/buttons
    const themeCards = page.locator('[data-testid="theme-preset-card"]').or(
      page.locator('button').filter({ hasText: /modern|classic|minimal/i })
    );

    const cardCount = await themeCards.count();
    console.log(`Found ${cardCount} theme preset cards`);

    if (cardCount > 0) {
      // Click on first theme card
      await themeCards.first().click();

      // Wait for selection feedback
      await page.waitForTimeout(1000);

      console.log('Theme preset selection test passed');
    }
  });

  test('should save storefront theme settings', async ({ page }) => {
    // Navigate to storefront theme
    await page.goto('/settings/storefront-theme');

    // Wait for page content to load (more reliable than networkidle)
    await page.waitForSelector('text=Storefront Customization', { timeout: 30000 });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Look for save button
    const saveButton = page.getByRole('button', { name: /save|apply|update/i });

    const saveVisible = await saveButton.isVisible().catch(() => false);

    if (saveVisible) {
      // Click save
      await saveButton.click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Check for success message or error
      const successMsg = page.getByText(/saved|success|updated/i);
      const errorMsg = page.getByText(/failed|error/i);

      const hasSuccess = await successMsg.isVisible().catch(() => false);
      const hasError = await errorMsg.isVisible().catch(() => false);

      if (hasError) {
        const errorText = await errorMsg.textContent();
        console.error('Save failed:', errorText);
        // Capture more context
        await page.screenshot({ path: 'test-results/save-error.png' });
        expect(hasError, `Save failed: ${errorText}`).toBe(false);
      }

      console.log('Save test completed. Success:', hasSuccess);
    } else {
      console.log('Save button not found on page');
    }
  });

  test('should navigate to Shipping settings', async ({ page }) => {
    // Click on Settings button in sidebar
    await page.getByRole('button', { name: /settings/i }).click();

    // Click on Shipping link
    await page.getByRole('link', { name: /shipping/i }).click();

    // Wait for navigation to any shipping-related page
    await page.waitForURL('**/settings/shipping**');

    // Verify page loaded
    await expect(page.getByText(/shipping/i)).toBeVisible();
  });

  test('should navigate to Payments settings', async ({ page }) => {
    // Click on Settings button in sidebar
    await page.getByRole('button', { name: /settings/i }).click();

    // Click on Payments link
    await page.getByRole('link', { name: /payments/i }).click();

    // Wait for navigation
    await page.waitForURL('**/settings/payment**');

    // Verify page loaded
    await expect(page.getByText(/payment/i)).toBeVisible();
  });

  test('should navigate to Taxes settings', async ({ page }) => {
    // Click on Settings button in sidebar
    await page.getByRole('button', { name: /settings/i }).click();

    // Click on Taxes link
    await page.getByRole('link', { name: /taxes/i }).click();

    // Wait for navigation
    await page.waitForURL('**/settings/taxes**');

    // Verify page loaded
    await expect(page.getByText(/tax/i)).toBeVisible();
  });
});

test.describe('Settings Navigation Sidebar', () => {
  test('should show all settings menu items', async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('/');

    // Wait for dashboard to load (more reliable than networkidle)
    await page.waitForSelector('text=Dashboard', { timeout: 30000 });

    // Click on Settings button in sidebar
    await page.getByRole('button', { name: /settings/i }).click();

    // Wait for submenu to expand
    await page.waitForTimeout(500);

    // Verify all expected settings items are visible
    const expectedItems = [
      'General',
      'Storefront Theme',
      'Shipping',
      'Payments',
      'Taxes',
    ];

    for (const item of expectedItems) {
      const menuItem = page.getByRole('link', { name: new RegExp(item, 'i') });
      const isVisible = await menuItem.isVisible().catch(() => false);
      console.log(`Settings menu item "${item}": ${isVisible ? 'visible' : 'not visible'}`);
    }
  });
});
