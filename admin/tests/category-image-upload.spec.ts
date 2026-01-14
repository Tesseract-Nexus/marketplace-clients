import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Category Image Upload E2E Tests
 *
 * Uploads sample images to existing categories for testing
 * storefront layouts and image alignments.
 */

const TEMP_IMAGES_DIR = path.join(__dirname, '../../../temp-images');

test.describe('Category Image Upload', () => {
  test.setTimeout(300000); // 5 minutes

  test('should upload images to categories', async ({ page }) => {
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

    // Go to categories
    console.log('Navigating to Categories...');
    await page.getByRole('button', { name: /catalog/i }).click();
    await page.getByRole('link', { name: /categories/i }).click();
    await page.waitForURL('**/categories', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Take screenshot of categories page
    await page.screenshot({ path: '/tmp/categories-page.png' });

    // Find category items - categories are displayed as tree items or cards
    // Look for edit buttons or category names
    const editButtons = page.getByRole('button', { name: /edit/i });
    let categoryCount = await editButtons.count();
    console.log(`Found ${categoryCount} edit buttons`);

    // Also try finding category items by other means
    if (categoryCount === 0) {
      // Categories might be displayed as expandable tree items
      const categoryItems = page.locator('[class*="category"]').or(page.locator('button').filter({ hasText: /electronics|clothing|home/i }));
      categoryCount = await categoryItems.count();
      console.log(`Found ${categoryCount} category items`);
    }

    if (categoryCount === 0) {
      console.log('No categories found. Taking debug screenshot...');
      await page.screenshot({ path: '/tmp/no-categories.png' });
      return;
    }

    // Process categories (up to 10)
    const toProcess = Math.min(categoryCount, 10, imageFiles.length);
    console.log(`Will upload images to ${toProcess} categories`);

    for (let i = 0; i < toProcess; i++) {
      console.log(`\n=== Category ${i + 1}/${toProcess} ===`);
      const imageFile = imageFiles[i];
      console.log(`Image: ${path.basename(imageFile)}`);

      // Navigate back to categories if needed
      if (!page.url().includes('/categories')) {
        await page.getByRole('button', { name: /catalog/i }).click();
        await page.getByRole('link', { name: /categories/i }).click();
        await page.waitForTimeout(3000);
      }

      // Click edit on the category
      const editBtn = page.getByRole('button', { name: /edit/i }).nth(i);

      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const categoryRow = editBtn.locator('xpath=ancestor::*[contains(@class, "flex") or contains(@class, "grid")]').first();
        console.log('Clicking Edit...');
        await editBtn.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('Edit button not found, trying to click category row...');
        // Try clicking on category name or row
        const categoryName = page.locator('button, span').filter({ hasText: /\w+/ }).nth(i);
        if (await categoryName.isVisible().catch(() => false)) {
          await categoryName.click();
          await page.waitForTimeout(2000);
        }
      }

      // Take screenshot of form
      await page.screenshot({ path: `/tmp/category-form-${i}.png` });

      // Look for file inputs (icon and banner uploaders)
      const fileInputs = page.locator('input[type="file"]');
      const inputCount = await fileInputs.count();
      console.log(`Found ${inputCount} file inputs`);

      if (inputCount > 0) {
        // Upload to first file input (usually icon)
        console.log('Uploading icon image...');
        await fileInputs.first().setInputFiles(imageFile);
        await page.waitForTimeout(3000);

        // If there's a second file input (banner), upload another image
        if (inputCount > 1 && i + 1 < imageFiles.length) {
          console.log('Uploading banner image...');
          await fileInputs.nth(1).setInputFiles(imageFiles[(i + 1) % imageFiles.length]);
          await page.waitForTimeout(3000);
        }

        console.log('Upload done');

        // Click Save/Update button
        const saveBtn = page.getByRole('button', { name: /^save$|update|save changes/i }).first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('Saving category...');
          await saveBtn.click();
          await page.waitForTimeout(3000);

          // Check for success
          const success = await page.getByText(/success|saved|updated/i).isVisible({ timeout: 3000 }).catch(() => false);
          console.log(`Save ${success ? 'successful' : 'completed'}`);
        }
      } else {
        console.log('No file inputs found');
        await page.screenshot({ path: `/tmp/category-no-input-${i}.png` });
      }

      // Go back to categories list
      console.log('Going back...');
      const backBtn = page.getByRole('button', { name: /back|cancel|close/i }).first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backBtn.click();
        await page.waitForTimeout(1000);
      } else {
        await page.goto('/');
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n=== Completed ===');
  });
});
