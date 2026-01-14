import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');

/**
 * Authentication Setup for Playwright Tests
 *
 * This setup file handles authentication before running tests.
 * It stores the session in a JSON file that can be reused across tests.
 *
 * Usage Options:
 *
 * 1. Automated login (recommended):
 *    Set environment variables and run:
 *    TEST_USER_EMAIL=your@email.com TEST_USER_PASSWORD=yourpass npm run test:e2e
 *
 * 2. Manual login (headed mode):
 *    Run: npm run test:e2e:headed
 *    and manually log in when the browser opens.
 *
 * 3. Reuse existing session:
 *    If a valid session file exists (less than 12 hours old), it will be reused.
 */

// Check if session is still valid (less than 12 hours old)
function isSessionValid(): boolean {
  try {
    if (!fs.existsSync(authFile)) return false;

    const stats = fs.statSync(authFile);
    const sessionAge = Date.now() - stats.mtimeMs;
    const maxAge = 12 * 60 * 60 * 1000; // 12 hours

    if (sessionAge > maxAge) {
      console.log('Session expired (older than 12 hours)');
      return false;
    }

    // Also check if bff_session cookie is not expired
    const sessionData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    const bffSession = sessionData.cookies?.find((c: any) => c.name === 'bff_session');

    if (bffSession && bffSession.expires > 0) {
      const expiresAt = bffSession.expires * 1000; // Convert to ms
      if (expiresAt < Date.now()) {
        console.log('BFF session cookie expired');
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

// Extend timeout for manual login
setup.setTimeout(180000); // 3 minutes

setup('authenticate', async ({ page }) => {
  // Check if we have a valid existing session
  if (isSessionValid()) {
    console.log('Using existing valid session from:', authFile);
    // Load the session to validate it still works
    await page.context().addCookies(JSON.parse(fs.readFileSync(authFile, 'utf-8')).cookies || []);

    // Quick verification - try to access a protected page
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth') || currentUrl.includes('identity');

      if (!isLoginPage) {
        console.log('Session verified, skipping re-authentication');
        // Re-save to update file modification time
        await page.context().storageState({ path: authFile });
        return;
      }
      console.log('Session invalid, will re-authenticate...');
    } catch (e) {
      console.log('Session verification failed, will re-authenticate...', e);
    }
  }
  // Navigate to the app with retry logic
  console.log('Navigating to admin portal...');

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (error) {
    console.log('Initial navigation failed, retrying...');
    await page.waitForTimeout(2000);
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  // Wait for page to stabilize
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle').catch(() => {});

  const currentUrl = page.url();
  const isLoginPage = currentUrl.includes('/login') ||
                      currentUrl.includes('/auth') ||
                      currentUrl.includes('identity');

  if (isLoginPage) {
    // Check if we have credentials for automated login
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (testEmail && testPassword) {
      console.log('Attempting automated login...');

      // Step 1: Fill in email field
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).or(page.locator('input[type="email"]'));
      await emailInput.fill(testEmail);
      console.log('Email filled');

      // Step 2: Click Continue button (for two-step login flow)
      // Be specific to avoid matching "Continue with Google"
      const continueButton = page.getByRole('button', { name: 'Continue', exact: true })
        .or(page.locator('button[type="submit"]:has-text("Continue"):not(:has-text("Google"))'));

      await continueButton.waitFor({ state: 'visible', timeout: 5000 });
      await continueButton.click();
      console.log('Clicked Continue, waiting for password field...');

      // Wait for password field to appear
      await page.waitForTimeout(3000);

      // Step 3: Fill in password field
      const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).or(page.locator('input[type="password"]'));
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(testPassword);
      console.log('Password filled');

      // Step 4: Click sign in button
      const submitButton = page.getByRole('button', { name: /sign in|login|submit|continue/i });
      await submitButton.click();
      console.log('Clicked Sign In');

      // Wait for navigation away from login page
      await page.waitForURL(url => {
        const urlStr = url.toString();
        return !urlStr.includes('/login') &&
               !urlStr.includes('/auth') &&
               !urlStr.includes('identity');
      }, { timeout: 30000 });

      console.log('Automated login successful!');
    } else {
      console.log('Login page detected. Please log in manually...');
      console.log('Current URL:', currentUrl);
      console.log('');
      console.log('TIP: For automated login, set environment variables:');
      console.log('  TEST_USER_EMAIL=your@email.com');
      console.log('  TEST_USER_PASSWORD=yourpassword');

      // Wait for user to complete login (up to 2 minutes)
      // The test will wait until URL changes away from login
      await page.waitForURL(url => {
        const urlStr = url.toString();
        return !urlStr.includes('/login') &&
               !urlStr.includes('/auth') &&
               !urlStr.includes('identity');
      }, { timeout: 120000 });

      console.log('Login successful! Saving session...');
    }
  }

  // Verify we're on the dashboard or main app
  await expect(page).not.toHaveURL(/login|auth|identity/);

  // Wait a bit for all cookies to be set
  await page.waitForTimeout(2000);

  // Log current cookies for debugging
  const cookies = await page.context().cookies();
  console.log('Cookies before save:', cookies.map(c => c.name).join(', '));

  // Save the authentication state
  await page.context().storageState({ path: authFile });

  console.log('Session saved to:', authFile);
});
