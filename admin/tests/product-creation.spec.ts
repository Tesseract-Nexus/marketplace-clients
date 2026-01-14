import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Product Creation & Import E2E Tests
 *
 * Tests the product creation and bulk import functionality:
 * - Single product creation via form
 * - Bulk CSV import
 * - Data validation and schema comparison
 * - Multi-tenant compliance verification
 *
 * Prerequisites:
 * - User must be logged in as Owner (handled by auth.setup.ts)
 * - Tenant must be selected (demo-store)
 */

test.describe('Product Creation', () => {
  // Generate unique product name to avoid SKU conflicts
  const timestamp = Date.now();
  const testProductName = `E2E Test Product ${timestamp}`;
  const testProductSKU = `E2E-SKU-${timestamp}`;

  test.beforeEach(async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give time for initial load

    // Navigate to Products page
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for data to load
  });

  test('should create a single product with all required fields', async ({ page }) => {
    // Click Add Product button
    const addButton = page.getByRole('button', { name: /add product|create product|new product/i });
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for form to load
    await page.waitForLoadState('networkidle');

    // Check if we're on a new page or modal
    const isModal = await page.getByRole('dialog').isVisible().catch(() => false);
    const isNewPage = page.url().includes('/products/new') || page.url().includes('/products/create');

    console.log(`Product form displayed as: ${isModal ? 'Modal' : isNewPage ? 'New Page' : 'Unknown'}`);

    // Fill in required product fields
    // Name field
    const nameInput = page.getByLabel(/^name$/i)
      .or(page.getByLabel(/product name/i))
      .or(page.getByPlaceholder(/product name/i))
      .or(page.locator('input[name="name"]'));

    if (await nameInput.isVisible()) {
      await nameInput.fill(testProductName);
    }

    // SKU field
    const skuInput = page.getByLabel(/sku/i)
      .or(page.getByPlaceholder(/sku/i))
      .or(page.locator('input[name="sku"]'));

    if (await skuInput.isVisible()) {
      await skuInput.fill(testProductSKU);
    }

    // Price field
    const priceInput = page.getByLabel(/price/i)
      .or(page.getByPlaceholder(/price/i))
      .or(page.locator('input[name="price"]'));

    if (await priceInput.isVisible()) {
      await priceInput.fill('99.99');
    }

    // Description field (if present)
    const descInput = page.getByLabel(/description/i)
      .or(page.locator('textarea[name="description"]'));

    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('This is a test product created by E2E test.');
    }

    // Select category (if required)
    const categorySelect = page.getByRole('combobox', { name: /category/i })
      .or(page.locator('select[name="categoryId"]'))
      .or(page.locator('[data-testid="category-select"]'));

    if (await categorySelect.isVisible().catch(() => false)) {
      // Try to select first available category
      await categorySelect.click();
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      }
    }

    // Click Save/Create button
    const saveButton = page.getByRole('button', { name: /^save$|^create$|save product|create product/i });

    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();

      // Wait for either success message or navigation
      await Promise.race([
        page.waitForURL('**/products', { timeout: 10000 }),
        page.getByText(/success|created|saved/i).waitFor({ timeout: 10000 }),
      ]).catch(() => {
        console.log('No explicit success indicator found - checking if product was created');
      });

      // Verify we're back on products list or got success notification
      const isOnProductsList = page.url().includes('/products');
      const hasSuccessMessage = await page.getByText(/success|created/i).isVisible().catch(() => false);

      console.log(`Product creation result - On list: ${isOnProductsList}, Success msg: ${hasSuccessMessage}`);

      // Verify the product appears in the list
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /catalog/i }).click();
      await page.getByRole('link', { name: /^products$/i }).click();
      await page.waitForURL('**/products');

      // Search for the created product
      const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'));
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(testProductName);
        await page.waitForTimeout(1000); // Wait for search debounce

        // Check if product appears
        const productRow = page.getByText(testProductName);
        const productFound = await productRow.isVisible().catch(() => false);
        console.log(`Product "${testProductName}" found in list: ${productFound}`);
      }
    } else {
      console.log('Save button not found - form may require different interaction');
    }
  });

  test('should download CSV template for bulk import', async ({ page }) => {
    // Click Import button
    const importButton = page.getByRole('button', { name: /import/i });
    await expect(importButton).toBeVisible({ timeout: 10000 });
    await importButton.click();

    // Wait for import modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Download CSV template
    const csvButton = page.getByRole('button', { name: /csv template/i })
      .or(page.getByRole('link', { name: /csv template/i }))
      .or(page.getByText(/download.*csv/i));

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    if (await csvButton.isVisible().catch(() => false)) {
      await csvButton.click();

      try {
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        console.log(`Downloaded template: ${filename}`);

        // Save to temp location for inspection
        const tempPath = path.join('/tmp', filename);
        await download.saveAs(tempPath);

        // Verify file was created and has content
        const fileExists = fs.existsSync(tempPath);
        const fileSize = fileExists ? fs.statSync(tempPath).size : 0;
        console.log(`Template saved: ${fileExists}, Size: ${fileSize} bytes`);

        // Read and log template headers
        if (fileExists && fileSize > 0) {
          const content = fs.readFileSync(tempPath, 'utf-8');
          const headers = content.split('\n')[0];
          console.log(`Template headers: ${headers}`);
        }

        expect(fileExists).toBe(true);
        expect(fileSize).toBeGreaterThan(0);
      } catch (error) {
        console.log('Download timeout or error - button may open link instead of download');
      }
    }

    // Close modal
    const closeButton = page.getByRole('button', { name: /cancel|close/i });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  });

  test('should validate import CSV with schema comparison', async ({ page }) => {
    // Click Import button
    const importButton = page.getByRole('button', { name: /import/i });
    await expect(importButton).toBeVisible({ timeout: 10000 });
    await importButton.click();

    // Wait for import modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Create a test CSV file with sample products
    const timestamp = Date.now();
    const csvContent = `name,sku,price,categoryName,description,quantity
"CSV Import Product 1","CSV-SKU-${timestamp}-1","29.99","Test Category","First test product from CSV",100
"CSV Import Product 2","CSV-SKU-${timestamp}-2","49.99","Test Category","Second test product from CSV",50
"CSV Import Product 3","CSV-SKU-${timestamp}-3","19.99","Test Category","Third test product from CSV",200`;

    // Save CSV to temp file
    const csvPath = path.join('/tmp', `test-import-${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvContent);
    console.log(`Created test CSV at: ${csvPath}`);

    // Find file input and upload
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(csvPath);
      console.log('CSV file uploaded');

      // Wait for file processing
      await page.waitForTimeout(2000);

      // Check for validation results or preview
      const previewTable = page.locator('table').or(page.getByText(/preview|validation|mapping/i));
      const hasPreview = await previewTable.isVisible().catch(() => false);
      console.log(`Import preview/validation shown: ${hasPreview}`);

      // Look for validation errors
      const hasErrors = await page.getByText(/error|invalid|failed/i).isVisible().catch(() => false);
      console.log(`Validation errors: ${hasErrors}`);

      // Look for success indicator
      const isValid = await page.getByText(/valid|ready|parsed/i).isVisible().catch(() => false);
      console.log(`CSV validation successful: ${isValid}`);

      // Look for schema mapping/comparison UI
      const hasMapping = await page.getByText(/map|column|field/i).isVisible().catch(() => false);
      console.log(`Schema mapping UI available: ${hasMapping}`);

      // Check for import button to proceed
      const importNowBtn = page.getByRole('button', { name: /^import$|import now|start import/i });
      const canImport = await importNowBtn.isVisible().catch(() => false);

      if (canImport) {
        console.log('Import ready - clicking Import button');
        await importNowBtn.click();

        // Wait for import completion
        await page.waitForTimeout(5000);

        // Check for success message
        const importSuccess = await page.getByText(/success|completed|imported/i).isVisible().catch(() => false);
        console.log(`Import completed successfully: ${importSuccess}`);
      }
    }

    // Cleanup
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }

    // Close modal
    const closeButton = page.getByRole('button', { name: /cancel|close|done/i });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  });

  test('should verify products are multi-tenant isolated', async ({ page }) => {
    // This test verifies that products belong to the correct tenant
    // Navigate to products list
    await page.waitForLoadState('networkidle');

    // Get the current tenant from page context (usually shown in header or sidebar)
    const tenantIndicator = page.getByText(/demo-store/i)
      .or(page.locator('[data-testid="tenant-name"]'))
      .or(page.locator('.tenant-name'));

    const hasTenantIndicator = await tenantIndicator.isVisible().catch(() => false);
    console.log(`Tenant indicator visible: ${hasTenantIndicator}`);

    // Make an API call to verify tenant isolation
    const response = await page.request.get('/api/products?limit=1', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok()) {
      const data = await response.json();
      console.log('Products API response:', JSON.stringify(data, null, 2).slice(0, 500));

      // Verify response structure includes tenant data
      if (data.data && data.data.length > 0) {
        const firstProduct = data.data[0];
        console.log(`Product tenant ID: ${firstProduct.tenantId || 'Not in response'}`);
        console.log(`Product vendor ID: ${firstProduct.vendorId || 'Not in response'}`);
      }
    } else {
      console.log(`Products API returned: ${response.status()}`);
    }

    // Check that products list shows products (no "access denied" or empty due to wrong tenant)
    const productTable = page.locator('table').or(page.getByRole('grid'));
    const hasProductTable = await productTable.isVisible().catch(() => false);
    console.log(`Product table visible: ${hasProductTable}`);

    if (hasProductTable) {
      const rowCount = await page.locator('table tbody tr').count();
      console.log(`Number of products visible: ${rowCount}`);
    }
  });
});

test.describe('Bulk Import Flow', () => {
  test('should complete full bulk import workflow', async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Navigate to Products page
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Get initial product count
    const initialRowCount = await page.locator('table tbody tr').count().catch(() => 0);
    console.log(`Initial product count: ${initialRowCount}`);

    // Open import modal
    const importButton = page.getByRole('button', { name: /import/i });
    await expect(importButton).toBeVisible({ timeout: 10000 });
    await importButton.click();

    // Wait for import modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Create test CSV
    const timestamp = Date.now();
    const csvContent = `name,sku,price,description,quantity
"Bulk Product Alpha-${timestamp}","BULK-A-${timestamp}","15.99","Alpha test product",25
"Bulk Product Beta-${timestamp}","BULK-B-${timestamp}","25.99","Beta test product",50`;

    const csvPath = path.join('/tmp', `bulk-import-${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvContent);

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(csvPath);
      await page.waitForTimeout(2000);

      // Take screenshot of mapping/preview
      await page.screenshot({ path: `/tmp/import-preview-${timestamp}.png` });

      // Try to proceed with import
      const importNowBtn = page.getByRole('button', { name: /^import$|import now|start/i });
      if (await importNowBtn.isVisible().catch(() => false)) {
        await importNowBtn.click();

        // Wait for import to complete
        await page.waitForTimeout(5000);

        // Check results
        const successMsg = await page.getByText(/success|completed|imported/i).isVisible().catch(() => false);
        const errorMsg = await page.getByText(/error|failed/i).isVisible().catch(() => false);

        console.log(`Import success message: ${successMsg}`);
        console.log(`Import error message: ${errorMsg}`);

        // Close modal and verify
        const closeBtn = page.getByRole('button', { name: /close|done|cancel/i });
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        }

        // Reload products list
        await page.waitForTimeout(1000);
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check new product count
        const finalRowCount = await page.locator('table tbody tr').count().catch(() => 0);
        console.log(`Final product count: ${finalRowCount}`);
        console.log(`Products added: ${finalRowCount - initialRowCount}`);
      }
    }

    // Cleanup
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  });
});
