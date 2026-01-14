import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.use({ storageState: '.playwright/.auth/user.json' });

test('upload images to categories', async ({ page }) => {
  // Sample images from temp-images directory (in repo root)
  const imagesDir = path.join(process.cwd(), '..', '..', 'temp-images');
  const images = fs.readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    .slice(0, 6); // Use first 6 images for 6 categories

  if (images.length < 6) {
    console.log(`Only ${images.length} images found, need 6`);
    return;
  }

  const categories = ['Electronics', 'Food & Beverages', 'Fashion & Apparel', 'Sports & Fitness', 'Stationery', 'Eco-Friendly'];

  for (let i = 0; i < Math.min(categories.length, images.length); i++) {
    const categoryName = categories[i];
    const imagePath = path.join(imagesDir, images[i]);

    console.log(`\n=== Uploading image to ${categoryName} ===`);
    console.log(`Image: ${images[i]}`);

    // Go to categories
    await page.goto('/categories');
    await page.waitForTimeout(3000);

    // The categories page shows a hierarchy view with category names
    // Find the category by its name text
    const categoryItem = page.locator(`text="${categoryName}"`).first();
    await expect(categoryItem).toBeVisible({ timeout: 10000 });

    // Click on the category to expand options or select it
    await categoryItem.click();
    await page.waitForTimeout(1000);

    // Look for edit button or three-dot menu near the category
    // The UI shows categories with checkboxes and action buttons
    const editButton = page.locator('button:has-text("Edit"), [aria-label="Edit"], button[title="Edit"]').first();

    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
    } else {
      // Try finding the edit action in a dropdown menu
      const moreButton = page.locator('[data-testid="more-actions"], button:has(svg[class*="ellipsis"]), button:has(svg[class*="dots"])').first();
      if (await moreButton.isVisible({ timeout: 2000 })) {
        await moreButton.click();
        await page.waitForTimeout(500);
        const editMenuItem = page.locator('[role="menuitem"]:has-text("Edit")').first();
        if (await editMenuItem.isVisible()) {
          await editMenuItem.click();
        }
      }
    }

    await page.waitForTimeout(2000);

    // Now we should be in edit mode - look for image upload
    // The category form has MediaUploader components for imageUrl and bannerUrl
    const fileInputs = await page.locator('input[type="file"]').all();
    console.log(`Found ${fileInputs.length} file inputs`);

    if (fileInputs.length > 0) {
      // First file input is usually for category icon (imageUrl)
      await fileInputs[0].setInputFiles(imagePath);
      console.log('Image file selected');
      await page.waitForTimeout(3000);

      // Click Save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        console.log('Save clicked');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('No file input found');
      await page.screenshot({ path: `category-${i}-no-input.png` });
    }

    console.log(`Completed ${categoryName}`);
  }

  // Verify categories have images by fetching API
  await page.goto('/categories');
  await page.waitForTimeout(2000);

  const response = await page.evaluate(async () => {
    const resp = await fetch('/api/categories');
    return resp.json();
  });

  console.log('\n=== VERIFICATION ===');
  for (const cat of response?.data || []) {
    const hasImage = cat.imageUrl && cat.imageUrl.trim() !== '';
    const hasBanner = cat.bannerUrl && cat.bannerUrl.trim() !== '';
    console.log(`${cat.name}: imageUrl=${hasImage ? 'SET' : 'empty'}, bannerUrl=${hasBanner ? 'SET' : 'empty'}`);
  }
});
