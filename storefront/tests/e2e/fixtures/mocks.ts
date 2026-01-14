import { Page, Route } from '@playwright/test';

/**
 * Mock API responses for E2E tests
 *
 * This file contains mock responses for backend services
 * to allow E2E tests to run without a running backend.
 */

// Mock tenant info response
export const mockTenantInfo = {
  tenant_id: 'test-tenant-id',
  slug: 'demo-store',
  storefront_id: 'test-storefront-id',
  status: 'provisioned',
};

// Mock storefront settings
export const mockStorefrontSettings = {
  id: 'test-storefront-id',
  tenantId: 'test-tenant-id',
  name: 'Demo Store',
  description: 'A demo storefront for testing',
  primaryColor: '#8B5CF6',
  secondaryColor: '#EC4899',
  accentColor: '#F59E0B',
  logoUrl: null,
  faviconUrl: null,
  fontPrimary: 'Inter',
  fontSecondary: 'Inter',
  colorMode: 'system',
  currency: 'AUD',
  currencySymbol: '$',
  headerConfig: {
    showLogo: true,
    showSearch: true,
    showCart: true,
    showAccount: true,
    showCategories: true,
    showCurrency: true,
    announcementText: null,
  },
  homepageConfig: {
    showHero: true,
    showFeaturedProducts: true,
    showCategories: true,
    showNewArrivals: true,
    showBestSellers: true,
    showTestimonials: false,
    showNewsletter: true,
  },
  footerConfig: {
    showSocial: true,
    showNewsletter: true,
    showPaymentMethods: true,
    copyrightText: '2024 Demo Store. All rights reserved.',
  },
  productConfig: {
    showRatings: true,
    showReviews: true,
    showRelatedProducts: true,
    showRecentlyViewed: true,
    enableWishlist: true,
    enableCompare: false,
  },
  checkoutConfig: {
    requireAccount: false,
    enableGuestCheckout: true,
    showOrderNotes: true,
    enableCoupons: true,
  },
  typographyConfig: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    headingScale: 'default',
    headingWeight: 700,
    bodyWeight: 400,
    headingLineHeight: 'normal',
    bodyLineHeight: 'normal',
    headingLetterSpacing: 'normal',
  },
  layoutConfig: {
    navigationStyle: 'header',
    containerWidth: 'default',
    contentPadding: 'default',
    homepageLayout: 'hero-grid',
    headerLayout: 'logo-left',
    headerHeight: 'default',
    footerLayout: 'multi-column',
    productListLayout: 'grid',
    productGridColumns: { mobile: 2, tablet: 3, desktop: 4 },
    productDetailLayout: 'image-left',
    categoryLayout: 'sidebar-left',
    showCategoryBanner: true,
  },
  contentPages: [],
  marketingConfig: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock localization settings
export const mockLocalization = {
  defaultLocale: 'en',
  supportedLocales: ['en'],
  translations: {},
};

/**
 * Setup API mocks for E2E tests
 * Call this in beforeEach to intercept API requests
 */
export async function setupApiMocks(page: Page) {
  // Mock tenant router API
  await page.route('**/api/v1/hosts/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTenantInfo),
    });
  });

  // Mock vendor-service storefront resolution
  await page.route('**/api/v1/storefronts/resolve/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: mockStorefrontSettings.id,
        tenantId: mockStorefrontSettings.tenantId,
      }),
    });
  });

  // Mock storefront theme/settings
  await page.route('**/api/v1/storefronts/**/theme**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStorefrontSettings),
    });
  });

  // Mock content pages
  await page.route('**/api/v1/storefronts/**/content-pages**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock marketing settings
  await page.route('**/api/v1/storefronts/**/marketing**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  // Mock localization
  await page.route('**/api/v1/storefronts/**/localization**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLocalization),
    });
  });

  // Mock exchange rates API
  await page.route('**/api.frankfurter.app/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        base: 'AUD',
        date: new Date().toISOString().slice(0, 10),
        rates: {
          USD: 0.64,
          EUR: 0.59,
          GBP: 0.51,
          INR: 53.5,
          CAD: 0.87,
          SGD: 0.87,
          NZD: 1.08,
          JPY: 100.6,
          CHF: 0.58,
          AED: 2.35,
        },
      }),
    });
  });

  // Mock products API
  await page.route('**/api/v1/products**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      }),
    });
  });

  // Mock categories API
  await page.route('**/api/v1/categories**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock cart validation API
  await page.route('**/api/v1/cart/validate**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        hasUnavailableItems: false,
        hasPriceChanges: false,
        unavailableCount: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        priceChangedCount: 0,
        expiresAt: null,
      }),
    });
  });
}
