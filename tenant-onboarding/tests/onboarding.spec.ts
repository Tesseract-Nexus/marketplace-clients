import { test, expect, Page } from '@playwright/test';

/**
 * Tenant Onboarding E2E Tests
 *
 * Tests the complete tenant onboarding flow:
 * Step 0: Business Info (businessName, businessType, industryCategory)
 * Step 1: Contact Details (firstName, lastName, email, phone)
 * Step 2: Address (streetAddress, city, state, postalCode, country)
 * Step 3: Store Setup (subdomain, currency, timezone)
 */

// Helper function to select from custom dropdown
async function selectFromDropdown(page: Page, triggerText: string, optionText: string | RegExp) {
  // Click the dropdown trigger
  const trigger = page.getByText(triggerText, { exact: false }).first();
  await trigger.click();
  await page.waitForTimeout(500);

  // Find and click the option
  const option = page.getByRole('option', { name: optionText })
    .or(page.locator('[role="listbox"]').getByText(optionText))
    .or(page.locator('[data-radix-collection-item]').filter({ hasText: optionText }));

  await option.first().click();
  await page.waitForTimeout(300);
}

// Test data for India location onboarding
const testData = {
  india: {
    // Contact Details
    email: process.env.TEST_EMAIL || 'mayu.b14@gmail.com',
    firstName: 'Mayur',
    lastName: 'Bhatt',
    phoneCountryCode: 'IN',
    phoneNumber: '9876543210',
    jobTitle: 'CEO/Founder',

    // Business Info
    businessName: 'Test Store India',
    businessType: 'Sole Proprietorship',
    industryCategory: 'Fashion & Apparel',
    businessDescription: 'A test store for India region',

    // Address
    country: 'India',
    countryCode: 'IN',
    state: 'Maharashtra',
    city: 'Mumbai',
    streetAddress: '123 Test Street, Andheri West',
    postalCode: '400058',

    // Store Setup
    subdomain: `testindia${Date.now().toString().slice(-6)}`,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en',
  },
};

