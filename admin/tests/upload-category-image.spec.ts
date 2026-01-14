import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.use({ storageState: '.playwright/.auth/user.json' });

test('upload image to category and verify', async ({ page }) => {
  // Go to categories page
  await page.goto('/categories');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Find and click on "Electronics" category to edit it
  const electronicsRow = page.locator('tr', { hasText: 'Electronics' }).first();
  await expect(electronicsRow).toBeVisible({ timeout: 10000 });

  // Click the edit button for this category
  const editButton = electronicsRow.locator('button[title="Edit"], button:has-text("Edit"), [data-action="edit"]').first();
  if (await editButton.isVisible()) {
    await editButton.click();
  } else {
    // Maybe it's a click on the row itself
    await electronicsRow.click();
  }

  await page.waitForTimeout(2000);

  // Look for the image upload component
  console.log('Looking for image upload...');

  // Check if there's a media upload button for category icon
  const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Choose"), [data-testid="upload-button"], input[type="file"]').first();

  // Find sample image
  const imagesDir = path.join(process.cwd(), 'temp-images');
  const images = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  if (images.length === 0) {
    console.log('No sample images found in temp-images directory');
    return;
  }

  const imagePath = path.join(imagesDir, images[0]);
  console.log('Using image:', imagePath);

  // Try to find the file input for category icon
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.isVisible()) {
    await fileInput.setInputFiles(imagePath);
    await page.waitForTimeout(3000);
  } else {
    console.log('No file input found');
    // Take screenshot to see current state
    await page.screenshot({ path: 'category-edit-state.png' });
  }

  // Check current form state
  const pageContent = await page.content();
  console.log('Page has imageUrl input:', pageContent.includes('imageUrl'));
  console.log('Page has file upload:', pageContent.includes('type="file"'));

  // Try to save the category
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
  if (await saveButton.isVisible()) {
    console.log('Found save button');
  }

  // Take screenshot of the edit form
  await page.screenshot({ path: 'category-edit-form.png', fullPage: true });
});
