import { test, expect, Page } from '@playwright/test';

/**
 * Tenant Onboarding E2E Tests - Australia Store (Custom Domain) & India Store (Tesserix Domain)
 *
 * Tests the complete tenant onboarding flow for:
 * 1. Australia Store - with custom domain yahvismartfarm.com
 * 2. India Store - with tesserix.app domain
 */

// Test data for Australia location with custom domain
const australiaTestData = {
  // Contact Details
  email: 'samyak.rout@gmail.com',
  firstName: 'James',
  lastName: 'Smith',
  phoneCountryCode: 'AU',
  phoneNumber: '0412345678',
  jobTitle: 'CEO/Founder',

  // Business Info
  businessName: 'Australia Store',
  businessType: 'Sole Proprietorship',
  industryCategory: 'Fashion & Apparel',
  businessDescription: 'A test store for Australia region with custom domain',

  // Address
  country: 'Australia',
  countryCode: 'AU',
  state: 'New South Wales',
  city: 'Sydney',
  streetAddress: '123 George Street',
  postalCode: '2000',

  // Store Setup - Custom Domain
  useCustomDomain: true,
  customDomain: 'yahvismartfarm.com',
  currency: 'AUD',
  timezone: 'Australia/Sydney',
  language: 'en',
};

// Test data for India location with tesserix.app domain
const indiaTestData = {
  // Contact Details
  email: 'samyak.rout@gmail.com',
  firstName: 'Mayur',
  lastName: 'Bhatt',
  phoneCountryCode: 'IN',
  phoneNumber: '9876543210',
  jobTitle: 'CEO/Founder',

  // Business Info
  businessName: 'India Store',
  businessType: 'Sole Proprietorship',
  industryCategory: 'Fashion & Apparel',
  businessDescription: 'A test store for India region with tesserix.app domain',

  // Address
  country: 'India',
  countryCode: 'IN',
  state: 'Maharashtra',
  city: 'Mumbai',
  streetAddress: '123 Test Street, Andheri West',
  postalCode: '400058',

  // Store Setup - Tesserix Domain
  useCustomDomain: false,
  subdomain: `indiastore${Date.now().toString().slice(-6)}`,
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  language: 'en',
};

