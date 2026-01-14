import { test, expect } from '@playwright/test';

/**
 * Password Reset E2E Test
 * Triggers forgot password flow for test accounts
 */

const BASE_URL = 'https://demo-store.tesserix.app';
const TEST_EMAILS = [
  'lipsha03@gmail.com',
  'samyak.rout1988@gmail.com',
];

test.describe('Password Reset', () => {
  for (const email of TEST_EMAILS) {
    test(`should trigger password reset for ${email}`, async ({ page }) => {
      console.log(`\n=== Resetting password for ${email} ===`);

      // Go to login page
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(2000);

      // Click "Forgot password?" link
      const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotPasswordLink).toBeVisible({ timeout: 10000 });
      await forgotPasswordLink.click();
      console.log('✓ Clicked forgot password link');

      // Wait for forgot password page
      await page.waitForTimeout(2000);

      // Fill email
      const emailInput = page.getByLabel(/email/i);
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(email);
        console.log('✓ Filled email address');

        // Submit the form
        const submitButton = page.getByRole('button', { name: /reset|send|submit/i });
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          console.log('✓ Submitted reset request');
          await page.waitForTimeout(3000);
        }
      } else {
        // May have been redirected to Keycloak
        console.log('Redirected to Keycloak for password reset');

        // Look for Keycloak email input
        const kcEmailInput = page.locator('input[name="username"], input[name="email"], input#username, input#email');
        if (await kcEmailInput.isVisible().catch(() => false)) {
          await kcEmailInput.fill(email);
          console.log('✓ Filled email in Keycloak');

          const kcSubmit = page.locator('input[type="submit"], button[type="submit"]');
          if (await kcSubmit.isVisible().catch(() => false)) {
            await kcSubmit.click();
            console.log('✓ Submitted Keycloak reset request');
            await page.waitForTimeout(3000);
          }
        }
      }

      // Take a screenshot of the result
      await page.screenshot({ path: `test-results/reset-${email.replace('@', '-at-')}.png` });
      console.log(`=== Completed reset for ${email} ===\n`);
    });
  }
});
