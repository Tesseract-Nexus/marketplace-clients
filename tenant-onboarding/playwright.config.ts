import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Tenant Onboarding E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // Base URL for tests - can be overridden via environment variable
    baseURL: process.env.BASE_URL || 'https://dev-onboarding.tesserix.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Global timeout for tests
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
});
