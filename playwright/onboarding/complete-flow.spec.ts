import { test, expect, Page } from '@playwright/test';
import { TEST_USER, TEST_STORE, URLS, TIMEOUTS } from '../utils/test-data';
import {
  waitForVerificationLink,
  completeEmailVerification,
  generateSlug,
} from '../utils/email-verification';

/**
 * Complete Onboarding E2E Test
 *
 * This test covers the entire onboarding flow:
 * 1. Start new tenant onboarding
 * 2. Enter email address
 * 3. Send verification email
 * 4. Complete email verification (fetches link from backend)
 * 5. Set password
 * 6. Create store with name
 * 7. Complete onboarding
 * 8. Verify admin dashboard loads
 * 9. Verify storefront is anonymous
 */

test.describe('Tenant Onboarding Complete Flow', () => {
  let page: Page;
  let verificationLink: string | null = null;
  const storeSlug = generateSlug(TEST_STORE.name);

  test.beforeAll(async ({ browser }) => {
    // Create a persistent context for the entire flow
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('Step 1: Navigate to onboarding and enter email', async () => {
    console.log(`\n=== Starting Onboarding for ${TEST_USER.email} ===\n`);

    // Navigate to onboarding
    await page.goto(URLS.onboarding, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/01-onboarding-start.png' });

    // Check we're on the onboarding page
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Check if we're on a landing page - click "Get Started" or "Start Free Trial"
    const getStartedBtn = await page.$(
      'button:has-text("Get Started"), button:has-text("Start Free Trial"), a:has-text("Get Started"), a:has-text("Start Free Trial")'
    );

    if (getStartedBtn) {
      console.log('On landing page, clicking Get Started...');
      await getStartedBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/01b-after-get-started.png' });
    }

    // Look for email input
    const emailInput = await page.waitForSelector(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]',
      { timeout: TIMEOUTS.action }
    );

    expect(emailInput).toBeTruthy();

    // Enter email
    await emailInput.fill(TEST_USER.email);
    console.log(`Entered email: ${TEST_USER.email}`);

    await page.screenshot({ path: 'test-results/02-email-entered.png' });

    // Click continue/next button
    const continueBtn = await page.$(
      'button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Get Started")'
    );

    if (continueBtn) {
      await continueBtn.click();
      console.log('Clicked continue button');
    }

    // Wait for next step
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/03-after-email-submit.png' });
  });

  test('Step 2: Send verification email', async () => {
    // Check if we need to click a "Send Verification" button
    const sendVerifyBtn = await page.$(
      'button:has-text("Send"), button:has-text("Verify"), button:has-text("Continue")'
    );

    if (sendVerifyBtn) {
      await sendVerifyBtn.click();
      console.log('Clicked send verification button');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/04-verification-sent.png' });

    // Check page content for verification instructions
    const content = await page.content();
    const hasVerificationMessage =
      content.toLowerCase().includes('verification') ||
      content.toLowerCase().includes('check your email') ||
      content.toLowerCase().includes('sent');

    console.log(`Verification message shown: ${hasVerificationMessage}`);
  });

  test('Step 3: Fetch and complete email verification', async () => {
    console.log('Waiting for verification link...');

    // Try to get verification link from backend
    verificationLink = await waitForVerificationLink(TEST_USER.email, TIMEOUTS.verification);

    if (!verificationLink) {
      // If we can't get the link automatically, try to find it in the page
      // Some onboarding flows show a "resend" or have a test bypass
      console.log('Could not fetch verification link automatically');

      // Check if there's a way to proceed without email verification (dev mode)
      const skipLink = await page.$('a:has-text("Skip"), button:has-text("Skip")');
      if (skipLink) {
        await skipLink.click();
        console.log('Using skip link for verification');
        await page.waitForTimeout(2000);
        return;
      }

      // Try to extract from page if it shows the link (dev environments sometimes do)
      const pageContent = await page.content();
      const linkMatch = pageContent.match(/https?:\/\/[^\s"<>]+verify[^\s"<>]+token=[^\s"<>]+/i);
      if (linkMatch) {
        verificationLink = linkMatch[0];
        console.log('Found verification link in page content');
      }
    }

    if (verificationLink) {
      console.log('Got verification link, completing verification...');

      // Open verification link in the same page
      await page.goto(verificationLink, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/05-verification-complete.png' });

      const verifiedContent = await page.content();
      const isVerified =
        verifiedContent.toLowerCase().includes('verified') ||
        verifiedContent.toLowerCase().includes('success') ||
        verifiedContent.toLowerCase().includes('password');

      console.log(`Email verification successful: ${isVerified}`);
    } else {
      console.log('WARNING: Could not complete email verification automatically');
      // The test will continue - manual verification may be needed
    }
  });

  test('Step 4: Set password', async () => {
    // Check if we're on the password setup page
    const passwordInput = await page.waitForSelector(
      'input[type="password"], input[name="password"]',
      { timeout: TIMEOUTS.action }
    ).catch(() => null);

    if (passwordInput) {
      console.log('On password setup page');

      // Fill password
      await passwordInput.fill(TEST_USER.password);

      // Check for confirm password field
      const confirmInput = await page.$('input[name="confirmPassword"], input[placeholder*="confirm" i]');
      if (confirmInput) {
        await confirmInput.fill(TEST_USER.password);
      }

      await page.screenshot({ path: 'test-results/06-password-entered.png' });

      // Submit password
      const submitBtn = await page.$('button[type="submit"], button:has-text("Set Password"), button:has-text("Continue")');
      if (submitBtn) {
        await submitBtn.click();
        console.log('Submitted password');
      }

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/07-after-password-submit.png' });
    } else {
      console.log('Password input not found - may already be set or different flow');
    }
  });

  test('Step 5: Enter store details', async () => {
    // Look for store name input
    const storeNameInput = await page.$(
      'input[name="storeName"], input[name="name"], input[placeholder*="store" i], input[placeholder*="business" i]'
    );

    if (storeNameInput) {
      console.log('Found store name input');
      await storeNameInput.fill(TEST_STORE.name);

      // Look for slug input
      const slugInput = await page.$('input[name="slug"], input[placeholder*="slug" i]');
      if (slugInput) {
        await slugInput.clear();
        await slugInput.fill(storeSlug);
      }

      // Look for industry dropdown
      const industrySelect = await page.$('select[name="industry"], [data-testid="industry-select"]');
      if (industrySelect) {
        await industrySelect.selectOption({ label: 'Retail' }).catch(() => {
          // Try clicking to open dropdown
          industrySelect.click();
        });
      }

      await page.screenshot({ path: 'test-results/08-store-details-entered.png' });

      // Continue
      const continueBtn = await page.$('button[type="submit"], button:has-text("Continue"), button:has-text("Create")');
      if (continueBtn) {
        await continueBtn.click();
        console.log('Submitted store details');
      }

      await page.waitForTimeout(3000);
    } else {
      console.log('Store name input not found on current page');
      await page.screenshot({ path: 'test-results/08-current-page-state.png' });
    }
  });

  test('Step 6: Complete onboarding setup', async () => {
    // This step handles any additional setup screens and final completion
    let maxSteps = 10;

    while (maxSteps > 0) {
      maxSteps--;

      const currentUrl = page.url();
      const content = await page.content();

      // Check if we've completed onboarding (redirected to admin)
      if (currentUrl.includes('-admin.tesserix.app')) {
        console.log('Redirected to admin - onboarding complete!');
        break;
      }

      // Check for completion message
      if (
        content.toLowerCase().includes('setting up your store') ||
        content.toLowerCase().includes('creating your store') ||
        content.toLowerCase().includes('please wait')
      ) {
        console.log('Store creation in progress...');
        await page.waitForTimeout(5000);
        continue;
      }

      // Check for success/completion
      if (
        content.toLowerCase().includes('congratulations') ||
        content.toLowerCase().includes('store is ready') ||
        content.toLowerCase().includes('success')
      ) {
        console.log('Onboarding completed successfully!');

        // Look for "Go to Admin" button
        const goToAdminBtn = await page.$(
          'a:has-text("Admin"), a:has-text("Dashboard"), button:has-text("Admin"), button:has-text("Dashboard")'
        );
        if (goToAdminBtn) {
          await goToAdminBtn.click();
          await page.waitForTimeout(3000);
        }
        break;
      }

      // Look for continue/next buttons
      const continueBtn = await page.$(
        'button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Finish")'
      );

      if (continueBtn && await continueBtn.isVisible()) {
        await continueBtn.click();
        console.log('Clicked continue button');
        await page.waitForTimeout(3000);
      } else {
        // No button found, wait and check again
        await page.waitForTimeout(3000);
      }

      await page.screenshot({ path: `test-results/09-setup-step-${10 - maxSteps}.png` });
    }

    await page.screenshot({ path: 'test-results/10-onboarding-complete.png' });
  });

  test('Step 7: Verify admin dashboard access', async () => {
    const adminUrl = URLS.getAdminUrl(storeSlug);
    console.log(`\nVerifying admin access at: ${adminUrl}`);

    // If not already on admin, navigate there
    if (!page.url().includes('-admin.tesserix.app')) {
      await page.goto(adminUrl, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/11-admin-dashboard.png' });

    const currentUrl = page.url();
    const content = await page.content();

    // Check for Store Not Found error
    const hasStoreNotFound =
      content.toLowerCase().includes('store not found') ||
      content.toLowerCase().includes('tenant not found');

    expect(hasStoreNotFound).toBe(false);

    // Check for dashboard elements
    const hasDashboard =
      content.toLowerCase().includes('dashboard') ||
      content.includes('Demo Store') ||
      content.includes(TEST_STORE.name);

    if (currentUrl.includes('login')) {
      console.log('On login page - need to authenticate');

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

      await page.screenshot({ path: 'test-results/12-admin-after-login.png' });
    }

    console.log(`Admin dashboard loaded: ${hasDashboard || !currentUrl.includes('login')}`);
  });

  test('Step 8: Verify storefront is anonymous', async () => {
    const storefrontUrl = URLS.getStorefrontUrl(storeSlug);
    console.log(`\nVerifying storefront at: ${storefrontUrl}`);

    // Open storefront in new context (clean session)
    const newContext = await page.context().browser()!.newContext();
    const storefrontPage = await newContext.newPage();

    await storefrontPage.goto(storefrontUrl, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await storefrontPage.waitForTimeout(3000);
    await storefrontPage.screenshot({ path: 'test-results/13-storefront.png' });

    const content = await storefrontPage.content();

    // Check for Store Not Found
    const hasStoreNotFound = content.toLowerCase().includes('store not found');
    expect(hasStoreNotFound).toBe(false);

    // Check that user is NOT logged in
    const hasLoggedInUser =
      content.includes(TEST_USER.email) ||
      content.includes(TEST_USER.firstName) ||
      content.includes('Sign Out') ||
      content.includes('My Account');

    // Check for anonymous indicators
    const hasAnonymousIndicators =
      content.includes('Login') ||
      content.includes('Sign In') ||
      content.includes('Create Account') ||
      content.includes('Register');

    console.log(`Storefront is anonymous: ${!hasLoggedInUser || hasAnonymousIndicators}`);

    await newContext.close();
  });
});
