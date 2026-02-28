// Configuration for tenant-service integration
// NOTE: Frontend now uses Next.js API routes (BFF pattern) at /api/*
// Backend service URLs are configured server-side only (see app/api/lib/api-handler.ts)
export const config = {
  // API Configuration (BFF endpoints)
  api: {
    baseUrl: '/api', // Next.js API routes act as proxy
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // Application Configuration
  app: {
    name: 'Tenant Onboarding',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },

  // Onboarding Flow Configuration
  onboarding: {
    applicationType: 'ecommerce',
    steps: {
      business: 0,
      personal: 1,
      location: 2,
      storeSetup: 3,
      documents: 4,
      legal: 5,
      launch: 6,
    },
    totalSteps: 7,
  },

  // Feature Flags
  features: {
    enableEmailVerification: true,
    // Phone verification is disabled by default until SMS provider is configured
    enablePhoneVerification: process.env.NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION === 'true',
    enableBusinessValidation: true,
    enableProgressPersistence: true,
    enableAnalytics: process.env.NODE_ENV === 'production',
    // Document upload feature flags - controlled via environment variables
    documents: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_DOCUMENTS !== 'false',
      requireAddressProof: process.env.NEXT_PUBLIC_REQUIRE_ADDRESS_PROOF === 'true',
      requireBusinessProof: process.env.NEXT_PUBLIC_REQUIRE_BUSINESS_PROOF === 'true',
      requireLogo: process.env.NEXT_PUBLIC_REQUIRE_LOGO === 'true',
    },
  },

  // Document Upload Configuration
  documents: {
    maxFileSizeMB: 10,
    allowedTypes: {
      addressProof: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      businessProof: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      logo: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    },
    // Country-specific business document types
    businessDocumentTypes: {
      AU: [
        { value: 'abn', label: 'Australian Business Number (ABN)' },
        { value: 'acn', label: 'Australian Company Number (ACN)' },
        { value: 'tfn', label: 'Tax File Number (TFN)' },
      ],
      US: [
        { value: 'ein', label: 'Employer Identification Number (EIN)' },
        { value: 'ssn', label: 'Social Security Number (Last 4 digits)' },
        { value: 'business_license', label: 'Business License' },
      ],
      GB: [
        { value: 'crn', label: 'Companies House Registration Number' },
        { value: 'vat', label: 'VAT Registration Number' },
        { value: 'utr', label: 'Unique Taxpayer Reference (UTR)' },
      ],
      IN: [
        { value: 'gstin', label: 'GST Identification Number (GSTIN)' },
        { value: 'pan', label: 'Permanent Account Number (PAN)' },
        { value: 'cin', label: 'Corporate Identification Number (CIN)' },
      ],
      DEFAULT: [
        { value: 'business_registration', label: 'Business Registration Certificate' },
        { value: 'tax_id', label: 'Tax Identification Number' },
        { value: 'trade_license', label: 'Trade License' },
      ],
    },
    addressProofTypes: [
      { value: 'utility_bill', label: 'Utility Bill (Gas, Electric, Water)' },
      { value: 'bank_statement', label: 'Bank Statement' },
      { value: 'lease_agreement', label: 'Lease/Rental Agreement' },
      { value: 'government_letter', label: 'Government Correspondence' },
      { value: 'property_tax', label: 'Property Tax Receipt' },
    ],
  },

  // Verification Score Configuration (100 basis points total)
  verificationScore: {
    enabled: true,
    maxScore: 100,
    weights: {
      phoneVerified: 15,        // Phone verification (optional)
      businessInfoComplete: 20, // All business info filled
      addressComplete: 20,      // Address information complete
      addressProofUploaded: 15, // Address proof document
      businessProofUploaded: 15,// Business proof document
      logoUploaded: 5,          // Company logo
      storeConfigComplete: 10,  // Store setup complete
    },
    thresholds: {
      minimum: 30,   // Minimum to proceed (basic info)
      recommended: 60, // Recommended level
      verified: 85,  // Fully verified
    },
  },

  // UI Configuration
  ui: {
    theme: 'modern',
    animations: {
      enabled: true,
      duration: 300,
    },
    steps: {
      showProgress: true,
      allowBackNavigation: true,
      autoSave: true,
    },
  },

  // Validation Configuration
  validation: {
    debounceMs: 500,
    validateOnBlur: true,
    validateOnChange: false,
    showInlineErrors: true,
  },

  // Error Configuration
  errors: {
    retryAttempts: 3,
    showDetailedErrors: process.env.NODE_ENV === 'development',
    fallbackToOffline: false,
  },

  // Security Configuration
  security: {
    enableCSRF: true,
    enableXSSProtection: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
};

// Helper functions for configuration
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';

export const getApiUrl = (endpoint: string) => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // baseUrl is already '/api', so don't add /api again
  return `${baseUrl}${cleanEndpoint}`;
};

export const getStepConfig = (step: number) => {
  const stepNames = Object.keys(config.onboarding.steps);
  const stepName = stepNames[step];
  return {
    name: stepName,
    index: step,
    isFirst: step === 0,
    isLast: step === config.onboarding.totalSteps - 1,
    progress: Math.round(((step + 1) / config.onboarding.totalSteps) * 100),
  };
};

export default config;
