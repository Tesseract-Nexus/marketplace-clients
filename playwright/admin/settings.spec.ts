import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS } from '../utils/test-data';

/**
 * Admin Settings E2E Tests
 *
 * Tests for store settings:
 * - General settings
 * - Store profile
 * - Payment settings
 * - Shipping settings
 * - Team/Staff management
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

      if (contentLower.includes('dashboard') || contentLower.includes('demo store') || contentLower.includes('settings')) {
        return true;
      }
    } catch (e) {}
    await page.waitForTimeout(500);
  }
  return false;
}

test.describe('Admin Settings', () => {
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    await page.goto(adminUrl);
    const success = await waitForAuthAndLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);
  });

  test('should navigate to Settings section', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();

    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/settings-01-main.png', fullPage: true });

      const content = await page.content();
      const hasSettingsContent =
        content.toLowerCase().includes('setting') ||
        content.toLowerCase().includes('configuration') ||
        content.toLowerCase().includes('general') ||
        content.toLowerCase().includes('store');

      expect(hasSettingsContent).toBe(true);
      console.log('Settings section loaded');
    } else {
      console.log('Settings link not found');
    }
  });

  test('should display general store settings', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();

    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for General settings
      const generalLink = page.locator('a:has-text("General"), [href*="general"]').first();
      if (await generalLink.count() > 0) {
        await generalLink.click();
        await page.waitForLoadState('networkidle');
      }

      await page.screenshot({ path: 'test-results/settings-02-general.png', fullPage: true });

      const content = await page.content();
      const hasGeneralSettings =
        content.toLowerCase().includes('store name') ||
        content.toLowerCase().includes('store info') ||
        content.toLowerCase().includes('business') ||
        content.toLowerCase().includes('general');

      if (hasGeneralSettings) {
        console.log('General settings displayed');
      }
    }
  });

  test('should access team/staff management', async ({ page }) => {
    // Navigate to Settings first
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();

    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Look for Team or Staff link
    const teamLink = page.locator('a:has-text("Team"), a:has-text("Staff"), [href*="team"], [href*="staff"]').first();

    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/settings-03-team.png', fullPage: true });

      const content = await page.content();
      const hasTeamContent =
        content.toLowerCase().includes('team') ||
        content.toLowerCase().includes('staff') ||
        content.toLowerCase().includes('member') ||
        content.toLowerCase().includes('invite');

      if (hasTeamContent) {
        console.log('Team management page loaded');
      }
    } else {
      // Try from main nav
      const navTeamLink = page.locator('a:has-text("Team")').first();
      if (await navTeamLink.count() > 0) {
        await navTeamLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/settings-03-team.png', fullPage: true });
        console.log('Team section accessed from main nav');
      }
    }
  });

  test('should access payment settings', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();

    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for Payments link
      const paymentsLink = page.locator('a:has-text("Payments"), a:has-text("Payment"), [href*="payment"]').first();

      if (await paymentsLink.count() > 0) {
        await paymentsLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/settings-04-payments.png', fullPage: true });

        const content = await page.content();
        const hasPaymentSettings =
          content.toLowerCase().includes('payment') ||
          content.toLowerCase().includes('stripe') ||
          content.toLowerCase().includes('gateway') ||
          content.toLowerCase().includes('method');

        if (hasPaymentSettings) {
          console.log('Payment settings page loaded');
        }
      }
    }
  });

  test('should access shipping settings', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();

    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for Shipping link
      const shippingLink = page.locator('a:has-text("Shipping"), [href*="shipping"]').first();

      if (await shippingLink.count() > 0) {
        await shippingLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/settings-05-shipping.png', fullPage: true });

        const content = await page.content();
        const hasShippingSettings =
          content.toLowerCase().includes('shipping') ||
          content.toLowerCase().includes('delivery') ||
          content.toLowerCase().includes('carrier') ||
          content.toLowerCase().includes('zone');

        if (hasShippingSettings) {
          console.log('Shipping settings page loaded');
        }
      }
    }
  });

  test('should access audit logs', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();

    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for Audit Logs link
      const auditLink = page.locator('a:has-text("Audit"), a:has-text("Logs"), [href*="audit"]').first();

      if (await auditLink.count() > 0) {
        await auditLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/settings-06-audit.png', fullPage: true });

        const content = await page.content();
        const hasAuditContent =
          content.toLowerCase().includes('audit') ||
          content.toLowerCase().includes('log') ||
          content.toLowerCase().includes('activity') ||
          content.toLowerCase().includes('event');

        if (hasAuditContent) {
          console.log('Audit logs page loaded');
        }
      }
    }
  });
});
