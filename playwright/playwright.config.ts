import { defineConfig, devices } from '@playwright/test';

/**
 * Marketplace E2E Test Configuration
 *
 * Test environments:
 * - dev-onboarding.tesserix.app - Tenant onboarding
 * - {tenant}-admin.tesserix.app - Admin dashboard
 * - {tenant}.tesserix.app - Storefront
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false, // Run tests sequentially for onboarding flow
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['list'],
  ],

  use: {
    // Base URL can be overridden per test
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    headless: true,

    // Default timeouts
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // Output directories
  outputDir: 'test-results/artifacts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers if needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  // Global timeout for each test
  timeout: 120000, // 2 minutes per test

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
