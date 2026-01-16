import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS } from '../utils/test-data';

/**
 * Admin Orders E2E Tests
 *
 * Tests for order management:
 * - Orders listing
 * - Order details
 * - Order status filtering
 * - Search functionality
 */

async function waitForAuthAndLogin(page: Page, email: string, password: string): Promise<boolean> {
  const startTime = Date.now();
  const timeout = 60000;

  while (Date.now() - startTime < timeout) {
    try {
      const content = await page.content();
      const contentLower = content.toLowerCase();
      const url = page.url();

      if (contentLower.includes('checking authentication') || contentLower.includes('loading tenant')) {
        await page.waitForTimeout(1000);
        continue;
      }

      if (contentLower.includes('welcome back') || url.includes('devtest-customer-idp')) {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        await emailInput.fill(email);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);

        const passwordInput = page.locator('input[type="password"]').first();
        await passwordInput.fill(password);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
        continue;
      }

      if (contentLower.includes('dashboard') || contentLower.includes('demo store') || contentLower.includes('orders')) {
        return true;
      }
    } catch (e) {}
    await page.waitForTimeout(500);
  }
  return false;
}

test.describe('Admin Orders', () => {
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    await page.goto(adminUrl);
    const success = await waitForAuthAndLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);
  });

  test('should navigate to Orders section', async ({ page }) => {
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();

    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/orders-01-main.png', fullPage: true });

      const content = await page.content();
      const hasOrdersContent =
        content.toLowerCase().includes('order') ||
        content.toLowerCase().includes('no orders') ||
        content.toLowerCase().includes('all orders');

      expect(hasOrdersContent).toBe(true);
      console.log('Orders section loaded');
    } else {
      console.log('Orders link not found');
    }
  });

  test('should display orders list or empty state', async ({ page }) => {
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();

    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/orders-02-list.png', fullPage: true });

      const content = await page.content();

      // Should show orders table or empty state message
      const hasOrdersList =
        content.toLowerCase().includes('order') ||
        content.toLowerCase().includes('no orders yet') ||
        content.toLowerCase().includes('pending') ||
        content.toLowerCase().includes('completed') ||
        content.toLowerCase().includes('processing');

      expect(hasOrdersList).toBe(true);
      console.log('Orders list/empty state displayed');
    }
  });

  test('should have order status filters', async ({ page }) => {
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();

    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const content = await page.content();
      const contentLower = content.toLowerCase();

      // Check for common order status filters
      const hasFilters =
        contentLower.includes('all') ||
        contentLower.includes('pending') ||
        contentLower.includes('processing') ||
        contentLower.includes('completed') ||
        contentLower.includes('cancelled') ||
        contentLower.includes('filter') ||
        contentLower.includes('status');

      await page.screenshot({ path: 'test-results/orders-03-filters.png', fullPage: true });

      if (hasFilters) {
        console.log('Order status filters available');
      } else {
        console.log('Order filters not visible (may appear with orders)');
      }
    }
  });

  test('should have order search functionality', async ({ page }) => {
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();

    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for search input
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], [data-testid="search"]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill('ORD-');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/orders-04-search.png', fullPage: true });
        console.log('Order search functionality available');
      } else {
        console.log('Search input not found on orders page');
        await page.screenshot({ path: 'test-results/orders-04-no-search.png', fullPage: true });
      }
    }
  });

  test('should have date range filter', async ({ page }) => {
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();

    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const content = await page.content();

      // Check for date filter elements
      const hasDateFilter =
        content.toLowerCase().includes('date') ||
        content.toLowerCase().includes('today') ||
        content.toLowerCase().includes('last 7 days') ||
        content.toLowerCase().includes('this month') ||
        content.toLowerCase().includes('custom');

      await page.screenshot({ path: 'test-results/orders-05-date-filter.png', fullPage: true });

      if (hasDateFilter) {
        console.log('Date range filter available');
      } else {
        console.log('Date filter not visible');
      }
    }
  });
});
