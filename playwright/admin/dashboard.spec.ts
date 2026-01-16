import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS } from '../utils/test-data';

/**
 * Admin Dashboard E2E Tests
 *
 * Tests for admin dashboard functionality:
 * - Dashboard widgets and metrics
 * - Quick actions
 * - Recent activity
 */

// Reuse login helper from login.spec.ts
async function waitForAuthCheck(page: Page, timeoutMs: number = 30000): Promise<'login' | 'dashboard' | 'unknown'> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
      const content = await page.content();
      const contentLower = content.toLowerCase();
      const url = page.url();

      if (contentLower.includes('checking authentication')) {
        await page.waitForTimeout(1000);
        continue;
      }

      if (contentLower.includes('welcome back') || contentLower.includes('tesseract hub') ||
          url.includes('devtest-customer-idp') || url.includes('keycloak')) {
        return 'login';
      }

      if (contentLower.includes('dashboard') || contentLower.includes('demo store') ||
          contentLower.includes('analytics')) {
        return 'dashboard';
      }

      if (contentLower.includes('loading tenant')) {
        await page.waitForTimeout(1000);
        continue;
      }
    } catch (e) {}
    await page.waitForTimeout(500);
  }
  return 'unknown';
}

async function performLogin(page: Page, email: string, password: string): Promise<boolean> {
  const authState = await waitForAuthCheck(page);

  if (authState === 'dashboard') return true;

  if (authState === 'login') {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(email);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(password);
    await page.locator('button[type="submit"]').first().click();

    // Wait for dashboard
    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
      const content = await page.content();
      if (content.toLowerCase().includes('dashboard') || content.toLowerCase().includes('demo store')) {
        return true;
      }
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

test.describe('Admin Dashboard', () => {
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    await page.goto(adminUrl);
    const success = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Navigate to dashboard if not already there
    const dashboardLink = page.locator('a:has-text("Dashboard"), [href="/"]').first();
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: 'test-results/dashboard-01-overview.png', fullPage: true });

    const content = await page.content();
    const contentLower = content.toLowerCase();

    // Dashboard should show key metrics (at least some of these)
    const hasMetrics =
      contentLower.includes('orders') ||
      contentLower.includes('revenue') ||
      contentLower.includes('customers') ||
      contentLower.includes('products') ||
      contentLower.includes('sales');

    expect(hasMetrics).toBe(true);
    console.log('Dashboard metrics visible');
  });

  test('should display store information in sidebar', async ({ page }) => {
    const content = await page.content();

    // Should show store name in sidebar
    const hasStoreName = content.includes('Demo Store') || content.toLowerCase().includes('demo-store');
    expect(hasStoreName).toBe(true);

    await page.screenshot({ path: 'test-results/dashboard-02-sidebar.png', fullPage: true });
    console.log('Store information visible in sidebar');
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check for main navigation items
    const navItems = [
      'Dashboard',
      'Catalog',
      'Orders',
      'Customers',
      'Marketing',
      'Settings'
    ];

    const content = await page.content();
    let foundItems = 0;

    for (const item of navItems) {
      if (content.includes(item)) {
        foundItems++;
        console.log(`Found nav item: ${item}`);
      }
    }

    // Should have at least 4 navigation items
    expect(foundItems).toBeGreaterThanOrEqual(4);
    await page.screenshot({ path: 'test-results/dashboard-03-navigation.png', fullPage: true });
  });

  test('should display user profile section', async ({ page }) => {
    const content = await page.content();

    // Should show user info or profile section
    const hasUserSection =
      content.includes(TEST_USER.firstName) ||
      content.includes('Samyak') ||
      content.toLowerCase().includes('profile') ||
      content.toLowerCase().includes('account') ||
      content.toLowerCase().includes('sign out');

    expect(hasUserSection).toBe(true);
    await page.screenshot({ path: 'test-results/dashboard-04-user-profile.png', fullPage: true });
    console.log('User profile section visible');
  });
});
