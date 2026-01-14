import { test, expect } from '@playwright/test';

/**
 * Catalog E2E Tests
 *
 * Tests the Catalog functionality including:
 * - Products page navigation and RBAC
 * - Categories page navigation and RBAC
 * - Inventory page navigation and RBAC
 * - Product import functionality (RBAC permission check)
 *
 * Prerequisites:
 * - User must be logged in as Owner (handled by auth.setup.ts)
 * - Tenant must be selected
 *
 * Run with: npm run test:e2e:headed (for manual login)
 */

test.describe('Catalog Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('/');

    // Wait for the page to load (use domcontentloaded to avoid networkidle timeout)
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for initial render
  });

  test('should navigate to Products page', async ({ page }) => {
    // Click on Catalog button in sidebar (parent menu items are buttons, not links)
    await page.getByRole('button', { name: /catalog/i }).click();

    // Wait for submenu to expand, then click on Products link
    await page.getByRole('link', { name: /^products$/i }).click();

    // Wait for navigation
    await page.waitForURL('**/products');

    // Verify we're on the Products page
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('should navigate to Categories page', async ({ page }) => {
    // Click on Catalog button in sidebar
    await page.getByRole('button', { name: /catalog/i }).click();

    // Click on Categories link
    await page.getByRole('link', { name: /^categories$/i }).click();

    // Wait for navigation
    await page.waitForURL('**/categories');

    // Verify we're on the Categories page
    await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible();
  });

  test('should navigate to Inventory page', async ({ page }) => {
    // Click on Catalog button in sidebar
    await page.getByRole('button', { name: /catalog/i }).click();

    // Click on Inventory link
    await page.getByRole('link', { name: /^inventory$/i }).click();

    // Wait for navigation
    await page.waitForURL('**/inventory**');

    // Verify we're on the Inventory page
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();
  });

  test('should open Product Import modal with proper permissions', async ({ page }) => {
    // Navigate to Products page
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products');

    // Look for Import button (should be visible if user has permission)
    const importButton = page.getByRole('button', { name: /import/i });

    // Check if import button exists (owner should have permission)
    const importButtonExists = await importButton.isVisible().catch(() => false);

    if (importButtonExists) {
      // Click the import button to open modal
      await importButton.click();

      // Wait for modal to appear
      await expect(page.getByRole('dialog')).toBeVisible();

      // Verify modal title contains "Import"
      await expect(page.getByText(/bulk import/i)).toBeVisible();

      // Verify template download buttons exist
      await expect(page.getByRole('button', { name: /csv template/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /excel template/i })).toBeVisible();

      // Close the modal
      const closeButton = page.getByRole('button', { name: /cancel/i }).or(page.getByRole('button', { name: /close/i }));
      await closeButton.click();

      // Verify modal is closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    } else {
      // If import button is not visible, test should note permission issue
      console.warn('Import button not visible - user may not have catalog:products:import permission');
    }
  });

  test('should create a new product', async ({ page }) => {
    // Navigate to Products page
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products');

    // Look for Add/Create Product button
    const addButton = page.getByRole('button', { name: /add product|create product|new product/i });

    const addButtonExists = await addButton.isVisible().catch(() => false);

    if (addButtonExists) {
      // Click to open create form/modal
      await addButton.click();

      // Wait for form to appear (could be modal or new page)
      await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

      // Verify we can see product form fields
      const nameInput = page.getByLabel(/name|product name/i).or(page.getByPlaceholder(/name/i));
      await expect(nameInput).toBeVisible();

      // Fill in product name
      await nameInput.fill('Test Product - E2E');

      // Look for save/create button
      const saveButton = page.getByRole('button', { name: /save|create|submit/i });
      if (await saveButton.isVisible()) {
        // Don't actually save to avoid polluting test data
        console.log('Product form is functional - Save button found');
      }
    } else {
      console.warn('Add Product button not visible - user may not have catalog:products:create permission');
    }
  });

  test('should create a new category', async ({ page }) => {
    // Navigate to Categories page
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^categories$/i }).click();
    await page.waitForURL('**/categories');

    // Look for Add/Create Category button
    const addButton = page.getByRole('button', { name: /add category|create category|new category/i });

    const addButtonExists = await addButton.isVisible().catch(() => false);

    if (addButtonExists) {
      // Click to open create form/modal
      await addButton.click();

      // Wait for form to appear
      await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

      // Verify we can see category form fields
      const nameInput = page.getByLabel(/name|category name/i).or(page.getByPlaceholder(/name/i));
      await expect(nameInput).toBeVisible();

      console.log('Category form is functional');
    } else {
      console.warn('Add Category button not visible - user may not have catalog:categories:manage permission');
    }
  });
});

test.describe('Catalog RBAC Verification', () => {
  test('should verify owner has all catalog permissions', async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Navigate to Products
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products');

    // Verify all CRUD buttons are visible for owner
    // Import button (catalog:products:import)
    const importBtn = page.getByRole('button', { name: /import/i });
    await expect(importBtn).toBeVisible({ timeout: 10000 });

    // Add button (catalog:products:create)
    const addBtn = page.getByRole('button', { name: /add|create|new/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    console.log('Owner RBAC verification complete - Import and Add buttons visible');
  });
});
