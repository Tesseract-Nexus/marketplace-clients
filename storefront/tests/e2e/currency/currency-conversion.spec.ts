import { test, expect } from '@playwright/test';

/**
 * Currency Conversion E2E Tests
 *
 * Tests the currency conversion functionality on the deployed storefront.
 */

test.describe('Currency Conversion', () => {

  test.describe('Currency Selector', () => {

    test('should display currency selector in header', async ({ page }) => {
      await page.goto('/');

      // Look for currency selector button
      const currencySelector = page.locator('button').filter({
        hasText: /USD|EUR|GBP|AUD|INR|CAD/
      }).first();

      await expect(currencySelector).toBeVisible({ timeout: 15000 });
    });

    test('should open dropdown and show options when clicked', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);

      // Find currency selector by aria-label
      const currencySelector = page.locator('button[aria-label="Select currency"]');
      const fallbackSelector = page.locator('button').filter({
        hasText: /USD|EUR|GBP|AUD|INR|CAD|\$|€|£|₹/
      }).first();

      // Use whichever selector is visible
      const selectorVisible = await currencySelector.isVisible({ timeout: 5000 }).catch(() => false);
      const selector = selectorVisible ? currencySelector : fallbackSelector;

      await expect(selector).toBeVisible({ timeout: 15000 });

      // Click and wait for animation
      await selector.click();
      await page.waitForTimeout(1500);

      // Look for any dropdown content
      const dropdown = page.locator('[role="listbox"]');
      const options = page.locator('[role="option"]');
      const currencyItems = page.locator('button').filter({ hasText: /USD|EUR|GBP|INR/ });

      // Check for dropdown visibility with multiple selectors
      const dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
      const optionsVisible = await options.first().isVisible({ timeout: 3000 }).catch(() => false);
      const itemsVisible = await currencyItems.first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(dropdownVisible || optionsVisible || itemsVisible).toBeTruthy();
    });
  });

  test.describe('Currency Switching', () => {

    test('should persist currency selection in localStorage', async ({ page }) => {
      await page.goto('/');

      // Find and click currency selector
      const currencySelector = page.locator('button').filter({
        hasText: /USD|EUR|GBP|AUD|INR|\$|€|£|₹/
      }).first();

      await expect(currencySelector).toBeVisible({ timeout: 15000 });
      await currencySelector.click();

      // Wait for dropdown
      await page.waitForTimeout(1000);

      // Select EUR option if available
      const eurOption = page.locator('[role="option"]').filter({ hasText: /EUR/ });

      if (await eurOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await eurOption.click();
        await page.waitForTimeout(500);

        // Check localStorage
        const storedCurrency = await page.evaluate(() => {
          return localStorage.getItem('tesserix-display-currency');
        });

        expect(storedCurrency).toBe('EUR');
      }
    });
  });

  test.describe('Price Display', () => {

    test('should display prices on products page', async ({ page }) => {
      await page.goto('/products');

      // Look for price elements (currency symbols or formatted prices)
      const priceElements = page.locator('text=/\\$|€|£|₹|A\\$|C\\$/').first();

      // Products page should have some prices visible
      await expect(priceElements).toBeVisible({ timeout: 15000 });
    });

    test('should display prices on product detail page', async ({ page }) => {
      // First go to products page
      await page.goto('/products');

      // Click on first product link
      const productLink = page.locator('a[href*="/products/"]').first();

      if (await productLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await productLink.click();

        // Product detail page should have price
        const priceElements = page.locator('text=/\\$|€|£|₹|[0-9]+\\.[0-9]{2}/').first();
        await expect(priceElements).toBeVisible({ timeout: 10000 });
      }
    });
  });

});
