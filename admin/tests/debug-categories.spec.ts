import { test, expect } from '@playwright/test';

test.use({ storageState: '.playwright/.auth/user.json' });

test('debug categories data', async ({ page }) => {
  // Listen to network requests
  let categoriesResponse: any = null;

  page.on('response', async (response) => {
    if (response.url().includes('/api/categories') && response.request().method() === 'GET') {
      try {
        categoriesResponse = await response.json();
        console.log('=== CATEGORIES API RESPONSE ===');
        console.log(JSON.stringify(categoriesResponse, null, 2));
      } catch (e) {
        console.log('Failed to parse categories response');
      }
    }
  });

  // Go to categories page to trigger the API call
  await page.goto('/categories');
  await page.waitForTimeout(3000);

  // Check if we got data
  if (categoriesResponse) {
    console.log('\n=== FIRST CATEGORY DETAILS ===');
    const firstCategory = categoriesResponse?.data?.[0] || categoriesResponse?.[0];
    if (firstCategory) {
      console.log('Name:', firstCategory.name);
      console.log('ImageUrl:', firstCategory.imageUrl);
      console.log('BannerUrl:', firstCategory.bannerUrl);
      console.log('Images:', JSON.stringify(firstCategory.images, null, 2));
      console.log('Has images array:', !!firstCategory.images);
      console.log('Images count:', firstCategory.images?.length || 0);
    }
  }

  // Also try direct API call
  const directResponse = await page.evaluate(async () => {
    const resp = await fetch('/api/categories');
    return resp.json();
  });

  console.log('\n=== DIRECT FETCH RESPONSE ===');
  const firstCat = directResponse?.data?.[0] || directResponse?.[0];
  if (firstCat) {
    console.log('Name:', firstCat.name);
    console.log('ImageUrl:', firstCat.imageUrl);
    console.log('BannerUrl:', firstCat.bannerUrl);
    console.log('Images:', JSON.stringify(firstCat.images, null, 2));
  }
});
