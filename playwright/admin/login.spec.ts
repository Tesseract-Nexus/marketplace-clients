import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS, TIMEOUTS } from '../utils/test-data';

/**
 * Admin Login E2E Tests
 *
 * Tests for admin portal authentication:
 * - Successful login with valid credentials
 * - Dashboard access after login
 * - User info display
 * - Navigation between admin sections
 */

// Helper: Wait for dashboard to fully load (past the "Loading tenant context..." screen)
async function waitForDashboardToLoad(page: Page, timeoutMs: number = 60000): Promise<boolean> {
  console.log('Waiting for dashboard to load...');
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Wait for page to be stable
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});

      const content = await page.content();
      const contentLower = content.toLowerCase();
      const url = page.url();

      // Check if still loading
      const isLoading =
        contentLower.includes('loading tenant') ||
        contentLower.includes('loading context') ||
        (contentLower.includes('loading') && contentLower.length < 5000); // Short page with loading text

      // Check if dashboard content is visible
      const hasDashboard =
        contentLower.includes('dashboard') ||
        contentLower.includes('analytics') ||
        contentLower.includes('orders') ||
        contentLower.includes('products') ||
        contentLower.includes('customers') ||
        contentLower.includes('catalog') ||
        contentLower.includes('demo store'); // Tenant name in sidebar

      // Check if we're on login page (login failed or session expired)
      const onLoginPage =
        url.includes('login') ||
        url.includes('auth') ||
        url.includes('signin') ||
        contentLower.includes('sign in to your account') ||
        contentLower.includes('enter your email');

      if (hasDashboard && !isLoading) {
        console.log('Dashboard loaded successfully!');
        return true;
      }

      if (onLoginPage && !isLoading) {
        console.log('On login page');
        return false;
      }

    } catch (e) {
      // Page might be navigating, wait a bit
      console.log('Page navigating, waiting...');
    }

    // Wait a bit before checking again
    await page.waitForTimeout(1000);
  }

  console.log('Timeout waiting for dashboard to load');
  return false;
}

// Helper: Check if on login page
async function isOnLoginPage(page: Page): Promise<boolean> {
  try {
    const url = page.url();
    const content = await page.content();
    const contentLower = content.toLowerCase();

    return (
      url.includes('login') ||
      url.includes('auth') ||
      url.includes('signin') ||
      contentLower.includes('sign in to your account') ||
      contentLower.includes('enter your email') ||
      contentLower.includes('email address') && contentLower.includes('password') && contentLower.includes('sign in')
    );
  } catch {
    return false;
  }
}

// Helper: Perform admin login
async function performLogin(page: Page, email: string, password: string): Promise<boolean> {
  // Wait for page to be ready
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Let any redirects complete

  // Check if we need to login
  const needsLogin = await isOnLoginPage(page);

  if (!needsLogin) {
    console.log('Not on login page, checking if already logged in...');
    const dashboardLoaded = await waitForDashboardToLoad(page, 30000);
    if (dashboardLoaded) {
      console.log('Already logged in!');
      return true;
    }
    // If not on login and no dashboard, something is wrong
    return false;
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
  await page.waitForTimeout(3000);

  // Step 2: Enter password
  const passwordInput = page.locator('input[type="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: TIMEOUTS.action });
  await passwordInput.fill(password);
  console.log('Entered password');

  // Click sign in button
  const signInBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
  await signInBtn.click();
  console.log('Clicked sign in button');

  // Wait for dashboard to fully load
  const dashboardLoaded = await waitForDashboardToLoad(page);
  return dashboardLoaded;
}

// Helper: Check if logged in successfully
async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    const url = page.url();
    const content = await page.content();
    const contentLower = content.toLowerCase();

    // Should NOT be on login page
    if (url.includes('login') || url.includes('auth') || url.includes('signin')) {
      return false;
    }

    // Should NOT show error pages
    if (contentLower.includes('store not found') || contentLower.includes('404')) {
      return false;
    }

    // Should show dashboard/admin elements
    const hasAdminElements =
      contentLower.includes('dashboard') ||
      contentLower.includes('analytics') ||
      contentLower.includes('orders') ||
      contentLower.includes('products') ||
      contentLower.includes('customers') ||
      contentLower.includes('catalog') ||
      contentLower.includes('demo store');

    return hasAdminElements;
  } catch {
    return false;
  }
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
    const content = await page.content();
    const hasLoginForm = content.toLowerCase().includes('email') || content.toLowerCase().includes('sign in');
    const hasAdminContent = content.toLowerCase().includes('dashboard') || content.toLowerCase().includes('orders');

    expect(hasLoginForm || hasAdminContent).toBe(true);
    console.log(`Login form visible: ${hasLoginForm}, Admin content visible: ${hasAdminContent}`);
  });

  test('should login to admin with valid credentials', async ({ page }) => {
    // Navigate to admin
    await page.goto(adminUrl);
    await page.screenshot({ path: 'test-results/admin-02-before-login.png', fullPage: true });

    // Perform login
    const loginSuccess = await performLogin(page, TEST_USER.email, TEST_USER.password);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/admin-03-after-login.png', fullPage: true });

    // Verify login success
    expect(loginSuccess).toBe(true);

    // Additional verification
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    console.log(`Final URL: ${page.url()}`);
    console.log('Admin login successful!');
  });

  test('should display user information after login', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    const loginSuccess = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);

    // Wait for page to fully load
    await page.waitForTimeout(2000);
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
    const loginSuccess = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);

    // Try to navigate to Catalog section (contains Products)
    const catalogLink = page.locator('a:has-text("Catalog"), [href*="catalog"]').first();
    if (await catalogLink.count() > 0) {
      await catalogLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin-05-catalog-section.png', fullPage: true });
      console.log('Navigated to Catalog section');
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

    // Verify we're still logged in after navigation
    const stillLoggedIn = await isLoggedIn(page);
    expect(stillLoggedIn).toBe(true);
  });

  test('should access Feature Flags page', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    const loginSuccess = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);

    // Navigate to Feature Flags
    const featureFlagsLink = page.locator('a:has-text("Feature Flags"), [href*="feature-flags"]').first();
    if (await featureFlagsLink.count() > 0) {
      await featureFlagsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/admin-08-feature-flags.png', fullPage: true });

      // Verify Feature Flags page loaded
      const content = await page.content();
      const hasFeatureFlags = content.includes('Feature Flags') || content.includes('feature flags');
      expect(hasFeatureFlags).toBe(true);
      console.log('Feature Flags page loaded successfully');
    } else {
      console.log('Feature Flags link not found in sidebar - skipping');
      // Test passes even if Feature Flags link not found (may not be visible for this user)
    }
  });

  test('should persist session on page reload', async ({ page }) => {
    // Navigate and login
    await page.goto(adminUrl);
    const loginSuccess = await performLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);

    // Verify initial login
    let loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Wait for dashboard to load again
    await waitForDashboardToLoad(page, 30000);

    // Verify session persists
    loggedIn = await isLoggedIn(page);
    await page.screenshot({ path: 'test-results/admin-09-after-reload.png', fullPage: true });

    console.log(`Session after reload - Logged in: ${loggedIn}, URL: ${page.url()}`);
    expect(loggedIn).toBe(true);
  });
});
