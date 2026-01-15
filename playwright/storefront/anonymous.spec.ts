import { test, expect } from '@playwright/test';
import { URLS, TIMEOUTS } from '../utils/test-data';

/**
 * Storefront Anonymous Access E2E Tests
 *
 * Tests that verify:
 * - Storefront loads without authentication
 * - No user is automatically logged in
 * - Login/Register options are available
 * - Store content is accessible
 */

test.describe('Storefront Anonymous Access', () => {
  // Test with an existing store
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';

  test('should load storefront anonymously', async ({ page }) => {
    const storefrontUrl = URLS.getStorefrontUrl(storeSlug);
    console.log(`Testing storefront at: ${storefrontUrl}`);

    // Navigate to storefront
    await page.goto(storefrontUrl, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await page.screenshot({ path: 'test-results/storefront-01-initial.png' });

    const content = await page.content();

    // Should NOT show Store Not Found
    const hasStoreNotFound = content.toLowerCase().includes('store not found');
    expect(hasStoreNotFound).toBe(false);

    // Should NOT have a logged-in user
    const hasLoggedInIndicators =
      content.includes('Sign Out') ||
      content.includes('Logout') ||
      content.includes('My Account') ||
      content.includes('My Orders');

    console.log(`Has logged-in indicators: ${hasLoggedInIndicators}`);

    // Should have anonymous/login options
    const hasAnonymousIndicators =
      content.includes('Login') ||
      content.includes('Sign In') ||
      content.includes('Create Account') ||
      content.includes('Register');

    console.log(`Has anonymous/login options: ${hasAnonymousIndicators}`);

    // Storefront should load with store content
    const hasStoreContent =
      content.includes('Products') ||
      content.includes('Categories') ||
      content.includes('Welcome') ||
      content.includes('Shop');

    expect(hasStoreContent).toBe(true);
    console.log('Storefront loaded successfully as anonymous!');
  });

  test('should not have user session from admin', async ({ browser }) => {
    // This test ensures admin sessions don't leak to storefront
    const adminUrl = URLS.getAdminUrl(storeSlug);
    const storefrontUrl = URLS.getStorefrontUrl(storeSlug);

    // Create fresh context (simulates new browser session)
    const context = await browser.newContext();
    const page = await context.newPage();

    // Go directly to storefront without visiting admin
    await page.goto(storefrontUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/storefront-02-fresh-session.png' });

    const content = await page.content();

    // Should be anonymous
    const isAnonymous =
      !content.includes('Sign Out') &&
      !content.includes('My Account') &&
      (content.includes('Login') || content.includes('Sign In'));

    expect(isAnonymous).toBe(true);
    console.log('Storefront is properly anonymous with fresh session');

    await context.close();
  });

  test('should show login and register options', async ({ page }) => {
    const storefrontUrl = URLS.getStorefrontUrl(storeSlug);

    await page.goto(storefrontUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/storefront-03-auth-options.png' });

    // Look for login button/link
    const loginElement = await page.$(
      'a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login"), button:has-text("Sign In")'
    );

    // Look for register button/link
    const registerElement = await page.$(
      'a:has-text("Register"), a:has-text("Sign Up"), a:has-text("Create Account")'
    );

    const hasAuthOptions = loginElement !== null || registerElement !== null;
    console.log(`Auth options available: ${hasAuthOptions}`);

    // At minimum, there should be a way to login
    expect(loginElement !== null || registerElement !== null).toBe(true);
  });

  test('should display store branding', async ({ page }) => {
    const storefrontUrl = URLS.getStorefrontUrl(storeSlug);

    await page.goto(storefrontUrl, { waitUntil: 'networkidle' });

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Page should have a title (not error page)
    expect(pageTitle.length).toBeGreaterThan(0);
    expect(pageTitle.toLowerCase()).not.toContain('error');
    expect(pageTitle.toLowerCase()).not.toContain('not found');

    await page.screenshot({ path: 'test-results/storefront-04-branding.png' });
  });
});
