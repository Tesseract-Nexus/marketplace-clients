import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Product Image Upload E2E Tests
 *
 * Uploads sample images to existing products for testing
 * storefront layouts and image alignments.
 */

const TEMP_IMAGES_DIR = path.join(__dirname, '../../../temp-images');

test.describe('Product Image Upload', () => {
  test.setTimeout(360000); // 6 minutes

  test('should upload images to products one by one', async ({ page }) => {
    // Check images
    if (!fs.existsSync(TEMP_IMAGES_DIR)) {
      console.log('temp-images directory not found');
      return;
    }

    const imageFiles = fs.readdirSync(TEMP_IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .sort()
      .map(f => path.join(TEMP_IMAGES_DIR, f));

    console.log(`Found ${imageFiles.length} images`);

    // Navigate to admin
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Go to products
    console.log('Navigating to Products...');
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /^products$/i }).click();
    await page.waitForURL('**/products', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Wait for products to load (they load asynchronously)
    console.log('Waiting for products to load...');
    await page.waitForTimeout(5000);

    // Try multiple selectors
    let productButtons = page.locator('button.text-lg.font-bold');
    let productCount = await productButtons.count();

    // If no products found, try waiting longer and use alternative selector
    if (productCount === 0) {
      console.log('No products found with first selector, waiting more...');
      await page.waitForTimeout(5000);
      productCount = await productButtons.count();
    }

    // Try finding any product name element
    if (productCount === 0) {
      console.log('Trying alternative selector...');
      const altButtons = page.locator('[class*="text-lg"][class*="font-bold"]');
      productCount = await altButtons.count();
      if (productCount > 0) {
        productButtons = altButtons;
      }
    }

    console.log(`Found ${productCount} products`);

    if (productCount === 0) {
      console.log('No products found');
      await page.screenshot({ path: '/tmp/no-products.png' });
      return;
    }

    // Process remaining products (starting from index 9, where we left off)
    const startFrom = 9; // Start from product 10 (0-indexed)
    const toProcess = Math.min(productCount, 20, imageFiles.length);
    console.log(`Will upload images to products ${startFrom + 1} through ${toProcess}`);

    for (let i = startFrom; i < toProcess; i++) {
      console.log(`\n=== Product ${i + 1}/${toProcess} ===`);
      const imageFile = imageFiles[i];
      console.log(`Image: ${path.basename(imageFile)}`);

      // Navigate to products list if not there
      if (!page.url().includes('/products')) {
        await page.getByRole('button', { name: /catalog/i }).click();
        await page.getByRole('link', { name: /^products$/i }).click();
        await page.waitForTimeout(2000);
      }

      // Click product name to open details
      const productBtn = page.locator('button.text-lg.font-bold').nth(i);
      const productName = await productBtn.textContent();
      console.log(`Product: ${productName?.trim()}`);
      await productBtn.click();
      await page.waitForTimeout(2000);

      // Click Edit Product button
      const editBtn = page.getByRole('button', { name: /edit product/i }).first();
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Clicking Edit...');
        await editBtn.click();
        await page.waitForTimeout(2000);
      }

      // Take screenshot of form
      await page.screenshot({ path: `/tmp/product-form-${i}.png` });

      // Navigate to Media step (step 4)
      // The stepper has buttons with step titles like "Media", "Pricing", etc.
      console.log('Looking for Media step...');
      const mediaStepBtn = page.locator('button').filter({ hasText: 'Media' }).first();

      if (await mediaStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Clicking Media step...');
        await mediaStepBtn.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('Media step not found, trying Next button...');
        // Try clicking Next button multiple times to reach step 4
        for (let n = 0; n < 3; n++) {
          const nextBtn = page.getByRole('button', { name: /next/i });
          if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      // Try to find file input
      const fileInput = page.locator('input[type="file"]');
      const inputCount = await fileInput.count();
      console.log(`Found ${inputCount} file inputs`);

      if (inputCount > 0) {
        console.log('Uploading image...');
        await fileInput.first().setInputFiles(imageFile);
        await page.waitForTimeout(5000);
        console.log('Upload done');

        // Navigate to Review step (step 5) to save
        console.log('Going to Review step...');
        const reviewStepBtn = page.locator('button').filter({ hasText: 'Review' }).first();
        if (await reviewStepBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await reviewStepBtn.click();
          await page.waitForTimeout(1000);
        }

        // Click Save/Update button
        const saveBtn = page.getByRole('button', { name: /^save$|update product|save changes/i }).first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('Saving product...');
          await saveBtn.click();
          await page.waitForTimeout(3000);

          // Check for success toast
          const success = await page.getByText(/success|saved|updated/i).isVisible({ timeout: 3000 }).catch(() => false);
          console.log(`Save ${success ? 'successful' : 'completed'}`);
        }
      } else {
        console.log('No file input found');
      }

      // Go back
      console.log('Going back...');
      await page.goto('/');
      await page.waitForTimeout(2000);
    }

    console.log('\n=== Completed ===');
  });
});
