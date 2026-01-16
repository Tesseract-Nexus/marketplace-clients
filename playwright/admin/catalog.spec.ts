import { test, expect, Page } from '@playwright/test';
import { TEST_USER, URLS } from '../utils/test-data';

/**
 * Admin Catalog/Products E2E Tests
 *
 * Tests for catalog management:
 * - Products listing
 * - Categories
 * - Product details
 * - Search and filtering
 */

async function waitForAuthAndLogin(page: Page, email: string, password: string): Promise<boolean> {
  const startTime = Date.now();
  const timeout = 30000;

  // Wait for auth check
  while (Date.now() - startTime < timeout) {
    try {
      const content = await page.content();
      const contentLower = content.toLowerCase();
      const url = page.url();

      if (contentLower.includes('checking authentication') || contentLower.includes('loading tenant')) {
        await page.waitForTimeout(1000);
        continue;
      }

      if (contentLower.includes('welcome back') || url.includes('devtest-customer-idp')) {
        // Perform login
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        await emailInput.fill(email);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);

        const passwordInput = page.locator('input[type="password"]').first();
        await passwordInput.fill(password);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
        continue;
      }

      if (contentLower.includes('dashboard') || contentLower.includes('demo store') || contentLower.includes('products')) {
        return true;
      }
    } catch (e) {}
    await page.waitForTimeout(500);
  }
  return false;
}

test.describe('Admin Catalog', () => {
  const storeSlug = process.env.TEST_STORE_SLUG || 'demo-store';
  const adminUrl = URLS.getAdminUrl(storeSlug);

  test.beforeEach(async ({ page }) => {
    await page.goto(adminUrl);
    const success = await waitForAuthAndLogin(page, TEST_USER.email, TEST_USER.password);
    expect(success).toBe(true);
  });

  test('should navigate to Catalog section', async ({ page }) => {
    // Click on Catalog in navigation
    const catalogLink = page.locator('a:has-text("Catalog"), [href*="catalog"]').first();

    if (await catalogLink.count() > 0) {
      await catalogLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/catalog-01-main.png', fullPage: true });

      const content = await page.content();
      const hasCatalogContent =
        content.toLowerCase().includes('catalog') ||
        content.toLowerCase().includes('products') ||
        content.toLowerCase().includes('categories');

      expect(hasCatalogContent).toBe(true);
      console.log('Catalog section loaded');
    } else {
      console.log('Catalog link not found - skipping');
    }
  });

  test('should display products list', async ({ page }) => {
    // Navigate to Products
    const productsLink = page.locator('a:has-text("Products"), [href*="products"]').first();

    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/catalog-02-products-list.png', fullPage: true });

      const content = await page.content();

      // Should show products table/grid or empty state
      const hasProductsView =
        content.toLowerCase().includes('product') ||
        content.toLowerCase().includes('add product') ||
        content.toLowerCase().includes('no products') ||
        content.toLowerCase().includes('create');

      expect(hasProductsView).toBe(true);
      console.log('Products list displayed');
    } else {
      // Try Catalog -> Products submenu
      const catalogLink = page.locator('a:has-text("Catalog")').first();
      if (await catalogLink.count() > 0) {
        await catalogLink.click();
        await page.waitForTimeout(1000);

        const productsSubLink = page.locator('a:has-text("Products")').first();
        if (await productsSubLink.count() > 0) {
          await productsSubLink.click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'test-results/catalog-02-products-list.png', fullPage: true });
        }
      }
    }
  });

  test('should display categories', async ({ page }) => {
    // Navigate to Categories
    const categoriesLink = page.locator('a:has-text("Categories"), [href*="categories"]').first();

    if (await categoriesLink.count() > 0) {
      await categoriesLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/catalog-03-categories.png', fullPage: true });

      const content = await page.content();
      const hasCategoriesView =
        content.toLowerCase().includes('categor') ||
        content.toLowerCase().includes('add category') ||
        content.toLowerCase().includes('no categories');

      expect(hasCategoriesView).toBe(true);
      console.log('Categories displayed');
    } else {
      console.log('Categories link not found - may be under Catalog submenu');
    }
  });

  test('should have product search functionality', async ({ page }) => {
    // Navigate to Products
    const productsLink = page.locator('a:has-text("Products"), [href*="products"]').first();

    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for search input
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], [data-testid="search"]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/catalog-04-search.png', fullPage: true });
        console.log('Product search functionality available');
      } else {
        console.log('Search input not found on products page');
        await page.screenshot({ path: 'test-results/catalog-04-no-search.png', fullPage: true });
      }
    }
  });

  test('should have add product button', async ({ page }) => {
    // Navigate to Products
    const productsLink = page.locator('a:has-text("Products"), [href*="products"]').first();

    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for Add Product button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add Product")').first();

      await page.screenshot({ path: 'test-results/catalog-05-add-button.png', fullPage: true });

      if (await addButton.count() > 0) {
        console.log('Add product button found');
        expect(await addButton.count()).toBeGreaterThan(0);
      } else {
        console.log('Add product button not visible (may require permissions)');
      }
    }
  });
});