test.describe('Tenant Onboarding - Australia Store (Custom Domain)', () => {
  test.setTimeout(180000); // 3 minutes for full flow

  test('should complete onboarding with custom domain yahvismartfarm.com', async ({ page }) => {
    const data = australiaTestData;

    // Clear storage before starting to ensure fresh state
    await page.goto('/onboarding');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    // Reload page after clearing storage
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Always try to click "Start fresh" if the banner exists (draft is stored server-side)
    const startFreshBtn = page.locator('button').filter({ hasText: /^Start fresh$/ });
    if (await startFreshBtn.count() > 0) {
      console.log('Found saved progress banner, clicking Start fresh...');
      await startFreshBtn.click();
      await page.waitForTimeout(3000);
      console.log('Clicked Start fresh to clear previous session');
    } else {
      console.log('No saved progress banner found, continuing...');
    }

    await page.screenshot({ path: 'tests/screenshots/aus-01-onboarding-start.png', fullPage: true });

    console.log('Starting Australia Store onboarding with custom domain...');

    // =====================
    // STEP 0: Business Info
    // =====================
    console.log('Step 0: Filling Business Info...');

    // Wait for form to be ready and banner to be gone
    const businessNameInput = page.locator('input[name="businessName"]');
    await businessNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await businessNameInput.clear();
    await businessNameInput.fill(data.businessName);
    console.log('Filled business name: ' + data.businessName);

    // Business Type
    const businessTypeDropdown = page.getByText('Select type').first();
    await businessTypeDropdown.click();
    await page.waitForTimeout(500);
    const soleProprietorOption = page.getByText('Sole Proprietorship').first();
    await soleProprietorOption.click();
    console.log('Selected business type');

    // Industry
    const industryDropdown = page.getByText('Select industry').first();
    await industryDropdown.click();
    await page.waitForTimeout(500);
    const fashionOption = page.getByText('Fashion & Apparel').first();
    await fashionOption.click();
    console.log('Selected industry');

    // Description
    const descriptionInput = page.locator('textarea[name="businessDescription"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(data.businessDescription);
    }

    await page.screenshot({ path: 'tests/screenshots/aus-02-business-info.png', fullPage: true });

    // Click the form's Continue button (scroll into view first)
    let continueBtn = page.locator('main button:has-text("Continue")');
    await continueBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await continueBtn.click({ force: true });
    console.log('Clicked Continue after Business Info');

    // Wait for loading to complete - wait until either firstName appears or button stops loading
    await page.waitForTimeout(5000);

    // Check if saved progress banner appeared
    const savedProgressCheck = page.locator('text=We found your saved progress');
    if (await savedProgressCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Saved progress banner appeared, clicking Continue to resume...');
      const bannerContinue = page.locator('button:has-text("Continue")').first();
      await bannerContinue.click({ force: true });
      console.log('Clicked banner Continue');

      // Wait for banner to be handled and loading to complete
      await page.waitForTimeout(5000);

      // Check if we're still on step 0 - if so, click Continue again
      const stillOnBusinessStep = await page.locator('text=Tell us about your business').isVisible().catch(() => false);
      if (stillOnBusinessStep) {
        console.log('Still on step 0, clicking Continue again to advance...');
        continueBtn = page.locator('main button:has-text("Continue")');
        await continueBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await continueBtn.click({ force: true });
        await page.waitForTimeout(5000);
      }
    }

    // Take screenshot to debug
    await page.screenshot({ path: 'tests/screenshots/aus-03-after-continue.png', fullPage: true });

    // ======================
    // STEP 1: Contact Details
    // ======================
    console.log('Step 1: Filling Contact Details...');

    // Wait for the Contact Details step to load (firstName field should appear)
    const firstNameInputAus = page.locator('input[name="firstName"]');
    await firstNameInputAus.waitFor({ state: 'visible', timeout: 60000 });
    console.log('Contact Details step loaded');

    await firstNameInputAus.fill(data.firstName);
    await page.locator('input[name="lastName"]').fill(data.lastName);
    await page.locator('input[name="email"]').fill(data.email);

    // Phone Country Code
    const phoneCodeDropdown = page.locator('[name="phoneCountryCode"]')
      .or(page.getByText(/\+1|\+61|US|AU/).first());
    if (await phoneCodeDropdown.isVisible()) {
      await phoneCodeDropdown.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('Australia');
        await page.waitForTimeout(500);
      }
      const ausOption = page.getByText(/Australia.*\+61|\+61.*Australia/i).first();
      if (await ausOption.isVisible()) {
        await ausOption.click();
      }
    }

    await page.locator('input[name="phoneNumber"]').fill(data.phoneNumber);

    // Job Title
    const jobTitleDropdown = page.getByText(/select.*title|select.*role/i).first();
    if (await jobTitleDropdown.isVisible()) {
      await jobTitleDropdown.click();
      await page.waitForTimeout(500);
      const ceoOption = page.getByText(/CEO.*Founder|Founder/i).first();
      if (await ceoOption.isVisible()) {
        await ceoOption.click();
      }
    }

    await page.screenshot({ path: 'tests/screenshots/aus-03-contact-details.png', fullPage: true });

    const continueBtn2 = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn2.click();
    await page.waitForTimeout(2000);

    // ================
    // STEP 2: Address
    // ================
    console.log('Step 2: Filling Address...');

    // Country
    const countryDropdown = page.getByText(/select.*country/i).first();
    if (await countryDropdown.isVisible()) {
      await countryDropdown.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Australia');
        await page.waitForTimeout(500);
      }
      const ausCountry = page.getByText(/^Australia$/i).first();
      if (await ausCountry.isVisible()) {
        await ausCountry.click();
      }
    }

    await page.waitForTimeout(1000);

    // State
    const stateDropdown = page.getByText(/select.*state|select.*province/i).first();
    if (await stateDropdown.isVisible()) {
      await stateDropdown.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('New South Wales');
        await page.waitForTimeout(500);
      }
      const nswOption = page.getByText(/New South Wales/i).first();
      if (await nswOption.isVisible()) {
        await nswOption.click();
      }
    }

    await page.locator('input[name="city"]').fill(data.city);
    await page.locator('input[name="streetAddress"]').fill(data.streetAddress);
    await page.locator('input[name="postalCode"]').fill(data.postalCode);

    await page.screenshot({ path: 'tests/screenshots/aus-04-address.png', fullPage: true });

    const continueBtn3 = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn3.click();
    await page.waitForTimeout(2000);

    // ===================
    // STEP 3: Store Setup with Custom Domain
    // ===================
    console.log('Step 3: Configuring Store with Custom Domain...');

    // Enable Custom Domain
    const customDomainToggle = page.getByText(/use.*custom.*domain|custom.*domain/i).first()
      .or(page.locator('button').filter({ hasText: /custom/i }).first());

    if (await customDomainToggle.isVisible()) {
      await customDomainToggle.click();
      await page.waitForTimeout(500);
      console.log('Clicked custom domain toggle');
    }

    // Fill custom domain
    const customDomainInput = page.locator('input[name="customDomain"]');
    if (await customDomainInput.isVisible()) {
      await customDomainInput.clear();
      await customDomainInput.fill(data.customDomain);
      console.log('Filled custom domain: ' + data.customDomain);
    }

    // Currency (should auto-populate)
    const currencyValue = await page.locator('input[name="currency"], button:has-text("AUD")').first().isVisible();
    if (!currencyValue) {
      const currencyDropdown = page.getByText(/select.*currency/i).first();
      if (await currencyDropdown.isVisible()) {
        await currencyDropdown.click();
        await page.waitForTimeout(500);
        const audOption = page.getByText(/AUD|Australian Dollar/i).first();
        if (await audOption.isVisible()) {
          await audOption.click();
        }
      }
    }

    await page.screenshot({ path: 'tests/screenshots/aus-05-store-setup-custom-domain.png', fullPage: true });

    // Launch Store
    const launchBtn = page.getByRole('button', { name: /launch|create|submit|complete|finish/i });
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
      console.log('Clicked Launch Store');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/aus-06-after-submit.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Current URL after submission:', currentUrl);

    const isOnVerifyPage = currentUrl.includes('/verify') || currentUrl.includes('/success');
    console.log('On verify/success page:', isOnVerifyPage);

    await page.screenshot({ path: 'tests/screenshots/aus-07-final.png', fullPage: true });
  });
});

