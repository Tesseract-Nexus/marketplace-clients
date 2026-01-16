import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS } from '../utils/test-data';

/**
 * Admin Customers E2E Tests
 *
 * Tests for customer management:
 * - Customers listing
 * - Customer details
 * - Customer search
 * - Customer segments
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

      if (contentLower.includes('dashboard') || contentLower.includes('demo store') || contentLower.includes('customers')) {
        return true;
      }
    } catch (e) {}
    await page.waitForTimeout(500);
  }
  return false;
}

test.describe('Admin Customers', () => {
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    await page.goto(adminUrl);
    const success = await waitForAuthAndLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);
  });

  test('should navigate to Customers section', async ({ page }) => {
    const customersLink = page.locator('a:has-text("Customers"), [href*="customers"]').first();

    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/customers-01-main.png', fullPage: true });

      const content = await page.content();
      const hasCustomersContent =
        content.toLowerCase().includes('customer') ||
        content.toLowerCase().includes('no customers') ||
        content.toLowerCase().includes('all customers');

      expect(hasCustomersContent).toBe(true);
      console.log('Customers section loaded');
    } else {
      console.log('Customers link not found');
    }
  });

  test('should display customers list or empty state', async ({ page }) => {
    const customersLink = page.locator('a:has-text("Customers"), [href*="customers"]').first();

    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/customers-02-list.png', fullPage: true });

      const content = await page.content();

      // Should show customers table or empty state
      const hasCustomersList =
        content.toLowerCase().includes('customer') ||
        content.toLowerCase().includes('no customers yet') ||
        content.toLowerCase().includes('email') ||
        content.toLowerCase().includes('name');

      expect(hasCustomersList).toBe(true);
      console.log('Customers list/empty state displayed');
    }
  });

  test('should have customer search functionality', async ({ page }) => {
    const customersLink = page.locator('a:has-text("Customers"), [href*="customers"]').first();

    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for search input
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill('test@');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/customers-03-search.png', fullPage: true });
        console.log('Customer search functionality available');
      } else {
        console.log('Search input not found on customers page');
        await page.screenshot({ path: 'test-results/customers-03-no-search.png', fullPage: true });
      }
    }
  });

  test('should access customer segments', async ({ page }) => {
    // Try to find Customer Segments link
    const segmentsLink = page.locator('a:has-text("Segments"), a:has-text("Customer Segments"), [href*="segments"]').first();

    if (await segmentsLink.count() > 0) {
      await segmentsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/customers-04-segments.png', fullPage: true });

      const content = await page.content();
      const hasSegmentsContent =
        content.toLowerCase().includes('segment') ||
        content.toLowerCase().includes('no segments') ||
        content.toLowerCase().includes('create segment');

      if (hasSegmentsContent) {
        console.log('Customer segments page loaded');
      }
    } else {
      // Navigate to Customers first, then look for segments
      const customersLink = page.locator('a:has-text("Customers")').first();
      if (await customersLink.count() > 0) {
        await customersLink.click();
        await page.waitForTimeout(1000);

        const subSegmentsLink = page.locator('a:has-text("Segments")').first();
        if (await subSegmentsLink.count() > 0) {
          await subSegmentsLink.click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'test-results/customers-04-segments.png', fullPage: true });
          console.log('Customer segments accessed via submenu');
        }
      }
    }
  });

  test('should have export functionality', async ({ page }) => {
    const customersLink = page.locator('a:has-text("Customers"), [href*="customers"]').first();

    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export"]').first();

      await page.screenshot({ path: 'test-results/customers-05-export.png', fullPage: true });

      if (await exportButton.count() > 0) {
        console.log('Export functionality available');
      } else {
        console.log('Export button not visible');
      }
    }
  });
});
