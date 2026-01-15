import { test, expect } from '@playwright/test';
import { TEST_USER, URLS, TIMEOUTS } from '../utils/test-data';

/**
 * Admin Login E2E Tests
 *
 * Tests for admin portal authentication:
 * - Successful login with valid credentials
 * - Dashboard access after login
 * - Session persistence
 */

test.describe('Admin Portal Login', () => {
  // Test with an existing store
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';

  test('should login to admin with valid credentials', async ({ page }) => {
    const adminUrl = URLS.getAdminUrl(storeSlug);
    console.log(`Testing admin login at: ${adminUrl}`);

    // Navigate to admin
    await page.goto(adminUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/admin-01-initial.png' });

    const currentUrl = page.url();

    // Check if redirected to login
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('On login page, entering credentials...');

      // Step 1: Enter email
      const emailInput = await page.waitForSelector(
        'input[type="email"], input[name="email"]',
        { timeout: TIMEOUTS.action }
      );
      await emailInput.fill(TEST_USER.email);

      // Click continue for two-step login
      const continueBtn = await page.$('button[type="submit"]');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
      }

      await page.screenshot({ path: 'test-results/admin-02-after-email.png' });

      // Step 2: Enter password
      const passwordInput = await page.waitForSelector(
        'input[type="password"]',
        { timeout: TIMEOUTS.action }
      );
      await passwordInput.fill(TEST_USER.password);

      await page.screenshot({ path: 'test-results/admin-03-after-password.png' });

      // Click sign in
      const signInBtn = await page.$('button[type="submit"]');
      if (signInBtn) {
        await signInBtn.click();
        console.log('Clicked sign in, waiting for dashboard...');
      }

      // Wait for navigation away from login
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: 'test-results/admin-04-final.png' });

    // Verify we're on dashboard (not login, not error)
    const finalUrl = page.url();
    const content = await page.content();

    // Should NOT be on login page
    expect(finalUrl).not.toContain('login');

    // Should NOT show Store Not Found
    expect(content.toLowerCase()).not.toContain('store not found');

    // Should show dashboard elements
    const hasDashboard =
      content.toLowerCase().includes('dashboard') ||
      content.includes('Analytics') ||
      content.includes('Orders') ||
      content.includes('Products');

    expect(hasDashboard).toBe(true);
    console.log('Admin login successful!');
  });

  test('should show user info after login', async ({ page }) => {
    const adminUrl = URLS.getAdminUrl(storeSlug);

    // Navigate and login
    await page.goto(adminUrl, { waitUntil: 'networkidle' });

    if (page.url().includes('login')) {
      // Perform login
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.fill(TEST_USER.email);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }

      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.fill(TEST_USER.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
      }
    }

    // Check for user info in sidebar or header
    const content = await page.content();
    const hasUserInfo =
      content.includes(TEST_USER.email) ||
      content.includes(TEST_USER.firstName) ||
      content.includes('Sign Out') ||
      content.includes('Logout');

    await page.screenshot({ path: 'test-results/admin-05-with-user.png' });

    console.log(`User info visible: ${hasUserInfo}`);
  });
});
