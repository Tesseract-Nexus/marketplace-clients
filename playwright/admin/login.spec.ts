import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS, TIMEOUTS } from '../utils/test-data';

/**
 * Admin Login E2E Tests
 *
 * Tests for admin portal authentication using Keycloak/Tesseract Hub
 * Login flow:
 * 1. Navigate to admin URL -> "Checking authentication..."
 * 2. Redirects to Tesseract Hub login page
 * 3. Enter email -> Click Continue
 * 4. Enter password -> Click Sign In
 * 5. Redirects back to admin dashboard
 */

// Helper: Wait for authentication check to complete and return final state
async function waitForAuthCheck(page: Page, timeoutMs: number = 30000): Promise<'login' | 'dashboard' | 'unknown'> {
  console.log('Waiting for authentication check...');
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});

      const content = await page.content();
      const contentLower = content.toLowerCase();
      const url = page.url();

      // Still checking authentication
      if (contentLower.includes('checking authentication')) {
        await page.waitForTimeout(1000);
        continue;
      }

      // On Keycloak/Tesseract Hub login page
      if (
        contentLower.includes('welcome back') ||
        contentLower.includes('tesseract hub') ||
        contentLower.includes('sign in to your account') ||
        url.includes('devtest-customer-idp') ||
        url.includes('keycloak') ||
        url.includes('auth/realms')
      ) {
        console.log('On login page (Tesseract Hub)');
        return 'login';
      }

      // On dashboard
      if (
        contentLower.includes('dashboard') ||
        contentLower.includes('demo store') ||
        contentLower.includes('analytics') ||
        contentLower.includes('orders') && contentLower.includes('products')
      ) {
        console.log('On dashboard (already authenticated)');
        return 'dashboard';
      }

      // Loading tenant context
      if (contentLower.includes('loading tenant')) {
        await page.waitForTimeout(1000);
        continue;
      }

    } catch (e) {
      // Page navigating
    }

    await page.waitForTimeout(500);
  }

  console.log('Auth check timed out');
  return 'unknown';
}

// Helper: Wait for dashboard to fully load
async function waitForDashboard(page: Page, timeoutMs: number = 60000): Promise<boolean> {
  console.log('Waiting for dashboard...');
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const content = await page.content();
      const contentLower = content.toLowerCase();

      // Still loading
      if (
        contentLower.includes('loading tenant') ||
        contentLower.includes('checking authentication') ||
        (contentLower.includes('loading') && contentLower.length < 5000)
      ) {
        await page.waitForTimeout(1000);
        continue;
      }

      // Dashboard loaded
      if (
        contentLower.includes('dashboard') ||
        contentLower.includes('demo store') ||
        contentLower.includes('analytics') ||
        (contentLower.includes('orders') && contentLower.includes('products'))
      ) {
        console.log('Dashboard loaded!');
        return true;
      }

      // Back on login (auth failed)
      if (
        contentLower.includes('welcome back') ||
        contentLower.includes('tesseract hub') ||
        contentLower.includes('invalid credentials')
      ) {
        console.log('Back on login page - authentication may have failed');
        return false;
      }

    } catch (e) {
      // Page navigating
    }

    await page.waitForTimeout(1000);
  }

  return false;
}

// Helper: Perform login on Tesseract Hub
async function performKeycloakLogin(page: Page, email: string, password: string): Promise<boolean> {
  console.log('Performing Keycloak login...');

  try {
    // Step 1: Enter email
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"], input[id="username"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(email);
    console.log(`Entered email: ${email}`);

    // Click Continue button
    const continueBtn = page.locator('button:has-text("Continue"), button[type="submit"]').first();
    await continueBtn.click();
    console.log('Clicked Continue');

    // Wait for password field
    await page.waitForTimeout(2000);

    // Step 2: Enter password
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill(password);
    console.log('Entered password');

    // Click Sign In button
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await signInBtn.click();
    console.log('Clicked Sign In');

    // Wait for redirect and dashboard to load
    await page.waitForTimeout(3000);
    const dashboardLoaded = await waitForDashboard(page);

    return dashboardLoaded;

  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Main login helper
async function performLogin(page: Page, email: string, password: string): Promise<boolean> {
  // Wait for initial auth check
  const authState = await waitForAuthCheck(page);

  if (authState === 'dashboard') {
    console.log('Already logged in!');
    return true;
  }

  if (authState === 'login') {
    return await performKeycloakLogin(page, email, password);
  }

  console.log('Unknown state, attempting login anyway...');
  return await performKeycloakLogin(page, email, password);
}

// Helper: Check if logged in
async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    const content = await page.content();
    const contentLower = content.toLowerCase();
    const url = page.url();

    // Should NOT be on login page
    if (
      url.includes('keycloak') ||
      url.includes('auth/realms') ||
      url.includes('devtest-customer-idp') ||
      contentLower.includes('welcome back') ||
      contentLower.includes('sign in to your account')
    ) {
      return false;
    }

    // Should show dashboard elements
    return (
      contentLower.includes('dashboard') ||
      contentLower.includes('demo store') ||
      contentLower.includes('analytics') ||
      contentLower.includes('orders') ||
      contentLower.includes('products') ||
      contentLower.includes('customers')
    );
  } catch {
    return false;
  }
}

