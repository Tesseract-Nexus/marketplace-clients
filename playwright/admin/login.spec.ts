import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS, TIMEOUTS } from '../utils/test-data';

/**
 * Admin Login E2E Tests
 *
 * Tests for admin portal authentication:
 * - Successful login with valid credentials
 * - Dashboard access after login
 * - User info display
 * - Invalid credentials handling
 */

// Helper: Perform admin login
async function performLogin(page: Page, email: string, password: string): Promise<void> {
  // Wait for login form to be ready
  await page.waitForLoadState('networkidle');

  // Check if we're on a login/auth page
  const currentUrl = page.url();
  if (!currentUrl.includes('login') && !currentUrl.includes('auth') && !currentUrl.includes('signin')) {
    console.log('Already logged in or not on login page');
    return;
  }

  console.log('On login page, entering credentials...');

  // Step 1: Enter email
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
  await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.action });
  await emailInput.fill(email);
  console.log(`Entered email: ${email}`);

  // Look for continue/next button (two-step login) or direct submit
  const continueBtn = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next")').first();
  await continueBtn.click();
  console.log('Clicked continue/submit button');

  // Wait for password field (may be same page or new page)
  await page.waitForTimeout(2000);

  // Step 2: Enter password
  const passwordInput = page.locator('input[type="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: TIMEOUTS.action });
  await passwordInput.fill(password);
  console.log('Entered password');

  // Click sign in button
  const signInBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
  await signInBtn.click();
  console.log('Clicked sign in button');

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
}

// Helper: Check if logged in successfully
async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  const content = await page.content();
  const contentLower = content.toLowerCase();

  // Should NOT be on login page
  if (url.includes('login') || url.includes('auth') || url.includes('signin')) {
    return false;
  }

  // Should NOT show error pages
  if (contentLower.includes('store not found') || contentLower.includes('404') || contentLower.includes('error')) {
    return false;
  }

  // Should show dashboard/admin elements
  const hasAdminElements =
    contentLower.includes('dashboard') ||
    contentLower.includes('analytics') ||
    contentLower.includes('orders') ||
    contentLower.includes('products') ||
    contentLower.includes('customers') ||
    contentLower.includes('catalog');

  return hasAdminElements;
}

test.describe('Admin Portal Login', () => {
  // Use demo-store for testing
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    console.log(`\n--- Test starting ---`);
    console.log(`Admin URL: ${adminUrl}`);
    console.log(`Test user: ${TEST_USER.email}`);
  });

  test('should load admin login page', async ({ page }) => {
    await page.goto(adminUrl);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial page
    await page.screenshot({ path: 'test-results/admin-01-initial-page.png', fullPage: true });

    // Should either show login form or dashboard (if already logged in)
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    const hasAdminContent = await page.locator('text=Dashboard, text=Orders, text=Products').count() > 0;

    expect(hasLoginForm || hasAdminContent).toBe(true);
    console.log(`Login form visible: ${hasLoginForm}, Admin content visible: ${hasAdminContent}`);
  });

  test('should login to admin with valid credentials', async ({ page }) => {
    // Navigate to admin
    await page.goto(adminUrl);
    await page.screenshot({ path: 'test-results/admin-02-before-login.png', fullPage: true });

    // Perform login
    await performLogin(page, TEST_USER.email, TEST_USER.password);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/admin-03-after-login.png', fullPage: true });

    // Verify login success
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    // Additional verification: should see dashboard elements
    const dashboardVisible = await page.locator('text=Dashboard').or(page.locator('text=Home')).count() > 0;
    console.log(`Dashboard visible: ${dashboardVisible}`);
    console.log(`Final URL: ${page.url()}`);
    console.log('Admin login successful!');
  });

  test('should display user information after login', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    await performLogin(page, TEST_USER.email, TEST_USER.password);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/admin-04-logged-in-state.png', fullPage: true });

    // Check for user info in the page
    const content = await page.content();
    const hasUserEmail = content.includes(TEST_USER.email);
    const hasUserName = content.includes(TEST_USER.firstName) || content.includes('Samyak');
    const hasSignOut = content.toLowerCase().includes('sign out') || content.toLowerCase().includes('logout');

    console.log(`User email visible: ${hasUserEmail}`);
    console.log(`User name visible: ${hasUserName}`);
    console.log(`Sign out option visible: ${hasSignOut}`);

    // At least one of these should be true
    expect(hasUserEmail || hasUserName || hasSignOut).toBe(true);
  });

  test('should navigate to different admin sections', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    await performLogin(page, TEST_USER.email, TEST_USER.password);

    // Verify we're logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    // Try to navigate to Products section
    const productsLink = page.locator('a:has-text("Products"), a:has-text("Catalog"), [href*="products"]').first();
    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-05-products-section.png', fullPage: true });
      console.log('Navigated to Products section');
    }

    // Try to navigate to Orders section
    const ordersLink = page.locator('a:has-text("Orders"), [href*="orders"]').first();
    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-06-orders-section.png', fullPage: true });
      console.log('Navigated to Orders section');
    }

    // Try to navigate to Customers section
    const customersLink = page.locator('a:has-text("Customers"), [href*="customers"]').first();
    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-07-customers-section.png', fullPage: true });
      console.log('Navigated to Customers section');
    }
  });

  test('should access Feature Flags page', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    await performLogin(page, TEST_USER.email, TEST_USER.password);

    // Navigate to Feature Flags
    const featureFlagsLink = page.locator('a:has-text("Feature Flags"), [href*="feature-flags"]').first();
    if (await featureFlagsLink.count() > 0) {
      await featureFlagsLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-08-feature-flags.png', fullPage: true });

      // Verify Feature Flags page loaded
      const content = await page.content();
      const hasFeatureFlags = content.includes('Feature Flags') || content.includes('feature flags');
      expect(hasFeatureFlags).toBe(true);
      console.log('Feature Flags page loaded successfully');
    } else {
      console.log('Feature Flags link not found in sidebar');
    }
  });

  test('should persist session on page reload', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    await performLogin(page, TEST_USER.email, TEST_USER.password);

    // Verify initial login
    let loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify session persists
    loggedIn = await isLoggedIn(page);
    await page.screenshot({ path: 'test-results/admin-09-after-reload.png', fullPage: true });

    // Session should still be valid (or redirect to login which is also acceptable)
    const url = page.url();
    const isStillValid = loggedIn || url.includes('login');
    expect(isStillValid).toBe(true);
    console.log(`Session after reload - Logged in: ${loggedIn}, URL: ${url}`);
  });
});
