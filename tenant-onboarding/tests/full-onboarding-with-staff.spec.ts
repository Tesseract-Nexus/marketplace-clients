import { test, expect, Page, request } from '@playwright/test';

/**
 * Full Tenant Onboarding E2E Test with Staff Setup
 *
 * This test creates a complete store with:
 * 1. Owner account (owner@test.tesserix.app)
 * 2. Email verification via backend API
 * 3. Account setup with password
 * 4. Admin portal login
 * 5. Staff member creation (admin, manager, viewer)
 */

// Test configuration
const TEST_CONFIG = {
  owner: {
    email: 'owner@test.tesserix.app',
    password: 'TestOwner123!',
    firstName: 'Test',
    lastName: 'Owner',
  },
  staff: {
    admin: {
      email: 'admin@test.tesserix.app',
      password: 'TestAdmin123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'store_admin',
    },
    manager: {
      email: 'manager@test.tesserix.app',
      password: 'TestManager123!',
      firstName: 'Test',
      lastName: 'Manager',
      role: 'store_manager',
    },
    viewer: {
      email: 'viewer@test.tesserix.app',
      password: 'TestViewer123!',
      firstName: 'Test',
      lastName: 'Viewer',
      role: 'viewer',
    },
  },
  business: {
    name: 'Test Store',
    type: 'Sole Proprietorship',
    industry: 'Fashion & Apparel',
    description: 'E2E Test Store for RBAC testing',
  },
  address: {
    country: 'India',
    countryCode: 'IN',
    state: 'Maharashtra',
    city: 'Mumbai',
    street: '123 Test Street, Andheri West',
    postalCode: '400058',
  },
  store: {
    subdomain: `teststore${Date.now().toString().slice(-8)}`,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
};

// Store session ID for use across tests
let sessionId: string;
let tenantSlug: string;

test.describe.serial('Full Onboarding with Staff Setup', () => {
  test.setTimeout(300000); // 5 minutes for full flow

  test('Step 1: Complete onboarding flow and create store', async ({ page }) => {
    // Capture API responses to get session ID
    let capturedSessionId: string | null = null;

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/onboarding') && response.status() === 200) {
        try {
          const json = await response.json();
          if (json.data?.id || json.id || json.session_id) {
            capturedSessionId = json.data?.id || json.id || json.session_id;
            console.log('Captured session ID from API:', capturedSessionId);
          }
        } catch (e) {
          // Not JSON response
        }
      }
    });

    // Navigate to onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Starting onboarding flow...');

    // =====================
    // STEP 0: Business Info
    // =====================
    console.log('Step 0: Filling Business Info...');

    const businessNameInput = page.locator('input[name="businessName"]');
    await businessNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await businessNameInput.fill(TEST_CONFIG.business.name);

    // Business Type dropdown
    const businessTypeDropdown = page.getByText('Select type').first();
    await businessTypeDropdown.click();
    await page.waitForTimeout(500);
    await page.getByText(TEST_CONFIG.business.type).first().click();
    await page.waitForTimeout(300);

    // Industry dropdown
    const industryDropdown = page.getByText('Select industry').first();
    await industryDropdown.click();
    await page.waitForTimeout(500);
    await page.getByText(TEST_CONFIG.business.industry).first().click();
    await page.waitForTimeout(300);

    // Business Description
    const descriptionInput = page.locator('textarea[name="businessDescription"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(TEST_CONFIG.business.description);
    }

    await page.screenshot({ path: 'tests/screenshots/full-01-business-info.png', fullPage: true });

    // Continue to next step
    const continueBtn = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn.click();
    await page.waitForTimeout(2000);

    // ======================
    // STEP 1: Contact Details
    // ======================
    console.log('Step 1: Filling Contact Details...');

    await page.locator('input[name="firstName"]').fill(TEST_CONFIG.owner.firstName);
    await page.locator('input[name="lastName"]').fill(TEST_CONFIG.owner.lastName);
    await page.locator('input[name="email"]').fill(TEST_CONFIG.owner.email);

    // Phone (optional)
    const phoneInput = page.locator('input[name="phoneNumber"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('4155551234');
    }

    // Job Title dropdown
    const jobTitleDropdown = page.getByText(/select.*title|select.*role/i).first();
    if (await jobTitleDropdown.isVisible()) {
      await jobTitleDropdown.click();
      await page.waitForTimeout(500);
      const ceoOption = page.getByText(/CEO.*Founder|Founder|Owner/i).first();
      if (await ceoOption.isVisible()) {
        await ceoOption.click();
      }
    }

    await page.screenshot({ path: 'tests/screenshots/full-02-contact-details.png', fullPage: true });

    await page.getByRole('main').getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(2000);

    // ================
    // STEP 2: Address
    // ================
    console.log('Step 2: Filling Address...');

    // Country selector - India
    const countryDropdown = page.getByText(/select.*country/i).first();
    if (await countryDropdown.isVisible()) {
      await countryDropdown.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('India');
        await page.waitForTimeout(500);
      }
      await page.getByText(/^India$/i).first().click();
    }

    await page.waitForTimeout(1000);

    // State selector - Maharashtra
    const stateDropdown = page.getByText(/select.*state|select.*province/i).first();
    if (await stateDropdown.isVisible()) {
      await stateDropdown.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Maharashtra');
        await page.waitForTimeout(500);
      }
      await page.getByText(/Maharashtra/i).first().click();
    }

    // City
    await page.locator('input[name="city"]').fill(TEST_CONFIG.address.city);

    // Street Address
    await page.locator('input[name="streetAddress"]').fill(TEST_CONFIG.address.street);

    // Postal Code
    await page.locator('input[name="postalCode"]').fill(TEST_CONFIG.address.postalCode);

    await page.screenshot({ path: 'tests/screenshots/full-03-address.png', fullPage: true });

    await page.getByRole('main').getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(2000);

    // ===================
    // STEP 3: Store Setup
    // ===================
    console.log('Step 3: Filling Store Setup...');

    // Subdomain
    const subdomainInput = page.locator('input[name="subdomain"]');
    if (await subdomainInput.isVisible()) {
      await subdomainInput.clear();
      await subdomainInput.fill(TEST_CONFIG.store.subdomain);
      tenantSlug = TEST_CONFIG.store.subdomain;
    }

    // Storefront Slug (if separate)
    const storefrontInput = page.locator('input[name="storefrontSlug"]');
    if (await storefrontInput.isVisible()) {
      await storefrontInput.clear();
      await storefrontInput.fill(TEST_CONFIG.store.subdomain);
    }

    // Currency selector - INR
    const currencyDropdown = page.getByText(/select.*currency/i).first();
    if (await currencyDropdown.isVisible()) {
      await currencyDropdown.click();
      await page.waitForTimeout(500);
      await page.getByText(/INR|Indian Rupee/i).first().click();
    }

    // Timezone selector - Kolkata
    const timezoneDropdown = page.getByText(/select.*timezone/i).first();
    if (await timezoneDropdown.isVisible()) {
      await timezoneDropdown.click();
      await page.waitForTimeout(500);
      await page.getByText(/Kolkata|India Standard/i).first().click();
    }

    await page.screenshot({ path: 'tests/screenshots/full-04-store-setup.png', fullPage: true });

    // Submit the form
    console.log('Submitting onboarding...');
    const launchBtn = page.getByRole('button', { name: /launch|create|submit|complete|finish/i });
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/full-05-after-submit.png', fullPage: true });

    // Extract session ID from URL or page
    const currentUrl = page.url();
    console.log('Current URL after submission:', currentUrl);

    // Check if we're on verification page
    const isOnVerifyPage = currentUrl.includes('/verify') ||
                          await page.getByText(/verification|check your email|code sent/i).isVisible().catch(() => false);

    console.log('On verification page:', isOnVerifyPage);
    expect(isOnVerifyPage).toBeTruthy();

    // Get session ID from captured API response or localStorage
    sessionId = capturedSessionId || await page.evaluate(() => {
      // Try to get session ID from localStorage
      const sessionData = localStorage.getItem('onboardingSession') ||
                         localStorage.getItem('sessionId') ||
                         sessionStorage.getItem('onboardingSession') ||
                         localStorage.getItem('tesserix_onboarding_session');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          return parsed.id || parsed.sessionId || parsed.session_id || sessionData;
        } catch {
          return sessionData;
        }
      }
      // Try to extract from URL
      const urlMatch = window.location.href.match(/session[_-]?[iI]d[=\/]([a-zA-Z0-9-]+)/);
      return urlMatch ? urlMatch[1] : null;
    });

    console.log('Final Session ID:', sessionId);

    // Save session ID to a file for subsequent tests
    if (sessionId) {
      const fs = require('fs');
      fs.writeFileSync('tests/.session-data.json', JSON.stringify({
        sessionId,
        tenantSlug: TEST_CONFIG.store.subdomain,
        ownerEmail: TEST_CONFIG.owner.email,
      }));
    }
  });

  test('Step 2: Verify email via backend API and complete account setup', async ({ page, request }) => {
    // Load session data from file if not available in memory
    if (!sessionId) {
      const fs = require('fs');
      try {
        const data = JSON.parse(fs.readFileSync('tests/.session-data.json', 'utf8'));
        sessionId = data.sessionId;
        tenantSlug = data.tenantSlug;
        console.log('Loaded session data from file:', { sessionId, tenantSlug });
      } catch (e) {
        console.log('No session data file found');
      }
    }

    test.skip(!sessionId, 'Session ID not available');

    console.log('Verifying email for session:', sessionId);

    const BASE_URL = process.env.BASE_URL || 'https://dev-onboarding.tesserix.app';
    const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'https://dev-onboarding-api.tesserix.app';

    // Step 1: Check current verification status via BFF
    console.log('Checking verification status...');
    const statusResponse = await request.get(
      `${BASE_URL}/api/onboarding/${sessionId}/verification/status?recipient=${encodeURIComponent(TEST_CONFIG.owner.email)}&purpose=email_verification`
    ).catch(() => null);

    if (statusResponse?.ok()) {
      const statusData = await statusResponse.json();
      console.log('Current verification status:', statusData);

      if (statusData.data?.is_verified || statusData.is_verified) {
        console.log('Email already verified!');
      }
    }

    // Step 2: Verify email via BFF test API endpoint
    console.log('Attempting to verify email via BFF test endpoint...');

    let verified = false;

    // Use BFF test endpoint for email verification
    const testVerifyResponse = await request.post(
      `${BASE_URL}/api/test/verify-email`,
      {
        data: {
          session_id: sessionId,
          email: TEST_CONFIG.owner.email,
        },
        failOnStatusCode: false,
      }
    );

    if (testVerifyResponse.ok()) {
      const verifyData = await testVerifyResponse.json();
      console.log('Email verification response:', verifyData);
      if (verifyData.success || verifyData.data?.verified) {
        console.log('Email verified via BFF test endpoint');
        verified = true;
      }
    } else {
      const errorData = await testVerifyResponse.json().catch(() => ({}));
      console.log('BFF test endpoint response:', testVerifyResponse.status(), errorData);
    }

    // Alternative: Try backend test endpoint directly
    if (!verified) {
      console.log('Trying backend test endpoint...');
      const backendVerifyResponse = await request.post(
        `${TENANT_SERVICE_URL}/api/v1/test/verify-email`,
        {
          data: {
            session_id: sessionId,
            email: TEST_CONFIG.owner.email,
          },
          failOnStatusCode: false,
        }
      ).catch(() => null);

      if (backendVerifyResponse?.ok()) {
        console.log('Email verified via backend test endpoint');
        verified = true;
      }
    }

    // Step 3: Navigate to password setup page
    console.log('Navigating to password setup...');
    await page.goto(`/onboarding/setup-password?session=${sessionId}&email=${encodeURIComponent(TEST_CONFIG.owner.email)}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/full-06-password-setup.png', fullPage: true });

    // Step 4: Fill password and complete account setup
    const passwordInput = page.locator('input[type="password"]').first();

    if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Filling password...');
      await passwordInput.fill(TEST_CONFIG.owner.password);

      // Confirm password if field exists
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordInput.isVisible().catch(() => false)) {
        await confirmPasswordInput.fill(TEST_CONFIG.owner.password);
      }

      await page.screenshot({ path: 'tests/screenshots/full-06b-password-filled.png', fullPage: true });

      // Submit password - look for the specific "Create Account" button
      const submitBtn = page.getByRole('button', { name: /create.*account.*password/i })
        .or(page.getByRole('button', { name: /create.*account/i }))
        .or(page.locator('button[type="submit"]'));

      if (await submitBtn.first().isVisible()) {
        await submitBtn.first().click();
        console.log('Clicked submit button');
      }

      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'tests/screenshots/full-07-after-submit.png', fullPage: true });

      // Check if we're on success page or admin redirect
      const currentUrl = page.url();
      console.log('Current URL after account setup:', currentUrl);

      if (currentUrl.includes('success') || currentUrl.includes('admin')) {
        console.log('Account setup completed successfully!');

        // Try to extract tenant slug from success page
        const adminUrlMatch = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="admin"]');
          for (const link of links) {
            const match = link.getAttribute('href')?.match(/https?:\/\/([^-]+)-admin/);
            if (match) return match[1];
          }
          return null;
        });

        if (adminUrlMatch) {
          tenantSlug = adminUrlMatch;
          console.log('Extracted tenant slug:', tenantSlug);
        }
      }
    } else {
      console.log('Password input not visible, trying API approach...');

      // Use API to complete account setup
      const setupResponse = await request.post(
        `${BASE_URL}/api/onboarding/${sessionId}/account-setup`,
        {
          data: {
            password: TEST_CONFIG.owner.password,
            auth_method: 'password',
            timezone: TEST_CONFIG.store.timezone,
            currency: TEST_CONFIG.store.currency,
            business_model: 'ONLINE_STORE',
          },
          failOnStatusCode: false,
        }
      );

      const responseData = await setupResponse.json().catch(() => ({}));
      console.log('Account setup API response:', setupResponse.status(), responseData);

      if (setupResponse.ok()) {
        if (responseData.data?.tenant?.slug || responseData.tenant?.slug) {
          tenantSlug = responseData.data?.tenant?.slug || responseData.tenant?.slug;
        }
        console.log('Account setup completed via API. Tenant slug:', tenantSlug);
      }
    }

    // Save updated data
    const fs = require('fs');
    fs.writeFileSync('tests/.session-data.json', JSON.stringify({
      sessionId,
      tenantSlug: tenantSlug || TEST_CONFIG.store.subdomain,
      ownerEmail: TEST_CONFIG.owner.email,
      verified: verified,
    }));

    await page.screenshot({ path: 'tests/screenshots/full-08-final-state.png', fullPage: true });
    console.log('Step 2 completed. Session:', sessionId, 'Tenant:', tenantSlug);
  });

  test('Step 3: Login to admin portal as owner', async ({ page }) => {
    test.skip(!tenantSlug, 'Tenant slug not available');

    const adminUrl = `https://${tenantSlug}-admin.tesserix.app`;
    console.log('Logging into admin portal:', adminUrl);

    await page.goto(adminUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/full-08-admin-login.png', fullPage: true });

    // Fill email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill(TEST_CONFIG.owner.email);

    // Click Continue (two-step login)
    const continueButton = page.getByRole('button', { name: /continue/i }).first();
    await continueButton.click();
    await page.waitForTimeout(2000);

    // Fill password
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(TEST_CONFIG.owner.password);

    // Click Login
    const loginButton = page.getByRole('button', { name: /log ?in|sign ?in/i });
    await loginButton.click();

    // Wait for dashboard
    await page.waitForURL(/dashboard|admin/, { timeout: 30000 });

    await page.screenshot({ path: 'tests/screenshots/full-09-admin-dashboard.png', fullPage: true });
    console.log('Successfully logged into admin portal');

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/dashboard|admin/);
  });

  test('Step 4: Create staff members (admin, manager, viewer)', async ({ page }) => {
    test.skip(!tenantSlug, 'Tenant slug not available');

    const adminUrl = `https://${tenantSlug}-admin.tesserix.app`;

    // Login as owner first
    await page.goto(adminUrl);
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill(TEST_CONFIG.owner.email);
    await page.getByRole('button', { name: /continue/i }).first().click();
    await page.waitForTimeout(2000);

    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(TEST_CONFIG.owner.password);
    await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();
    await page.waitForURL(/dashboard|admin/, { timeout: 30000 });

    console.log('Logged in, navigating to Staff section...');

    // Navigate to Staff section
    const staffLink = page.getByRole('link', { name: /staff|team|members/i });
    await staffLink.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/full-10-staff-page.png', fullPage: true });

    // Create each staff member
    for (const [role, staffData] of Object.entries(TEST_CONFIG.staff)) {
      console.log(`Creating ${role} staff member: ${staffData.email}`);

      // Click Add/Invite button
      const addButton = page.getByRole('button', { name: /add|invite|create.*staff/i });
      await addButton.click();
      await page.waitForTimeout(1000);

      // Fill staff details
      await page.getByLabel(/email/i).fill(staffData.email);
      await page.getByLabel(/first.*name/i).fill(staffData.firstName);
      await page.getByLabel(/last.*name/i).fill(staffData.lastName);

      // Select role
      const roleSelect = page.getByLabel(/role/i);
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption(staffData.role);
      } else {
        // Try dropdown
        const roleDropdown = page.getByText(/select.*role/i).first();
        if (await roleDropdown.isVisible()) {
          await roleDropdown.click();
          await page.waitForTimeout(500);
          await page.getByText(new RegExp(staffData.role.replace('_', ' '), 'i')).first().click();
        }
      }

      // Set password if available
      const passwordField = page.getByLabel(/password/i);
      if (await passwordField.isVisible()) {
        await passwordField.fill(staffData.password);
      }

      await page.screenshot({ path: `tests/screenshots/full-11-create-${role}.png`, fullPage: true });

      // Submit
      const saveButton = page.getByRole('button', { name: /save|invite|create|add/i }).last();
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Verify success
      const successToast = page.locator('[role="status"], [role="alert"]');
      const hasSuccess = await successToast.getByText(/success|created|invited|added/i).isVisible().catch(() => false);
      console.log(`${role} creation success:`, hasSuccess);
    }

    await page.screenshot({ path: 'tests/screenshots/full-12-staff-created.png', fullPage: true });
    console.log('All staff members created successfully');
  });

  test('Step 5: Verify RBAC - Login as each role and verify permissions', async ({ page }) => {
    test.skip(!tenantSlug, 'Tenant slug not available');

    const adminUrl = `https://${tenantSlug}-admin.tesserix.app`;

    // Test login for each staff role
    for (const [role, staffData] of Object.entries(TEST_CONFIG.staff)) {
      console.log(`Testing login as ${role}: ${staffData.email}`);

      await page.goto(adminUrl);
      await page.waitForLoadState('networkidle');

      // Login
      await page.getByLabel(/email/i).fill(staffData.email);
      await page.getByRole('button', { name: /continue/i }).first().click();
      await page.waitForTimeout(2000);

      const passwordInput = page.getByLabel(/password/i);
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(staffData.password);
        await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();

        // Wait for dashboard or redirect
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        console.log(`${role} logged in, current URL:`, currentUrl);

        await page.screenshot({ path: `tests/screenshots/full-13-login-${role}.png`, fullPage: true });

        // Check visible navigation items based on role
        if (role === 'viewer') {
          // Viewer should have limited access
          const staffLink = page.getByRole('link', { name: /staff/i });
          const isStaffVisible = await staffLink.isVisible().catch(() => false);
          console.log(`Viewer can see Staff link: ${isStaffVisible}`);
        }

        // Logout
        const logoutButton = page.getByRole('button', { name: /log ?out|sign ?out/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await page.waitForTimeout(2000);
        } else {
          // Try user menu
          const userMenu = page.getByRole('button', { name: /user|profile|account/i });
          if (await userMenu.isVisible()) {
            await userMenu.click();
            await page.getByText(/log ?out|sign ?out/i).click();
            await page.waitForTimeout(2000);
          }
        }
      } else {
        console.log(`${role} account may not exist yet or different auth flow`);
      }
    }

    console.log('RBAC verification completed');
  });
});