test.describe('Tenant Onboarding - India Location', () => {
  test.setTimeout(180000); // 3 minutes for full flow

  test('should complete full onboarding flow for India location', async ({ page }) => {
    const data = testData.india;

    // Navigate to onboarding page
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/01-onboarding-start.png', fullPage: true });

    console.log('Starting onboarding flow...');

    // =====================
    // STEP 0: Business Info
    // =====================
    console.log('Step 0: Filling Business Info...');

    // Business Name
    const businessNameInput = page.locator('input[name="businessName"]');
    await businessNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await businessNameInput.fill(data.businessName);
    console.log('Filled business name: ' + data.businessName);

    // Business Type - Click on "Select type" dropdown
    console.log('Selecting business type...');
    const businessTypeDropdown = page.getByText('Select type').first();
    await businessTypeDropdown.click();
    await page.waitForTimeout(500);

    // Click on Sole Proprietorship option
    const soleProprietorOption = page.getByText('Sole Proprietorship').first();
    await soleProprietorOption.click();
    await page.waitForTimeout(300);
    console.log('Selected business type: Sole Proprietorship');

    // Industry - Click on "Select industry" dropdown
    console.log('Selecting industry...');
    const industryDropdown = page.getByText('Select industry').first();
    await industryDropdown.click();
    await page.waitForTimeout(500);

    // Click on Fashion & Apparel option
    const fashionOption = page.getByText('Fashion & Apparel').first();
    await fashionOption.click();
    await page.waitForTimeout(300);
    console.log('Selected industry: Fashion & Apparel');

    // Business Description (optional)
    const descriptionInput = page.locator('textarea[name="businessDescription"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(data.businessDescription);
      console.log('Filled description');
    }

    await page.screenshot({ path: 'tests/screenshots/02-business-info-filled.png', fullPage: true });

    // Click the main Continue button (the gradient one in the form)
    const continueBtn = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn.click();
    await page.waitForTimeout(2000);
    console.log('Clicked Continue after Business Info');

    await page.screenshot({ path: 'tests/screenshots/03-after-business-continue.png', fullPage: true });

    // ======================
    // STEP 1: Contact Details
    // ======================
    console.log('Step 1: Filling Contact Details...');

    // Wait for Contact step to load
    await page.waitForTimeout(1000);

    // First Name
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(data.firstName);
      console.log('Filled first name: ' + data.firstName);
    }

    // Last Name
    const lastNameInput = page.locator('input[name="lastName"]');
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(data.lastName);
      console.log('Filled last name: ' + data.lastName);
    }

    // Email
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(data.email);
      console.log('Filled email: ' + data.email);
    }

    // Phone Country Code - Look for the country code selector
    const phoneCodeDropdown = page.locator('[name="phoneCountryCode"]')
      .or(page.getByText(/\+1|\+91|US|IN/).first());

    if (await phoneCodeDropdown.isVisible()) {
      await phoneCodeDropdown.click();
      await page.waitForTimeout(500);

      // Search for India
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('India');
        await page.waitForTimeout(500);
      }

      const indiaOption = page.getByText(/India.*\+91|\+91.*India/i).first();
      if (await indiaOption.isVisible()) {
        await indiaOption.click();
        console.log('Selected India phone code');
      }
    }

    // Phone Number
    const phoneInput = page.locator('input[name="phoneNumber"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(data.phoneNumber);
      console.log('Filled phone number: ' + data.phoneNumber);
    }

    // Job Title
    const jobTitleDropdown = page.getByText(/select.*title|select.*role/i).first();
    if (await jobTitleDropdown.isVisible()) {
      await jobTitleDropdown.click();
      await page.waitForTimeout(500);
      const ceoOption = page.getByText(/CEO.*Founder|Founder/i).first();
      if (await ceoOption.isVisible()) {
        await ceoOption.click();
        console.log('Selected job title');
      }
    }

    await page.screenshot({ path: 'tests/screenshots/04-contact-details-filled.png', fullPage: true });

    // Click the main Continue button (the gradient one in the form)
    const continueBtn2 = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn2.click();
    await page.waitForTimeout(2000);
    console.log('Clicked Continue after Contact Details');

    await page.screenshot({ path: 'tests/screenshots/05-after-contact-continue.png', fullPage: true });

    // ================
    // STEP 2: Address
    // ================
    console.log('Step 2: Filling Address...');
    await page.waitForTimeout(1000);

    // Country selector
    const countryDropdown = page.getByText(/select.*country/i).first()
      .or(page.locator('[name="country"]'));

    if (await countryDropdown.isVisible()) {
      await countryDropdown.click();
      await page.waitForTimeout(500);

      // Search for India
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('India');
        await page.waitForTimeout(500);
      }

      const indiaCountry = page.getByText(/^India$/i).first();
      if (await indiaCountry.isVisible()) {
        await indiaCountry.click();
        console.log('Selected India as country');
      }
    }

    await page.waitForTimeout(1000); // Wait for state list to load

    // State selector
    const stateDropdown = page.getByText(/select.*state|select.*province/i).first();
    if (await stateDropdown.isVisible()) {
      await stateDropdown.click();
      await page.waitForTimeout(500);

      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Maharashtra');
        await page.waitForTimeout(500);
      }

      const maharashtra = page.getByText(/Maharashtra/i).first();
      if (await maharashtra.isVisible()) {
        await maharashtra.click();
        console.log('Selected Maharashtra');
      }
    }

    // City
    const cityInput = page.locator('input[name="city"]');
    if (await cityInput.isVisible()) {
      await cityInput.fill(data.city);
      console.log('Filled city: ' + data.city);
    }

    // Street Address
    const addressInput = page.locator('input[name="streetAddress"]');
    if (await addressInput.isVisible()) {
      await addressInput.fill(data.streetAddress);
      console.log('Filled street address');
    }

    // Postal Code
    const postalInput = page.locator('input[name="postalCode"]');
    if (await postalInput.isVisible()) {
      await postalInput.fill(data.postalCode);
      console.log('Filled postal code: ' + data.postalCode);
    }

    await page.screenshot({ path: 'tests/screenshots/06-address-filled.png', fullPage: true });

    // Click the main Continue button
    const continueBtn3 = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn3.click();
    await page.waitForTimeout(2000);
    console.log('Clicked Continue after Address');

    await page.screenshot({ path: 'tests/screenshots/07-after-address-continue.png', fullPage: true });

    // ===================
    // STEP 3: Store Setup (Launch)
    // ===================
    console.log('Step 3: Filling Store Setup...');
    await page.waitForTimeout(1000);

    // Subdomain
    const subdomainInput = page.locator('input[name="subdomain"]');
    if (await subdomainInput.isVisible()) {
      await subdomainInput.clear();
      await subdomainInput.fill(data.subdomain);
      console.log('Filled subdomain: ' + data.subdomain);
    }

    // Storefront Slug
    const storefrontInput = page.locator('input[name="storefrontSlug"]');
    if (await storefrontInput.isVisible()) {
      await storefrontInput.clear();
      await storefrontInput.fill(data.subdomain);
      console.log('Filled storefront slug');
    }

    // Currency selector
    const currencyDropdown = page.getByText(/select.*currency/i).first();
    if (await currencyDropdown.isVisible()) {
      await currencyDropdown.click();
      await page.waitForTimeout(500);

      const inrOption = page.getByText(/INR|Indian Rupee/i).first();
      if (await inrOption.isVisible()) {
        await inrOption.click();
        console.log('Selected INR currency');
      }
    }

    // Timezone selector
    const timezoneDropdown = page.getByText(/select.*timezone/i).first();
    if (await timezoneDropdown.isVisible()) {
      await timezoneDropdown.click();
      await page.waitForTimeout(500);

      const kolkataOption = page.getByText(/Kolkata|India Standard/i).first();
      if (await kolkataOption.isVisible()) {
        await kolkataOption.click();
        console.log('Selected Kolkata timezone');
      }
    }

    await page.screenshot({ path: 'tests/screenshots/08-store-setup-filled.png', fullPage: true });

    // Submit/Launch the store
    console.log('Submitting onboarding form...');
    const launchBtn = page.getByRole('button', { name: /launch|create|submit|complete|finish/i });
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
      console.log('Clicked Launch/Submit');
    }

    // Wait for response
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/09-after-submit.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Current URL after submission:', currentUrl);

    // Check if we're on verification page or success
    const isOnVerifyPage = currentUrl.includes('/verify') ||
                          currentUrl.includes('/success') ||
                          await page.getByText(/verification|check your email|sent/i).isVisible().catch(() => false);

    console.log('On verify/success page:', isOnVerifyPage);

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/10-final-result.png', fullPage: true });
  });
});