test.describe('Admin Portal Login', () => {
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    console.log(`\n=== Test starting ===`);
    console.log(`Admin URL: ${adminUrl}`);
    console.log(`Test user: ${TEST_USER.email}`);
  });

  test('should load admin and redirect to login', async ({ page }) => {
    await page.goto(adminUrl);

    // Wait for auth check and redirect
    const authState = await waitForAuthCheck(page);
    await page.screenshot({ path: 'test-results/admin-01-after-auth-check.png', fullPage: true });

    // Should either be on login or dashboard
    expect(['login', 'dashboard']).toContain(authState);
    console.log(`Auth state: ${authState}`);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto(adminUrl);
    await page.screenshot({ path: 'test-results/admin-02-initial.png', fullPage: true });

    // Perform login
    const success = await performLogin(page, TEST_USER.email, TEST_USER.password);
    await page.screenshot({ path: 'test-results/admin-03-after-login.png', fullPage: true });

    expect(success).toBe(true);

    // Verify logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    console.log(`Final URL: ${page.url()}`);
  });

  test('should display user info after login', async ({ page }) => {
    await page.goto(adminUrl);
    const success = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);

    await page.screenshot({ path: 'test-results/admin-04-dashboard.png', fullPage: true });

    // Check for user info
    const content = await page.content();
    const hasUserInfo =
      content.includes(TEST_USER.email) ||
      content.includes(TEST_USER.firstName) ||
      content.includes('Samyak') ||
      content.toLowerCase().includes('sign out') ||
      content.toLowerCase().includes('logout');

    console.log(`User info visible: ${hasUserInfo}`);
    expect(hasUserInfo).toBe(true);
  });

  test('should navigate admin sections', async ({ page }) => {
    await page.goto(adminUrl);
    const success = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);

    // Navigate to Catalog
    const catalogLink = page.locator('a:has-text("Catalog"), [href*="catalog"]').first();
    if (await catalogLink.count() > 0) {
      await catalogLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-05-catalog.png', fullPage: true });
      console.log('Navigated to Catalog');
    }

    // Navigate to Orders
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();
    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-06-orders.png', fullPage: true });
      console.log('Navigated to Orders');
    }

    // Still logged in?
    expect(await isLoggedIn(page)).toBe(true);
  });

  test('should access Feature Flags', async ({ page }) => {
    await page.goto(adminUrl);
    const success = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);

    // Find and click Feature Flags
    const ffLink = page.locator('a:has-text("Feature Flags"), [href*="feature-flags"]').first();
    if (await ffLink.count() > 0) {
      await ffLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/admin-07-feature-flags.png', fullPage: true });

      const content = await page.content();
      expect(content.toLowerCase()).toContain('feature flag');
      console.log('Feature Flags page loaded');
    } else {
      console.log('Feature Flags link not found');
    }
  });

  test('should persist session on reload', async ({ page }) => {
    await page.goto(adminUrl);
    const success = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);

    // Reload
    await page.reload();
    await waitForAuthCheck(page);
    await waitForDashboard(page, 30000);

    await page.screenshot({ path: 'test-results/admin-08-after-reload.png', fullPage: true });

    const stillLoggedIn = await isLoggedIn(page);
    console.log(`After reload - logged in: ${stillLoggedIn}`);
    expect(stillLoggedIn).toBe(true);
  });
});