test.describe('Tenant Onboarding - India Store (Tesserix Domain)', () => {
  test.setTimeout(180000);

  test('should complete onboarding with tesserix.app domain', async ({ page }) => {
    const data = indiaTestData;

    // Clear storage before starting to ensure fresh state
    await page.goto('/onboarding');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    // Reload page after clearing storage
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Always try to click "Start fresh" if the banner exists (draft is stored server-side)
    const startFreshBtnInd = page.locator('button').filter({ hasText: /^Start fresh$/ });
    if (await startFreshBtnInd.count() > 0) {
      console.log('Found saved progress banner, clicking Start fresh...');
      await startFreshBtnInd.click();
      await page.waitForTimeout(3000);
      console.log('Clicked Start fresh to clear previous session');
    } else {
      console.log('No saved progress banner found, continuing...');
    }

    await page.screenshot({ path: 'tests/screenshots/ind-01-onboarding-start.png', fullPage: true });

    console.log('Starting India Store onboarding with tesserix.app domain...');

    // =====================
    // STEP 0: Business Info
    // =====================
    console.log('Step 0: Filling Business Info...');

    // Wait for form to be ready
    const businessNameInputInd = page.locator('input[name="businessName"]');
    await businessNameInputInd.waitFor({ state: 'visible', timeout: 15000 });
    await businessNameInputInd.clear();
    await businessNameInputInd.fill(data.businessName);

    const businessTypeDropdown = page.getByText('Select type').first();
    await businessTypeDropdown.click();
    await page.waitForTimeout(500);
    const soleProprietorOption = page.getByText('Sole Proprietorship').first();
    await soleProprietorOption.click();

    const industryDropdown = page.getByText('Select industry').first();
    await industryDropdown.click();
    await page.waitForTimeout(500);
    const fashionOption = page.getByText('Fashion & Apparel').first();
    await fashionOption.click();

    const descriptionInput = page.locator('textarea[name="businessDescription"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(data.businessDescription);
    }

    await page.screenshot({ path: 'tests/screenshots/ind-02-business-info.png', fullPage: true });

    // Click the form's Continue button (scroll into view first)
    let continueBtnInd = page.locator('main button:has-text("Continue")');
    await continueBtnInd.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await continueBtnInd.click({ force: true });
    console.log('Clicked Continue after Business Info');

    // Wait for loading to complete
    await page.waitForTimeout(5000);

    // Check if saved progress banner appeared
    const savedProgressCheckInd = page.locator('text=We found your saved progress');
    if (await savedProgressCheckInd.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Saved progress banner appeared, clicking Continue to resume...');
      const bannerContinueInd = page.locator('button:has-text("Continue")').first();
      await bannerContinueInd.click({ force: true });
      console.log('Clicked banner Continue');

      // Wait for banner to be handled and loading to complete
      await page.waitForTimeout(5000);

      // Check if we're still on step 0 - if so, click Continue again
      const stillOnBusinessStepInd = await page.locator('text=Tell us about your business').isVisible().catch(() => false);
      if (stillOnBusinessStepInd) {
        console.log('Still on step 0, clicking Continue again to advance...');
        continueBtnInd = page.locator('main button:has-text("Continue")');
        await continueBtnInd.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await continueBtnInd.click({ force: true });
        await page.waitForTimeout(5000);
      }
    }

    // Take screenshot to debug
    await page.screenshot({ path: 'tests/screenshots/ind-03-after-continue.png', fullPage: true });

    // ======================
    // STEP 1: Contact Details
    // ======================
    console.log('Step 1: Filling Contact Details...');

    // Wait for the Contact Details step to load
    const firstNameInputInd = page.locator('input[name="firstName"]');
    await firstNameInputInd.waitFor({ state: 'visible', timeout: 60000 });
    console.log('Contact Details step loaded');

    await firstNameInputInd.fill(data.firstName);
    await page.locator('input[name="lastName"]').fill(data.lastName);
    await page.locator('input[name="email"]').fill(data.email);

    // Phone Country Code - India
    const phoneCodeDropdownInd = page.locator('[name="phoneCountryCode"]')
      .or(page.getByText(/\+1|\+91|US|IN/).first());
    if (await phoneCodeDropdownInd.isVisible()) {
      await phoneCodeDropdownInd.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('India');
        await page.waitForTimeout(500);
      }
      const indiaOption = page.getByText(/India.*\+91|\+91.*India/i).first();
      if (await indiaOption.isVisible()) {
        await indiaOption.click();
      }
    }

    await page.locator('input[name="phoneNumber"]').fill(data.phoneNumber);

    const jobTitleDropdown = page.getByText(/select.*title|select.*role/i).first();
    if (await jobTitleDropdown.isVisible()) {
      await jobTitleDropdown.click();
      await page.waitForTimeout(500);
      const ceoOption = page.getByText(/CEO.*Founder|Founder/i).first();
      if (await ceoOption.isVisible()) {
        await ceoOption.click();
      }
    }

    await page.screenshot({ path: 'tests/screenshots/ind-03-contact-details.png', fullPage: true });

    const continueBtn2 = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn2.click();
    await page.waitForTimeout(2000);

    // ================
    // STEP 2: Address
    // ================
    console.log('Step 2: Filling Address...');

    const countryDropdown = page.getByText(/select.*country/i).first();
    if (await countryDropdown.isVisible()) {
      await countryDropdown.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('India');
        await page.waitForTimeout(500);
      }
      const indiaCountry = page.getByText(/^India$/i).first();
      if (await indiaCountry.isVisible()) {
        await indiaCountry.click();
      }
    }

    await page.waitForTimeout(1000);

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
      }
    }

    await page.locator('input[name="city"]').fill(data.city);
    await page.locator('input[name="streetAddress"]').fill(data.streetAddress);
    await page.locator('input[name="postalCode"]').fill(data.postalCode);

    await page.screenshot({ path: 'tests/screenshots/ind-04-address.png', fullPage: true });

    const continueBtn3 = page.getByRole('main').getByRole('button', { name: 'Continue' });
    await continueBtn3.click();
    await page.waitForTimeout(2000);

    // ===================
    // STEP 3: Store Setup with Tesserix Domain
    // ===================
    console.log('Step 3: Configuring Store with Tesserix.app domain...');

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
    }

    // Currency (should auto-populate as INR)
    const currencyDropdown = page.getByText(/select.*currency|INR/i).first();
    if (await currencyDropdown.isVisible()) {
      await currencyDropdown.click();
      await page.waitForTimeout(500);
      const inrOption = page.getByText(/INR|Indian Rupee/i).first();
      if (await inrOption.isVisible()) {
        await inrOption.click();
      }
    }

    // Timezone (should auto-populate as Asia/Kolkata)
    const timezoneDropdown = page.getByText(/select.*timezone|Kolkata/i).first();
    if (await timezoneDropdown.isVisible()) {
      await timezoneDropdown.click();
      await page.waitForTimeout(500);
      const kolkataOption = page.getByText(/Kolkata|India Standard/i).first();
      if (await kolkataOption.isVisible()) {
        await kolkataOption.click();
      }
    }

    await page.screenshot({ path: 'tests/screenshots/ind-05-store-setup.png', fullPage: true });

    // Launch Store
    const launchBtn = page.getByRole('button', { name: /launch|create|submit|complete|finish/i });
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
      console.log('Clicked Launch Store');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/ind-06-after-submit.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Current URL after submission:', currentUrl);

    const isOnVerifyPage = currentUrl.includes('/verify') || currentUrl.includes('/success');
    console.log('On verify/success page:', isOnVerifyPage);

    await page.screenshot({ path: 'tests/screenshots/ind-07-final.png', fullPage: true });
  });
});
