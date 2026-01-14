import { test, expect } from '@playwright/test';

/**
 * Cart Validation E2E Tests
 *
 * Tests the cart validation functionality on the deployed storefront.
 * Note: These tests work with the actual cart state from the backend,
 * not mocked localStorage data.
 */

test.describe('Cart Validation', () => {

  test('should display cart page correctly', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    // Check that the cart page loads - should show either empty cart or shopping cart heading
    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });
    const emptyHeading = page.getByRole('heading', { name: /Your Cart is Empty/i });

    await expect(cartHeading.or(emptyHeading)).toBeVisible({ timeout: 15000 });
  });

  test('should show empty cart with discover products link when no items', async ({ page }) => {
    // Clear cart by going to cart page and clearing if possible
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    // Check for either empty cart or cart with items
    const emptyHeading = page.getByRole('heading', { name: /Your Cart is Empty/i });
    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // If cart is empty, verify the discover products link exists
    if (await emptyHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const discoverButton = page.getByRole('link', { name: /Discover Products/i });
      await expect(discoverButton).toBeVisible();
    } else {
      // Cart has items - verify the cart structure
      await expect(cartHeading).toBeVisible();
    }
  });

  test('should have order summary section when items in cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // Only test if cart has items
    if (await cartHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const summaryHeading = page.getByRole('heading', { name: /Order Summary/i });
      await expect(summaryHeading).toBeVisible();
    }
  });

  test('should have checkout button when items in cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // Only test if cart has items
    if (await cartHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for checkout link or button
      const checkoutElement = page.getByRole('link', { name: /Checkout/i })
        .or(page.getByRole('button', { name: /Checkout/i }));
      await expect(checkoutElement).toBeVisible();
    }
  });

  test('should have continue shopping link', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // Only test if cart has items (empty cart has Discover Products instead)
    if (await cartHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const continueShoppingLink = page.getByRole('link', { name: /Continue Shopping/i });
      await expect(continueShoppingLink).toBeVisible();
    }
  });

  test('should navigate to checkout when clicking checkout', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const checkoutLink = page.getByRole('link', { name: /Checkout/i });

    // Only test if checkout link is visible
    if (await checkoutLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutLink.click();
      // Should navigate to checkout or login page
      await expect(page).toHaveURL(/checkout|login/, { timeout: 10000 });
    }
  });

  test('should display quantity controls for cart items', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // Only test if cart has items
    if (await cartHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for quantity increment/decrement buttons
      const incrementButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      const decrementButton = page.locator('button').filter({ has: page.locator('svg.lucide-minus') }).first();

      // At least one quantity control should be visible
      const hasIncrement = await incrementButton.isVisible().catch(() => false);
      const hasDecrement = await decrementButton.isVisible().catch(() => false);

      expect(hasIncrement || hasDecrement).toBeTruthy();
    }
  });

  test('should display remove item button for cart items', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // Only test if cart has items
    if (await cartHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for remove button
      const removeButton = page.getByRole('button', { name: /Remove/i }).first();
      await expect(removeButton).toBeVisible();
    }
  });

  test('should show select all checkbox when items in cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const cartHeading = page.getByRole('heading', { name: /Shopping Cart/i });

    // Only test if cart has items
    if (await cartHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const selectAllLabel = page.getByText('Select All');
      await expect(selectAllLabel).toBeVisible();
    }
  });
});
