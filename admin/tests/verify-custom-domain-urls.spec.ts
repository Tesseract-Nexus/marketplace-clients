import { test, expect } from '@playwright/test';

// Skip the default auth setup - we'll use custom domain credentials
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Verify Store Settings shows custom domain URL when accessed via custom domain
 */
test.describe('Custom Domain Store Settings', () => {
  test('should show custom domain URL in store settings', async ({ page }) => {
    // Navigate to custom domain admin
    console.log('Navigating to custom domain admin...');
    await page.goto('https://admin.yahvismartfarm.com/');

    // Wait for page to load - may redirect to login
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If redirected to login, perform login
    if (currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl.includes('keycloak')) {
      console.log('Login page detected, performing login...');

      // Step 1: Enter email and click Continue
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.fill('samyak.rout@gmail.com');
      console.log('Email entered');

      // Click Continue button
      const continueButton = page.locator('button:has-text("Continue")').first();
      await continueButton.click();
      console.log('Continue clicked');

      // Step 2: Wait for password field and enter password
      await page.waitForTimeout(2000);
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('Admin@123');
      console.log('Password entered');

      // Click Sign In / Login button
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();
      await loginButton.click();
      console.log('Login clicked');

      // Wait for redirect after login
      await page.waitForTimeout(8000);
      console.log('After login URL:', page.url());
    }

    // Navigate to Store Settings
    console.log('Navigating to Store Settings...');
    await page.goto('https://admin.yahvismartfarm.com/settings/general');

    // Wait for page to load
    await page.waitForSelector('text=Store Settings', { timeout: 30000 });
    console.log('Store Settings page loaded');

    // Wait for storefronts to load
    await page.waitForTimeout(5000);

    // Take a screenshot for verification
    await page.screenshot({ path: '/tmp/playwright-test/store-settings-custom-domain.png', fullPage: true });
    console.log('Screenshot saved to /tmp/playwright-test/store-settings-custom-domain.png');

    // Check for the storefront URL displayed on the page
    const pageContent = await page.content();

    // Look for the URL in the page
    const hasCustomDomainUrl = pageContent.includes('yahvismartfarm.com');
    const hasDefaultUrl = pageContent.includes('custom-store.tesserix.app');

    console.log('=== URL Analysis ===');
    console.log('Page contains yahvismartfarm.com:', hasCustomDomainUrl);
    console.log('Page contains custom-store.tesserix.app:', hasDefaultUrl);

    // Find the "Your store is live at" URL
    const liveAtSection = page.locator('text=Your store is live at').locator('xpath=..');
    if (await liveAtSection.isVisible()) {
      const liveAtContent = await liveAtSection.textContent();
      console.log('"Your store is live at" section:', liveAtContent);
    }

    // Find URLs in links
    const urlElements = page.locator('a[href*="https://"]');
    const urlCount = await urlElements.count();
    console.log('Found ' + urlCount + ' clickable URL links');

    for (let i = 0; i < Math.min(urlCount, 10); i++) {
      const href = await urlElements.nth(i).getAttribute('href');
      console.log('Link ' + (i + 1) + ':', href);
    }

    // Result
    console.log('=== Result ===');
    if (hasCustomDomainUrl && !hasDefaultUrl) {
      console.log('SUCCESS: Only custom domain URL is shown');
    } else if (hasCustomDomainUrl && hasDefaultUrl) {
      console.log('PARTIAL: Both URLs shown (custom domain in some places)');
    } else if (!hasCustomDomainUrl && hasDefaultUrl) {
      console.log('FAIL: Only default URL shown - fix not working');
    }
    
    expect(hasCustomDomainUrl, 'Page should contain yahvismartfarm.com').toBe(true);
  });
});
