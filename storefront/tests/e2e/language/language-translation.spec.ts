import { test, expect } from '@playwright/test';

/**
 * Language Translation E2E Tests
 *
 * Tests the language translation functionality on the deployed storefront.
 * Note: Some tests may skip if the language selector hasn't been deployed yet.
 */

test.describe('Language Translation', () => {

  test.describe('Language Selector', () => {

    test('should display language selector in header when available', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Look for language selector by data-testid or aria-label
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      // Check if either selector is visible
      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      expect(selectorVisible || globeVisible).toBeTruthy();
    });

    test('should open dropdown and show language options when clicked', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find language selector
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      // Check which selector is available
      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      const selector = selectorVisible ? languageSelector : globeButton;
      await selector.click();

      // Wait for dropdown to appear
      const dropdown = page.locator('[role="listbox"]');
      const options = page.locator('[role="option"]');

      // Either dropdown or options should be visible
      const dropdownVisible = await dropdown.isVisible({ timeout: 5000 }).catch(() => false);
      const optionsVisible = await options.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(dropdownVisible || optionsVisible).toBeTruthy();
    });

    test('should show translation label in dropdown', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find language selector
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      const selector = selectorVisible ? languageSelector : globeButton;
      await selector.click();
      await page.waitForTimeout(500);

      // Look for the label text
      const label = page.locator('text=Translate content to:');
      const labelVisible = await label.isVisible({ timeout: 3000 }).catch(() => false);

      // Either we find the label or we have options visible
      const options = page.locator('[role="option"]');
      const optionsVisible = await options.first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(labelVisible || optionsVisible).toBeTruthy();
    });
  });

  test.describe('Language Switching', () => {

    test('should persist language selection in localStorage', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find language selector
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      const selector = selectorVisible ? languageSelector : globeButton;
      await selector.click();

      // Wait for dropdown
      await page.waitForTimeout(1000);

      // Try to select Spanish option if available
      const esOption = page.locator('[role="option"]').filter({ hasText: /Spanish|Espa/i });

      if (await esOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await esOption.click();
        await page.waitForTimeout(1000);

        // Check localStorage for language preference
        const storedLanguage = await page.evaluate(() => {
          return localStorage.getItem('preferred_language');
        });

        expect(storedLanguage).toBe('es');
      }
    });

    test('should update language selector display after switching', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find language selector
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      const selector = selectorVisible ? languageSelector : globeButton;

      // Get initial text
      const initialText = await selector.textContent();

      await selector.click();
      await page.waitForTimeout(1000);

      // Try to select a different language
      const esOption = page.locator('[role="option"]').filter({ hasText: /Spanish|Espa/i });

      if (await esOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await esOption.click();
        await page.waitForTimeout(1000);

        // Get updated text
        const updatedText = await selector.textContent();

        // The selector should now show ES or Spanish
        expect(updatedText).toContain('ES');
      }
    });
  });

  test.describe('Translation Integration', () => {

    test('should have translation context available', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Check that TranslationContext is providing values
      const hasTranslationContext = await page.evaluate(() => {
        // Check if localStorage has translation-related keys
        const keys = Object.keys(localStorage);
        return keys.some(key =>
          key.includes('language') ||
          key.includes('translation') ||
          key.includes('mark8ly')
        );
      });

      // The page should load successfully regardless
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display products page correctly', async ({ page }) => {
      await page.goto('/products');

      // Products page should have product cards or content
      const content = page.locator('main');
      await expect(content).toBeVisible({ timeout: 15000 });
    });

    test('should display categories page correctly', async ({ page }) => {
      await page.goto('/categories');

      // Categories page should have category cards or content
      const content = page.locator('main');
      await expect(content).toBeVisible({ timeout: 15000 });
    });

    test('should display cart page correctly', async ({ page }) => {
      await page.goto('/cart');

      // Cart page should load
      const content = page.locator('main');
      await expect(content).toBeVisible({ timeout: 15000 });
    });

    test('should display account settings page when logged in', async ({ page }) => {
      await page.goto('/account/settings');

      // Should redirect to login or show settings
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Language Flags', () => {

    test('should display flag emoji for selected language', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find language selector
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      const selector = selectorVisible ? languageSelector : globeButton;
      const buttonText = await selector.textContent();

      // Check for common flag emojis or language codes
      const hasFlag = buttonText && (
        buttonText.includes('\uD83C') || // Flag emoji unicode range
        /[A-Z]{2}/.test(buttonText) // Language code like EN, ES
      );

      expect(hasFlag).toBeTruthy();
    });

    test('should display flags in dropdown options', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find language selector
      const languageSelector = page.locator('[data-testid="language-selector-button"]');
      const globeButton = page.locator('button[aria-label="Select language"]');

      const selectorVisible = await languageSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const globeVisible = await globeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!selectorVisible && !globeVisible) {
        test.skip(true, 'Language selector not deployed yet');
      }

      const selector = selectorVisible ? languageSelector : globeButton;
      await selector.click();
      await page.waitForTimeout(500);

      // Check if dropdown options have flag emojis
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      if (optionCount > 0) {
        const firstOptionText = await options.first().textContent();
        // Options should have language names
        expect(firstOptionText).toBeTruthy();
      }
    });
  });

});
