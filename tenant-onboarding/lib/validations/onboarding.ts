import { z } from 'zod';

// Business Information Schema - camelCase for frontend forms
export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(255, 'Business name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s&.-]+$/, 'Business name contains invalid characters'),

  businessType: z.enum(['sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit', 'other'], {
    message: 'Please select a business type',
  }),

  industryCategory: z
    .string()
    .min(1, 'Please select an industry category'),

  businessDescription: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  companyWebsite: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),

  businessRegistrationNumber: z
    .string()
    .optional(),

  // Existing store migration support
  hasExistingStore: z.boolean().optional(),
  existingStorePlatforms: z.array(z.string()).optional(),
  migrationInterest: z.boolean().optional(),
});

// Supported marketplace platforms for migration
export const MARKETPLACE_PLATFORMS = [
  { id: 'shopify', name: 'Shopify', icon: '🛍️' },
  { id: 'etsy', name: 'Etsy', icon: '🧶' },
  { id: 'amazon', name: 'Amazon', icon: '📦' },
  { id: 'temu', name: 'Temu', icon: '🛒' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🔌' },
  { id: 'squarespace', name: 'Squarespace', icon: '⬜' },
  { id: 'bigcommerce', name: 'BigCommerce', icon: '🏪' },
  { id: 'wix', name: 'Wix', icon: '✨' },
  { id: 'ebay', name: 'eBay', icon: '🏷️' },
  { id: 'other', name: 'Other', icon: '📱' },
] as const;

// Contact Details Schema - camelCase for frontend forms
export const contactDetailsSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase(),

  phoneCountryCode: z
    .string()
    .min(1, 'Please select a country code'),

  phoneNumber: z
    .string()
    .min(6, 'Please enter a valid phone number')
    .regex(/^[0-9\s()-]+$/, 'Please enter a valid phone number'),

  jobTitle: z
    .string()
    .min(1, 'Please select a job title'),
});

// Single Address Schema - reusable for both business and billing
export const addressSchema = z.object({
  streetAddress: z
    .string()
    .min(1, 'Street address is required')
    .max(255, 'Street address must be less than 255 characters'),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),

  state: z
    .string()
    .min(1, 'State/Province is required'),

  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters'),

  country: z
    .string()
    .min(1, 'Country is required'),
});

// Business Address Schema with billing address - camelCase for frontend forms
export const businessAddressSchema = z.object({
  // Business Address (required)
  streetAddress: z
    .string()
    .min(1, 'Street address is required')
    .max(255, 'Street address must be less than 255 characters'),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),

  state: z
    .string()
    .min(1, 'State/Province is required'),

  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters'),

  country: z
    .string()
    .min(1, 'Country is required'),

  // Flag to indicate address was confirmed from autocomplete
  addressConfirmed: z
    .boolean()
    .optional(),

  // Billing address same as business
  billingAddressSameAsBusiness: z
    .boolean()
    .default(true),

  // Billing Address (optional if same as business)
  billingStreetAddress: z
    .string()
    .max(255, 'Street address must be less than 255 characters')
    .optional(),

  billingCity: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional(),

  billingState: z
    .string()
    .optional(),

  billingPostalCode: z
    .string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional(),

  billingCountry: z
    .string()
    .optional(),

  billingAddressConfirmed: z
    .boolean()
    .optional(),
}).refine((data) => {
  // If billing address is NOT same as business, require billing address fields
  if (!data.billingAddressSameAsBusiness) {
    return (
      data.billingStreetAddress &&
      data.billingCity &&
      data.billingState &&
      data.billingPostalCode &&
      data.billingCountry
    );
  }
  return true;
}, {
  message: 'Billing address is required when different from business address',
  path: ['billingStreetAddress'],
});

// Business Model options
export const BUSINESS_MODELS = ['ONLINE_STORE', 'MARKETPLACE'] as const;
export type BusinessModel = typeof BUSINESS_MODELS[number];

// Store Setup Schema - for store configuration
export const storeSetupSchema = z.object({
  // Business model: single-vendor store or multi-vendor marketplace
  businessModel: z.enum(BUSINESS_MODELS, {
    message: 'Please select a business model',
  }).optional(),

  // Admin URL slug: {subdomain}-admin.tesserix.app
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Subdomain must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Subdomain must end with a letter or number'),

  // Storefront URL slug: {storefrontSlug}.tesserix.app
  storefrontSlug: z
    .string()
    .min(3, 'Storefront slug must be at least 3 characters')
    .max(50, 'Storefront slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Storefront slug can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Storefront slug must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Storefront slug must end with a letter or number'),

  currency: z
    .string()
    .length(3, 'Please select a currency')
    .regex(/^[A-Z]{3}$/, 'Invalid currency code'),

  timezone: z
    .string()
    .min(1, 'Please select a timezone'),

  language: z
    .string()
    .min(2, 'Please select a language')
    .max(5, 'Invalid language code'),

  logo: z
    .string()
    .url('Please upload a valid logo')
    .optional()
    .or(z.literal('')),

  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color')
    .optional()
    .or(z.literal('')),

  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color')
    .optional()
    .or(z.literal('')),
});

// Verification Schema
export const verificationSchema = z.object({
  emailCode: z
    .string()
    .length(6, 'Email verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers'),

  phoneCode: z
    .string()
    .length(6, 'Phone verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers'),
});

// Combined onboarding schema for final validation
export const onboardingSchema = z.object({
  businessInfo: businessInfoSchema,
  contactDetails: contactDetailsSchema,
  businessAddress: businessAddressSchema,
  storeSetup: storeSetupSchema,
});

// Type exports for use in components
export type BusinessInfoForm = z.infer<typeof businessInfoSchema>;
export type ContactDetailsForm = z.infer<typeof contactDetailsSchema>;
export type BusinessAddressForm = z.infer<typeof businessAddressSchema>;
export type StoreSetupForm = z.infer<typeof storeSetupSchema>;
export type VerificationForm = z.infer<typeof verificationSchema>;
export type OnboardingForm = z.infer<typeof onboardingSchema>;

// Validation utility functions
export const validateBusinessInfo = (data: unknown): BusinessInfoForm => {
  return businessInfoSchema.parse(data);
};

export const validateContactDetails = (data: unknown): ContactDetailsForm => {
  return contactDetailsSchema.parse(data);
};

export const validateBusinessAddress = (data: unknown): BusinessAddressForm => {
  return businessAddressSchema.parse(data);
};

export const validateStoreSetup = (data: unknown): StoreSetupForm => {
  return storeSetupSchema.parse(data);
};

export const validateVerification = (data: unknown): VerificationForm => {
  return verificationSchema.parse(data);
};

// Partial validation for step-by-step validation
export const validateBusinessInfoPartial = (data: unknown) => {
  return businessInfoSchema.partial().parse(data);
};

export const validateContactDetailsPartial = (data: unknown) => {
  return contactDetailsSchema.partial().parse(data);
};

export const validateBusinessAddressPartial = (data: unknown) => {
  return businessAddressSchema.partial().parse(data);
};

export const validateStoreSetupPartial = (data: unknown) => {
  return storeSetupSchema.partial().parse(data);
};
