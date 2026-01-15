/**
 * Test Data and Fixtures for E2E Tests
 */

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TestStore {
  name: string;
  slug: string;
  industry: string;
  description?: string;
}

// Test user for onboarding
export const TEST_USER: TestUser = {
  email: 'samyak.rout1988@gmail.com',
  password: 'Admin@123',
  firstName: 'Samyak',
  lastName: 'Rout',
};

// Test store configuration
export const TEST_STORE: TestStore = {
  name: 'What a Store',
  slug: 'what-a-store',
  industry: 'retail',
  description: 'A wonderful test store created by E2E tests',
};

// URLs
export const URLS = {
  onboarding: 'https://dev-onboarding.tesserix.app',
  getAdminUrl: (slug: string) => `https://${slug}-admin.tesserix.app`,
  getStorefrontUrl: (slug: string) => `https://${slug}.tesserix.app`,
};

// Timeouts
export const TIMEOUTS = {
  navigation: 30000,
  action: 15000,
  verification: 120000, // 2 minutes for email verification
  pageLoad: 60000,
};

// Selectors for common elements
export const SELECTORS = {
  // Onboarding selectors
  onboarding: {
    emailInput: 'input[type="email"], input[name="email"]',
    passwordInput: 'input[type="password"], input[name="password"]',
    firstNameInput: 'input[name="firstName"], input[placeholder*="first" i]',
    lastNameInput: 'input[name="lastName"], input[placeholder*="last" i]',
    storeNameInput: 'input[name="storeName"], input[placeholder*="store" i]',
    continueButton: 'button[type="submit"], button:has-text("Continue"), button:has-text("Next")',
    submitButton: 'button[type="submit"]',
    verifyButton: 'button:has-text("Verify"), button:has-text("Send")',
  },

  // Admin selectors
  admin: {
    dashboard: '[data-testid="dashboard"], .dashboard, text=Dashboard',
    sidebar: '.sidebar, nav, [role="navigation"]',
    userMenu: '[data-testid="user-menu"], .user-menu',
    signOutButton: 'button:has-text("Sign Out"), button:has-text("Logout")',
  },

  // Storefront selectors
  storefront: {
    loginButton: 'button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")',
    registerButton: 'button:has-text("Register"), button:has-text("Sign Up"), a:has-text("Register")',
    userAvatar: '.user-avatar, [data-testid="user-avatar"]',
  },
};
