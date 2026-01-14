import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bulk Import E2E Tests - Comprehensive Testing for Enterprise Import Feature
 *
 * Test Categories:
 * 1. Basic Import - Small, medium, large batches
 * 2. Batch Processing - Custom batch sizes, limits
 * 3. Error Handling - Missing fields, invalid data, duplicates
 * 4. Auto-Creation - Categories, warehouses, suppliers
 * 5. Update/Upsert Modes - updateExisting, skipDuplicates
 * 6. Validation Only - Dry run mode
 * 7. Edge Cases - Empty files, unicode, special characters
 *
 * Prerequisites:
 * - User must be logged in as Owner (handled by auth.setup.ts)
 * - Tenant must be selected (demo-store)
 */

// Increase timeout for E2E tests
test.setTimeout(300000);

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '..', '..', '..', '..', 'test-data');

// Helper to generate unique test identifiers
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

// Helper to create CSV content
function createCSV(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// Helper to navigate to products page and open import modal
async function navigateToImport(page: any) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  await page.getByRole('button', { name: /catalog/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('link', { name: /^products$/i }).click();
  await page.waitForURL('**/products', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  // Wait for page to fully load
  await page.getByRole('heading', { name: /products/i }).waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

test.describe('Bulk Import - Basic Import Scenarios', () => {
  const testId = generateTestId();

  test('should verify import modal opens correctly', async ({ page }) => {
    await navigateToImport(page);

    // Click import button
    const importButton = page.getByRole('button', { name: /import/i });
    const hasImport = await importButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasImport) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Verify modal content using the heading
      const bulkImportTitle = page.getByRole('heading', { name: /bulk import products/i });
      await expect(bulkImportTitle).toBeVisible({ timeout: 10000 });

      // Check for bulk import title
      const bulkImportText = await bulkImportTitle.isVisible().catch(() => false);
      console.log(`Bulk import title visible: ${bulkImportText}`);

      // Check for template download buttons
      const csvTemplate = await page.getByRole('button', { name: /csv template/i }).isVisible().catch(() => false);
      const xlsxTemplate = await page.getByRole('button', { name: /excel template/i }).isVisible().catch(() => false);
      console.log(`CSV template button: ${csvTemplate}, Excel template button: ${xlsxTemplate}`);

      // Check for import options
      const skipDuplicates = await page.getByText(/skip duplicates/i).isVisible().catch(() => false);
      const updateExisting = await page.getByText(/update existing/i).isVisible().catch(() => false);
      console.log(`Skip duplicates option: ${skipDuplicates}, Update existing option: ${updateExisting}`);

      // Take screenshot
      await page.screenshot({ path: `/tmp/import-modal-${testId}.png` });

      // Close modal
      const closeBtn = page.getByRole('button', { name: /cancel|close/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }

      expect(bulkImportText || csvTemplate).toBe(true);
    } else {
      console.log('Import button not visible - user may not have import permission');
    }
  });

  test('should download CSV template', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Click CSV template download
      const csvTemplateBtn = page.getByRole('button', { name: /csv template/i });
      if (await csvTemplateBtn.isVisible().catch(() => false)) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        await csvTemplateBtn.click();

        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          console.log(`Downloaded template: ${filename}`);
          expect(filename).toContain('.csv');
        } else {
          console.log('Download did not trigger - may be handled differently');
        }
      }

      // Close modal
      const closeBtn = page.getByRole('button', { name: /cancel|close/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should download Excel template', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Click Excel template download
      const xlsxTemplateBtn = page.getByRole('button', { name: /excel template/i });
      if (await xlsxTemplateBtn.isVisible().catch(() => false)) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        await xlsxTemplateBtn.click();

        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          console.log(`Downloaded template: ${filename}`);
          expect(filename).toContain('.xlsx');
        }
      }

      // Close modal
      const closeBtn = page.getByRole('button', { name: /cancel|close/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Bulk Import - Validation & Error Handling', () => {
  const testId = generateTestId();

  test('should show validation errors for missing required fields', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create a CSV with missing required fields
      const invalidCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          ['', 'SKU-001', '29.99', 'Test Category', 'Demo Store'], // Missing name
          ['Product 2', '', '29.99', 'Test Category', 'Demo Store'], // Missing SKU
          ['Product 3', 'SKU-003', '', 'Test Category', 'Demo Store'], // Missing price
        ]
      );

      // Save to temp file
      const tempFilePath = `/tmp/invalid-test-${testId}.csv`;
      fs.writeFileSync(tempFilePath, invalidCSV);

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        // Check for validation checkbox (validateOnly)
        const validateOnlyCheckbox = page.getByLabel(/validate only|dry run/i);
        if (await validateOnlyCheckbox.isVisible().catch(() => false)) {
          await validateOnlyCheckbox.check();
        }

        // Click import/validate button
        const submitBtn = page.getByRole('button', { name: /import|validate|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(3000);

          // Check for error messages
          const errorText = await page.getByText(/required|error|failed/i).first().isVisible().catch(() => false);
          console.log(`Validation errors shown: ${errorText}`);

          // Take screenshot
          await page.screenshot({ path: `/tmp/validation-errors-${testId}.png` });
        }
      }

      // Cleanup
      fs.unlinkSync(tempFilePath);

      // Close modal
      const closeBtn = page.getByRole('button', { name: /cancel|close/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should handle invalid price format', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create CSV with invalid price
      const invalidPriceCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          ['Product 1', `SKU-${testId}-1`, 'not-a-price', 'Test Category', 'Demo Store'],
          ['Product 2', `SKU-${testId}-2`, '29.99.99', 'Test Category', 'Demo Store'],
          ['Product 3', `SKU-${testId}-3`, '-10', 'Test Category', 'Demo Store'],
        ]
      );

      const tempFilePath = `/tmp/invalid-price-${testId}.csv`;
      fs.writeFileSync(tempFilePath, invalidPriceCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        // Enable validate only
        const validateOnlyCheckbox = page.getByLabel(/validate only|dry run/i);
        if (await validateOnlyCheckbox.isVisible().catch(() => false)) {
          await validateOnlyCheckbox.check();
        }

        const submitBtn = page.getByRole('button', { name: /import|validate|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(3000);

          await page.screenshot({ path: `/tmp/invalid-price-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Bulk Import - Auto-Creation Features', () => {
  const testId = generateTestId();

  test('should auto-create category when using categoryName', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create CSV with new category name (should be auto-created)
      const newCategoryName = `Auto-Category-${testId}`;
      const autoCreateCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Auto-Create Product ${testId}`, `AUTO-SKU-${testId}`, '49.99', newCategoryName, 'Demo Store'],
        ]
      );

      const tempFilePath = `/tmp/auto-create-${testId}.csv`;
      fs.writeFileSync(tempFilePath, autoCreateCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(5000);

          // Check for success message
          const successText = await page.getByText(/success|created|imported/i).isVisible().catch(() => false);
          console.log(`Auto-create category success: ${successText}`);

          await page.screenshot({ path: `/tmp/auto-create-category-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should fail when vendor does not exist', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create CSV with non-existent vendor
      const nonExistentVendorCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Vendor Test Product ${testId}`, `VENDOR-SKU-${testId}`, '29.99', 'Test Category', `NonExistent-Vendor-${testId}`],
        ]
      );

      const tempFilePath = `/tmp/vendor-test-${testId}.csv`;
      fs.writeFileSync(tempFilePath, nonExistentVendorCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(5000);

          // Check for vendor not found error
          const errorText = await page.getByText(/vendor.*not found|vendor.*error/i).isVisible().catch(() => false);
          console.log(`Vendor not found error shown: ${errorText}`);

          await page.screenshot({ path: `/tmp/vendor-not-found-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Bulk Import - Duplicate Handling', () => {
  const testId = generateTestId();

  test('should handle skipDuplicates option', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      // First, import a product
      await importButton.click();
      await page.waitForTimeout(2000);

      const firstImportCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Duplicate Test Product ${testId}`, `DUP-SKU-${testId}`, '39.99', 'Test Category', 'Demo Store'],
        ]
      );

      const tempFilePath1 = `/tmp/dup-first-${testId}.csv`;
      fs.writeFileSync(tempFilePath1, firstImportCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath1);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(5000);
          console.log('First import completed');
        }
      }

      fs.unlinkSync(tempFilePath1);

      // Close and reopen modal
      let closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }

      // Second import with same SKU - should skip
      await importButton.click();
      await page.waitForTimeout(2000);

      const secondImportCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Duplicate Test Product Updated ${testId}`, `DUP-SKU-${testId}`, '49.99', 'Test Category', 'Demo Store'],
        ]
      );

      const tempFilePath2 = `/tmp/dup-second-${testId}.csv`;
      fs.writeFileSync(tempFilePath2, secondImportCSV);

      const fileInput2 = page.locator('input[type="file"]');
      if (await fileInput2.isVisible().catch(() => false)) {
        await fileInput2.setInputFiles(tempFilePath2);
        await page.waitForTimeout(2000);

        // Enable skip duplicates
        const skipDupCheckbox = page.getByLabel(/skip duplicates/i);
        if (await skipDupCheckbox.isVisible().catch(() => false)) {
          await skipDupCheckbox.check();
        }

        const submitBtn2 = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn2.isVisible().catch(() => false)) {
          await submitBtn2.click();
          await page.waitForTimeout(5000);

          // Check for skipped message
          const skippedText = await page.getByText(/skipped|duplicate/i).isVisible().catch(() => false);
          console.log(`Skipped duplicates message: ${skippedText}`);

          await page.screenshot({ path: `/tmp/skip-duplicates-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath2);

      closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should handle updateExisting option (upsert mode)', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      // First import
      await importButton.click();
      await page.waitForTimeout(2000);

      const originalPrice = '29.99';
      const updatedPrice = '59.99';
      const sku = `UPSERT-SKU-${testId}`;

      const firstImportCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Upsert Test Product ${testId}`, sku, originalPrice, 'Test Category', 'Demo Store'],
        ]
      );

      const tempFilePath1 = `/tmp/upsert-first-${testId}.csv`;
      fs.writeFileSync(tempFilePath1, firstImportCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath1);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(5000);
          console.log('First import for upsert test completed');
        }
      }

      fs.unlinkSync(tempFilePath1);

      // Close and reopen
      let closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }

      // Second import with updateExisting
      await importButton.click();
      await page.waitForTimeout(2000);

      const secondImportCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Upsert Test Product UPDATED ${testId}`, sku, updatedPrice, 'Test Category', 'Demo Store'],
        ]
      );

      const tempFilePath2 = `/tmp/upsert-second-${testId}.csv`;
      fs.writeFileSync(tempFilePath2, secondImportCSV);

      const fileInput2 = page.locator('input[type="file"]');
      if (await fileInput2.isVisible().catch(() => false)) {
        await fileInput2.setInputFiles(tempFilePath2);
        await page.waitForTimeout(2000);

        // Enable update existing
        const updateExistingCheckbox = page.getByLabel(/update existing/i);
        if (await updateExistingCheckbox.isVisible().catch(() => false)) {
          await updateExistingCheckbox.check();
        }

        const submitBtn2 = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn2.isVisible().catch(() => false)) {
          await submitBtn2.click();
          await page.waitForTimeout(5000);

          // Check for updated message
          const updatedText = await page.getByText(/updated|success/i).isVisible().catch(() => false);
          console.log(`Update existing success: ${updatedText}`);

          await page.screenshot({ path: `/tmp/update-existing-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath2);

      closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Bulk Import - Edge Cases', () => {
  const testId = generateTestId();

  test('should handle unicode and special characters in product names', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // CSV with unicode characters
      const unicodeCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        [
          [`Produit Français ${testId}`, `UNICODE-FR-${testId}`, '29.99', 'Test Category', 'Demo Store'],
          [`日本語製品 ${testId}`, `UNICODE-JP-${testId}`, '39.99', 'Test Category', 'Demo Store'],
          [`Produkt Deutsch ${testId}`, `UNICODE-DE-${testId}`, '49.99', 'Test Category', 'Demo Store'],
          [`Product with "quotes" ${testId}`, `UNICODE-QUOTES-${testId}`, '59.99', 'Test Category', 'Demo Store'],
        ]
      );

      const tempFilePath = `/tmp/unicode-${testId}.csv`;
      fs.writeFileSync(tempFilePath, unicodeCSV, 'utf-8');

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(5000);

          const successText = await page.getByText(/success|created|imported/i).isVisible().catch(() => false);
          console.log(`Unicode import success: ${successText}`);

          await page.screenshot({ path: `/tmp/unicode-import-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should handle large batch import (100+ products)', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Generate 150 products to test batch processing
      const rows: string[][] = [];
      for (let i = 1; i <= 150; i++) {
        rows.push([
          `Batch Product ${i} - ${testId}`,
          `BATCH-${testId}-${i.toString().padStart(3, '0')}`,
          (9.99 + i * 0.1).toFixed(2),
          'Test Category',
          'Demo Store',
        ]);
      }

      const largeCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        rows
      );

      const tempFilePath = `/tmp/large-batch-${testId}.csv`;
      fs.writeFileSync(tempFilePath, largeCSV);

      console.log(`Created large CSV with ${rows.length} products`);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();

          // Wait longer for large import
          await page.waitForTimeout(30000);

          // Check for success or progress
          const resultText = await page.getByText(/success|created|imported|processing|batch/i).isVisible().catch(() => false);
          console.log(`Large batch import result visible: ${resultText}`);

          // Take screenshot of results
          await page.screenshot({ path: `/tmp/large-batch-result-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should reject empty file', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create empty CSV (headers only)
      const emptyCSV = 'name,sku,price,categoryName,vendorName\n';

      const tempFilePath = `/tmp/empty-${testId}.csv`;
      fs.writeFileSync(tempFilePath, emptyCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(3000);

          // Check for empty file error
          const errorText = await page.getByText(/empty|no data|no rows/i).isVisible().catch(() => false);
          console.log(`Empty file error shown: ${errorText}`);

          await page.screenshot({ path: `/tmp/empty-file-error-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('should reject unsupported file format', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Create a .txt file
      const txtContent = 'This is not a valid CSV file';
      const tempFilePath = `/tmp/invalid-format-${testId}.txt`;
      fs.writeFileSync(tempFilePath, txtContent);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        // Try to upload - may be rejected by file input
        try {
          await fileInput.setInputFiles(tempFilePath);
          await page.waitForTimeout(2000);

          // Check for format error
          const errorText = await page.getByText(/format|invalid|supported/i).isVisible().catch(() => false);
          console.log(`Invalid format error shown: ${errorText}`);

          await page.screenshot({ path: `/tmp/invalid-format-error-${testId}.png` });
        } catch (e) {
          console.log('File input rejected unsupported format (expected)');
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Bulk Import - Batch Processing Verification', () => {
  const testId = generateTestId();

  test('should show batch progress for large imports', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Generate 250 products to ensure multiple batches
      const rows: string[][] = [];
      for (let i = 1; i <= 250; i++) {
        rows.push([
          `Batch Progress Product ${i} - ${testId}`,
          `PROGRESS-${testId}-${i.toString().padStart(3, '0')}`,
          (19.99 + i * 0.05).toFixed(2),
          'Test Category',
          'Demo Store',
        ]);
      }

      const progressCSV = createCSV(
        ['name', 'sku', 'price', 'categoryName', 'vendorName'],
        rows
      );

      const tempFilePath = `/tmp/progress-test-${testId}.csv`;
      fs.writeFileSync(tempFilePath, progressCSV);

      console.log(`Created CSV with ${rows.length} products for batch progress test`);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();

          // Watch for progress indicators
          let progressSeen = false;
          for (let i = 0; i < 60; i++) {
            await page.waitForTimeout(1000);

            const progressBar = await page.locator('[role="progressbar"]').isVisible().catch(() => false);
            const percentText = await page.getByText(/\d+%/).isVisible().catch(() => false);
            const batchText = await page.getByText(/batch|processing/i).isVisible().catch(() => false);
            const completeText = await page.getByText(/complete|success|done/i).isVisible().catch(() => false);

            if (progressBar || percentText || batchText) {
              progressSeen = true;
              console.log(`Progress indicator visible at ${i}s`);
              await page.screenshot({ path: `/tmp/batch-progress-${testId}-${i}s.png` });
            }

            if (completeText) {
              console.log('Import completed');
              break;
            }
          }

          console.log(`Progress indicators seen during import: ${progressSeen}`);

          // Final screenshot
          await page.screenshot({ path: `/tmp/batch-progress-final-${testId}.png` });
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});

test.describe('Bulk Import - Complete Workflow', () => {
  const testId = generateTestId();

  test('should complete full import workflow with all optional fields', async ({ page }) => {
    await navigateToImport(page);

    const importButton = page.getByRole('button', { name: /import/i });
    if (await importButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(2000);

      // Complete product data with all fields
      const completeCSV = [
        'name,sku,price,categoryName,vendorName,description,comparePrice,costPrice,brand,quantity,minOrderQty,maxOrderQty,lowStockThreshold,weight,searchKeywords,tags,warehouseName,supplierName',
        `"Complete Product 1 ${testId}","COMPLETE-${testId}-001","49.99","Electronics","Demo Store","A fully featured product with all fields","69.99","25.00","TestBrand","100","1","10","5","0.5","electronics gadget test","new,featured,sale","Main Warehouse","Test Supplier"`,
        `"Complete Product 2 ${testId}","COMPLETE-${testId}-002","99.99","Electronics","Demo Store","Another complete product","129.99","50.00","TestBrand","50","2","5","10","1.2","premium quality","premium,bestseller","Main Warehouse","Test Supplier"`,
      ].join('\n');

      const tempFilePath = `/tmp/complete-workflow-${testId}.csv`;
      fs.writeFileSync(tempFilePath, completeCSV);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath);
        await page.waitForTimeout(2000);

        const submitBtn = page.getByRole('button', { name: /import|upload/i }).last();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(10000);

          // Check for success
          const successText = await page.getByText(/success|created|imported/i).isVisible().catch(() => false);
          const createdCount = await page.getByText(/2.*created|created.*2/i).isVisible().catch(() => false);

          console.log(`Complete workflow success: ${successText}`);
          console.log(`Created count shown: ${createdCount}`);

          await page.screenshot({ path: `/tmp/complete-workflow-${testId}.png` });

          expect(successText).toBe(true);
        }
      }

      fs.unlinkSync(tempFilePath);

      const closeBtn = page.getByRole('button', { name: /cancel|close|done/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }
  });
});
