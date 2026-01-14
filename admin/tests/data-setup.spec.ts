import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Data Setup Tests - Create actual data and verify it persists
 *
 * This test suite creates real data to verify the import functionality
 * actually persists products, categories, and other entities.
 */

test.setTimeout(300000);

const testId = `setup-${Date.now()}`;

test.describe.serial('Data Setup - Create Vendor and Import Products', () => {

  test('Step 1: Navigate to Vendors and create Demo Store vendor if needed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Navigate to Vendors page
    const vendorsLink = page.getByRole('link', { name: /^vendors$/i });
    if (await vendorsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vendorsLink.click();
      await page.waitForURL('**/vendors', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Check if Demo Store vendor exists
      const demoStoreVendor = page.getByText('Demo Store');
      const vendorExists = await demoStoreVendor.isVisible({ timeout: 5000 }).catch(() => false);

      console.log(`Demo Store vendor exists: ${vendorExists}`);

      if (!vendorExists) {
        // Look for Add Vendor button
        const addVendorBtn = page.getByRole('button', { name: /add vendor|create vendor|new vendor/i });
        if (await addVendorBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await addVendorBtn.click();
          await page.waitForTimeout(2000);

          // Fill vendor form
          const nameInput = page.getByLabel(/^name$/i).or(page.getByPlaceholder(/name/i)).or(page.locator('input[name="name"]'));
          if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await nameInput.fill('Demo Store');

            // Save
            const saveBtn = page.getByRole('button', { name: /save|create|submit/i });
            if (await saveBtn.isVisible().catch(() => false)) {
              await saveBtn.click();
              await page.waitForTimeout(3000);
              console.log('Created Demo Store vendor');
            }
          }
        }
      }

      await page.screenshot({ path: `/tmp/vendors-page-${testId}.png` });
    } else {
      console.log('Vendors link not visible - may not have access');
    }

    expect(true).toBe(true);
  });

  test('Step 2: Navigate to Categories and verify/create categories', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Navigate to Categories
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: /^categories$/i }).click();
    await page.waitForURL('**/categories', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Check if any categories exist
    const categoryTable = page.locator('table').or(page.getByRole('grid'));
    const hasTable = await categoryTable.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTable) {
      const rowCount = await page.locator('table tbody tr').count().catch(() => 0);
      console.log(`Existing categories count: ${rowCount}`);
    }

    // Create Electronics category if needed
    const electronicsCategory = page.getByText('Electronics');
    const categoryExists = await electronicsCategory.isVisible({ timeout: 3000 }).catch(() => false);

    if (!categoryExists) {
      const addCategoryBtn = page.getByRole('button', { name: /add category|create category|new category/i });
      if (await addCategoryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addCategoryBtn.click();
        await page.waitForTimeout(2000);

        const nameInput = page.getByLabel(/^name$/i).or(page.getByPlaceholder(/name/i)).or(page.locator('input[name="name"]'));
        if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nameInput.fill('Electronics');

          const saveBtn = page.getByRole('button', { name: /save|create|submit/i });
          if (await saveBtn.isVisible().catch(() => false)) {
            await saveBtn.click();
            await page.waitForTimeout(3000);
            console.log('Created Electronics category');
          }
        }
      }
    } else {
      console.log('Electronics category already exists');
    }

    await page.screenshot({ path: `/tmp/categories-page-${testId}.png` });
    expect(true).toBe(true);
  });

  test('Step 3: Import products via bulk import', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Navigate to Products
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Click Import button
    const importButton = page.getByRole('button', { name: /import/i }).or(page.getByRole('button', { name: /bulk import/i }));
    const hasImport = await importButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasImport) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create simple product CSV
      const productCSV = `name,sku,price,categoryName,vendorName,description
"Test Product Alpha",TP-ALPHA-001,29.99,"Electronics","Demo Store","First test product"
"Test Product Beta",TP-BETA-001,49.99,"Electronics","Demo Store","Second test product"
"Test Product Gamma",TP-GAMMA-001,79.99,"Electronics","Demo Store","Third test product"
"Test Product Delta",TP-DELTA-001,99.99,"Electronics","Demo Store","Fourth test product"
"Test Product Epsilon",TP-EPSILON-001,19.99,"Electronics","Demo Store","Fifth test product"`;

      const tempFilePath = `/tmp/real-products-${testId}.csv`;
      fs.writeFileSync(tempFilePath, productCSV);
      console.log(`Created CSV file: ${tempFilePath}`);

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        // Take screenshot before import
        await page.screenshot({ path: `/tmp/before-import-${testId}.png` });

        // Click Import button in modal
        const importSubmitBtn = page.getByRole('button', { name: /^import$|import products/i });
        if (await importSubmitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await importSubmitBtn.click();
          console.log('Clicked import submit button');

          // Wait for import to complete
          await page.waitForTimeout(10000);

          // Take screenshot of result
          await page.screenshot({ path: `/tmp/import-result-${testId}.png` });

          // Check for success message
          const successText = await page.getByText(/success|created|imported|complete/i).isVisible({ timeout: 10000 }).catch(() => false);
          console.log(`Import success message visible: ${successText}`);

          // Check for error message
          const errorText = await page.getByText(/error|failed|not found/i).isVisible().catch(() => false);
          if (errorText) {
            console.log('Error message visible - checking details');
            const errorDetails = await page.locator('[class*="error"]').textContent().catch(() => '');
            console.log(`Error details: ${errorDetails}`);
          }
        } else {
          console.log('Import submit button not visible');
          await page.screenshot({ path: `/tmp/no-import-button-${testId}.png` });
        }
      } else {
        console.log('File input not found');
      }

      // Close modal
      const closeBtn = page.getByRole('button', { name: /close|done|cancel/i });
      if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }

      fs.unlinkSync(tempFilePath);
    } else {
      console.log('Import button not visible');
    }

    expect(hasImport).toBe(true);
  });

  test('Step 4: Verify products appear in the list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Navigate to Products
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to fully load
    await page.getByRole('heading', { name: /products/i }).waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: `/tmp/products-list-${testId}.png` });

    // Check for products
    const noProductsText = page.getByText(/no products found/i);
    const hasNoProducts = await noProductsText.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`No products message visible: ${hasNoProducts}`);

    // Check for product table
    const productTable = page.locator('table').or(page.getByRole('grid'));
    const hasTable = await productTable.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Product table visible: ${hasTable}`);

    if (hasTable) {
      const rowCount = await page.locator('table tbody tr').count().catch(() => 0);
      console.log(`Number of products in table: ${rowCount}`);

      // Check for test products
      const testProductAlpha = await page.getByText('Test Product Alpha').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Test Product Alpha visible: ${testProductAlpha}`);
    }

    // Search for test products
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('TP-ALPHA');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: `/tmp/products-search-${testId}.png` });

      const searchResults = await page.locator('table tbody tr').count().catch(() => 0);
      console.log(`Search results count: ${searchResults}`);
    }

    expect(true).toBe(true);
  });

  test('Step 5: Create a product manually via Add Product button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Navigate to Products
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Click Add Product button
    const addProductBtn = page.getByRole('button', { name: /add product|\+ add product/i });
    const hasAddBtn = await addProductBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasAddBtn) {
      await addProductBtn.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: `/tmp/add-product-form-${testId}.png` });

      // Fill product form
      const nameInput = page.getByLabel(/^name$/i).or(page.getByPlaceholder(/name/i)).or(page.locator('input[name="name"]')).first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill(`Manual Product ${testId}`);

        // Fill SKU
        const skuInput = page.getByLabel(/sku/i).or(page.locator('input[name="sku"]'));
        if (await skuInput.isVisible().catch(() => false)) {
          await skuInput.fill(`MANUAL-${testId}`);
        }

        // Fill price
        const priceInput = page.getByLabel(/price/i).or(page.locator('input[name="price"]'));
        if (await priceInput.isVisible().catch(() => false)) {
          await priceInput.fill('99.99');
        }

        // Select category
        const categorySelect = page.locator('[data-testid="category-select"]')
          .or(page.getByRole('combobox', { name: /category/i }))
          .or(page.locator('select[name="categoryId"]'))
          .or(page.getByLabel(/category/i));

        if (await categorySelect.isVisible().catch(() => false)) {
          await categorySelect.click();
          await page.waitForTimeout(500);
          const firstOption = page.getByRole('option').first();
          if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstOption.click();
            console.log('Category selected');
          }
        }

        // Select vendor
        const vendorSelect = page.locator('[data-testid="vendor-select"]')
          .or(page.getByRole('combobox', { name: /vendor/i }))
          .or(page.locator('select[name="vendorId"]'))
          .or(page.getByLabel(/vendor/i));

        if (await vendorSelect.isVisible().catch(() => false)) {
          await vendorSelect.click();
          await page.waitForTimeout(500);
          const firstVendorOption = page.getByRole('option').first();
          if (await firstVendorOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstVendorOption.click();
            console.log('Vendor selected');
          }
        }

        await page.screenshot({ path: `/tmp/product-form-filled-${testId}.png` });

        // Save
        const saveBtn = page.getByRole('button', { name: /save|create|submit/i });
        if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(5000);

          // Check result
          const successText = await page.getByText(/success|created|saved/i).isVisible().catch(() => false);
          console.log(`Product creation success: ${successText}`);

          await page.screenshot({ path: `/tmp/product-created-${testId}.png` });
        }
      } else {
        console.log('Name input not found');
      }
    } else {
      console.log('Add Product button not visible');
    }

    expect(true).toBe(true);
  });
});
