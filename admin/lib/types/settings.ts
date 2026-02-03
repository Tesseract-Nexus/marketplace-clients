// ==========================================
// SETTINGS SERVICE TYPES
// ==========================================

import type { CancellationSettings } from './cancellation';
export type { CancellationSettings } from './cancellation';

export interface SettingsContext {
  tenantId?: string; // Optional - when not provided, uses x-jwt-claim-tenant-id header
  applicationId: string;
  userId?: string;
  scope: 'global' | 'tenant' | 'application' | 'user';
}

// Legacy branding settings (kept for backwards compatibility)
export interface BrandingSettingsLegacy {
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  brandColors: Record<string, any>;
  fonts: Record<string, any>;
  metadata: Record<string, any>;
}

// Admin Panel Branding Settings (full structure)
export interface AdminBrandingGeneral {
  adminTitle: string;
  adminSubtitle: string;
  logoUrl: string;
  faviconUrl: string;
  loginPageTitle: string;
  loginPageSubtitle: string;
}

export interface AdminBrandingColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActiveText: string;
  headerBg: string;
  headerText: string;
}

export interface AdminBrandingAppearance {
  sidebarStyle: 'dark' | 'light' | 'gradient';
  headerStyle: 'light' | 'dark' | 'transparent';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'xl';
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'system';
  compactMode: boolean;
  showBreadcrumbs: boolean;
  showSearch: boolean;
  animationsEnabled: boolean;
}

export interface AdminBrandingAdvanced {
  customCss: string;
  customLogo: boolean;
  showPoweredBy: boolean;
  enableCustomFonts: boolean;
  customFontUrl: string;
}

export interface AdminBrandingSettings {
  general: AdminBrandingGeneral;
  colors: AdminBrandingColors;
  appearance: AdminBrandingAppearance;
  advanced: AdminBrandingAdvanced;
}

// BrandingSettings type - uses the full admin branding structure
export type BrandingSettings = AdminBrandingSettings;

export interface ThemeSettings {
  colorMode: 'light' | 'dark' | 'auto';
  colorScheme: string;
  customColors?: Record<string, any>;
  borderRadius: number;
  fontScale: number;
  customCss?: string;
}

export interface LayoutSettings {
  sidebar: Record<string, any>;
  navigation: Record<string, any>;
  header: Record<string, any>;
  page: Record<string, any>;
  footer: Record<string, any>;
}

export interface AnimationSettings {
  globalSpeed: 'slow' | 'normal' | 'fast' | 'disabled';
  transitions: Record<string, any>;
  effects: Record<string, any>;
  pageTransitions: Record<string, any>;
  reducedMotion: boolean;
}

export interface LocalizationSettings {
  language: string;
  region: string;
  currency: Record<string, any>;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: Record<string, any>;
  rtl: boolean;
}

export interface FeatureSettings {
  flags: Record<string, any>;
  modules: Record<string, any>;
  integrations: Record<string, any>;
}

export interface UserPreferences {
  dashboard: Record<string, any>;
  notifications: Record<string, any>;
  privacy: Record<string, any>;
  accessibility: Record<string, any>;
}

export interface ApplicationSettings {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  apiEndpoints: Record<string, any>;
  security: Record<string, any>;
  performance: Record<string, any>;
}

// ==========================================
// ECOMMERCE SETTINGS TYPES
// ==========================================

export interface StoreInformation {
  name: string;
  tagline?: string;
  description?: string;
  logo?: {
    url: string;
    width: number;
    height: number;
    altText: string;
  };
  contactEmail: string;
  supportEmail?: string;
  salesEmail?: string;
  supportPhone?: string;
  address: {
    businessName: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  businessHours?: {
    timezone: string;
    schedule: Record<string, any>;
    holidays?: Array<{
      name: string;
      date: string;
      allDay: boolean;
    }>;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  legal?: {
    businessRegistrationNumber?: string;
    taxId?: string;
    businessType?: string;
  };
}

export interface CatalogSettings {
  categories: {
    maxDepth: number;
    enableImages: boolean;
    enableDescriptions: boolean;
    displayType: 'grid' | 'list';
    sortOptions: string[];
  };
  products: {
    skuFormat: string;
    enableVariants: boolean;
    enableBundles: boolean;
    enableDigitalProducts: boolean;
    enableSubscriptions: boolean;
    enableCustomizations: boolean;
    maxImages: number;
    maxVideos: number;
    enableReviews: boolean;
    enableRatings: boolean;
    enableWishlist: boolean;
    enableComparisons: boolean;
    sortOptions: string[];
  };
  search: {
    enableAutoComplete: boolean;
    enableSearchSuggestions: boolean;
    enableFacetedSearch: boolean;
    enableSearchAnalytics: boolean;
    searchResultsPerPage: number;
    enableSpellCheck: boolean;
    enableSynonyms: boolean;
  };
}

export interface InventorySettings {
  tracking: {
    enabled: boolean;
    trackByVariant: boolean;
    trackByLocation: boolean;
    enableSerialNumbers: boolean;
    enableBatchTracking: boolean;
    enableExpirationDates: boolean;
  };
  stockLevels: {
    lowStockThreshold: number;
    criticalStockThreshold: number;
    overStockThreshold: number;
    autoReorderEnabled: boolean;
    autoReorderQuantity: number;
    autoReorderThreshold: number;
  };
  availability: {
    allowBackorders: boolean;
    backorderLimit: number;
    outOfStockBehavior: 'hide' | 'show_notify' | 'show_disabled';
    preorderEnabled: boolean;
    showStockQuantity: boolean;
    stockDisplayThreshold: number;
  };
  reservations: {
    cartReservationTimeout: number;
    checkoutReservationTimeout: number;
    enableStockReservations: boolean;
  };
}

export interface PricingSettings {
  display: {
    showPrices: boolean;
    requireLoginForPrices: boolean;
    showCompareAtPrices: boolean;
    showSavingsAmount: boolean;
    showSavingsPercentage: boolean;
    priceFormat: string;
    showPricesWithTax: boolean;
    showBothPrices: boolean;
  };
  tax: {
    enabled: boolean;
    calculation: 'inclusive' | 'exclusive';
    defaultRate: number;
    compoundTax: boolean;
    taxShipping: boolean;
    digitalGoodsTax: boolean;
    exemptRoles: string[];
  };
  rounding: {
    strategy: 'round' | 'ceil' | 'floor' | 'nickel';
    precision: number;
    roundToNearest: number;
  };
  discounts: {
    enableCoupons: boolean;
    enableAutomaticDiscounts: boolean;
    enableBulkPricing: boolean;
    enableTieredPricing: boolean;
    maxDiscountPercent: number;
    stackableDiscounts: boolean;
  };
  currencies: {
    primary: string;
    supported: string[];
    autoConversion: boolean;
    conversionProvider?: string;
    conversionMarkup?: number;
  };
}

export interface OrderSettings {
  numbering: {
    format: string;
    prefix: string;
    startingNumber: number;
    resetAnnually: boolean;
  };
  processing: {
    autoConfirm: boolean;
    requireManualReview: boolean;
    manualReviewThreshold: number;
    autoCapture: boolean;
    autoFulfill: boolean;
    sendConfirmationEmail: boolean;
  };
  limits: {
    minimumOrderAmount: number;
    maximumOrderAmount: number;
    maxItemsPerOrder: number;
    maxQuantityPerItem: number;
    dailyOrderLimit: number;
  };
  checkout: {
    guestCheckoutEnabled: boolean;
    requireAccountCreation: boolean;
    enableExpressCheckout: boolean;
    enableOneClickCheckout: boolean;
    collectPhoneNumber: boolean;
    enableGiftMessages: boolean;
    enableGiftWrap: boolean;
    giftWrapFee: number;
  };
  editing: {
    allowEditing: boolean;
    editTimeLimit: number;
    allowCancellation: boolean;
    cancellationTimeLimit: number;
    allowAddressChange: boolean;
    allowItemModification: boolean;
  };
}

export interface ShippingSettings {
  general: {
    enabled: boolean;
    enableLocalDelivery: boolean;
    enableStorePickup: boolean;
    enableInternational: boolean;
    defaultMethod: string;
  };
  calculation: {
    calculationMethod: 'flat_rate' | 'weight_based' | 'price_based' | 'dimensional';
    includeVirtualItems: boolean;
    combineShipping: boolean;
    useHighestRate: boolean;
  };
  freeShipping: {
    enabled: boolean;
    threshold: number;
    excludeDiscountedAmount: boolean;
    applicableCountries: string[];
    requireCouponCode: boolean;
  };
  zones: Record<string, {
    name: string;
    countries: string[];
    methods: Array<{
      name: string;
      code: string;
      rate: number;
      estimatedDays: string;
      enabled: boolean;
    }>;
  }>;
  tracking: {
    enabled: boolean;
    autoSendTracking: boolean;
    trackingUrlTemplate: string;
    enableDeliveryConfirmation: boolean;
  };
}

export interface ReturnsSettings {
  policy: {
    enabled: boolean;
    period: number;
    extendedPeriodForMembers: number;
    requireOriginalPackaging: boolean;
    requireReceipt: boolean;
    allowPartialReturns: boolean;
    allowExchanges: boolean;
    allowStoreCredit: boolean;
  };
  costs: {
    returnShippingPaidBy: 'customer' | 'merchant' | 'shared';
    restockingFee: number;
    restockingFeePercent: number;
    returnProcessingFee: number;
    freeReturnThreshold: number;
  };
  processing: {
    autoApproval: boolean;
    requireReasonCode: boolean;
    requirePhotos: boolean;
    enableReturnMerchandiseAuth: boolean;
    notifyOnReturn: boolean;
    autoRefundOnReceive: boolean;
  };
  exclusions: {
    finalSaleItems: boolean;
    personalizedItems: boolean;
    perishableItems: boolean;
    digitalItems: boolean;
    giftCards: boolean;
    customItems: boolean;
  };
}

export interface CheckoutSettings {
  cart: {
    enablePersistentCart: boolean;
    cartExpirationDays: number;
    enableCartRecovery: boolean;
    cartRecoveryDelayHours: number;
    enableCrossSell: boolean;
    enableUpsell: boolean;
    enableRecentlyViewed: boolean;
    enableSaveForLater: boolean;
    maxCartItems: number;
  };
  flow: {
    steps: string[];
    enableStepSkipping: boolean;
    showProgressIndicator: boolean;
    enableBreadcrumbs: boolean;
    mobileOptimized: boolean;
  };
  fields: {
    required: string[];
    optional: string[];
    customFields: Array<{
      name: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
  };
}

export interface CustomerSettings {
  accounts: {
    enableRegistration: boolean;
    requireEmailVerification: boolean;
    enableSocialLogin: boolean;
    allowGuestCheckout: boolean;
    createAccountAfterPurchase: boolean;
    enablePasswordReset: boolean;
    sessionTimeoutMinutes: number;
  };
  profiles: {
    collectDateOfBirth: boolean;
    collectGender: boolean;
    collectPhoneNumber: boolean;
    enableAddressBook: boolean;
    maxSavedAddresses: number;
    enableWishlist: boolean;
    enableOrderHistory: boolean;
    enableReorder: boolean;
  };
  loyalty: {
    enabled: boolean;
    pointsPerDollar: number;
    pointsValue: number;
    enableTiers: boolean;
    enableReferrals: boolean;
    referralBonus: number;
  };
  communication: {
    enableNewsletterSignup: boolean;
    newsletterOptInDefault: boolean;
    enableSmsMarketing: boolean;
    enablePushNotifications: boolean;
    enableReviewRequests: boolean;
    reviewRequestDelayDays: number;
  };
}

export interface MarketplaceSettings {
  enabled: boolean;
  vendors: {
    enableVendorRegistration: boolean;
    requireVendorApproval: boolean;
    enableVendorProfiles: boolean;
    enableVendorRatings: boolean;
    maxProductsPerVendor: number;
    enableVendorChat: boolean;
  };
  commissions: {
    defaultCommissionPercent: number;
    enableTieredCommissions: boolean;
    commissionCalculation: 'gross_sale' | 'net_sale';
    minimumPayout: number;
    payoutSchedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  };
  fees: {
    listingFee: number;
    subscriptionFee: number;
    transactionFee: number;
    enableSetupFee: boolean;
    setupFee: number;
  };
}

export interface GiftCardTemplateSettings {
  enabled?: boolean;
  presetAmounts?: number[];
  allowCustomAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface MarketingSettings {
  features: {
    enablePromoBanners: boolean;
    enableProductPromotions: boolean;
    enablePersonalizedOffers: boolean;
    enableReferralProgram: boolean;
    enableLoyaltyProgram: boolean;
    enableEmailCampaigns: boolean;
    enableSmsCampaigns: boolean;
    enablePushCampaigns: boolean;
    enableAbandonedCartRecovery: boolean;
  };
  referrals: {
    enabled: boolean;
    referrerBonus: number;
    refereeBonus: number;
    requirePurchase: boolean;
    minimumPurchaseAmount: number;
    maxReferralsPerCustomer: number;
  };
  promotions: {
    showOnProductPages: boolean;
    showOnHomepage: boolean;
    showOnCheckout: boolean;
    maxPromotionsPerProduct: number;
    enableCountdownTimers: boolean;
  };
  campaigns: {
    defaultSendTimeHour: number;
    enableHtmlEmails: boolean;
    enableSegmentTargeting: boolean;
    requireApproval: boolean;
  };
  giftCardTemplates?: GiftCardTemplateSettings;
}

export type ContentPageType = 'STATIC' | 'BLOG' | 'FAQ' | 'POLICY' | 'LANDING' | 'CUSTOM';
export type ContentPageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ContentPage {
  id: string;
  type: ContentPageType;
  status: ContentPageStatus;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  authorName?: string;
  publishedAt?: string;
  viewCount: number;
  showInMenu: boolean;
  showInFooter: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EcommerceSettings {
  store?: StoreInformation;
  catalog?: CatalogSettings;
  inventory?: InventorySettings;
  pricing?: PricingSettings;
  orders?: OrderSettings;
  shipping?: ShippingSettings;
  returns?: ReturnsSettings;
  cancellation?: CancellationSettings;
  checkout?: CheckoutSettings;
  customers?: CustomerSettings;
  marketplace?: MarketplaceSettings;
  contentPages?: ContentPage[];
}

// ==========================================
// MAIN SETTINGS MODEL
// ==========================================

export interface Settings {
  id: string;
  tenantId: string;
  applicationId: string;
  userId?: string;
  scope: string;
  branding?: BrandingSettings;
  theme?: ThemeSettings;
  layout?: LayoutSettings;
  animations?: AnimationSettings;
  localization?: LocalizationSettings;
  ecommerce?: EcommerceSettings;
  security?: Record<string, any>;
  notifications?: Record<string, any>;
  marketing?: MarketingSettings;
  integrations?: Record<string, any>;
  performance?: Record<string, any>;
  compliance?: Record<string, any>;
  features?: FeatureSettings;
  userPreferences?: UserPreferences;
  application?: ApplicationSettings;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SettingsPreset {
  id: string;
  name: string;
  description?: string;
  category: 'theme' | 'layout' | 'complete';
  settings: any;
  preview?: string;
  tags?: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface CreateSettingsRequest {
  context: SettingsContext;
  branding?: BrandingSettings;
  theme?: ThemeSettings;
  layout?: LayoutSettings;
  animations?: AnimationSettings;
  localization?: LocalizationSettings;
  ecommerce?: EcommerceSettings;
  security?: Record<string, any>;
  notifications?: Record<string, any>;
  marketing?: MarketingSettings;
  integrations?: Record<string, any>;
  performance?: Record<string, any>;
  compliance?: Record<string, any>;
  features?: FeatureSettings;
  userPreferences?: UserPreferences;
  application?: ApplicationSettings;
}

export interface UpdateSettingsRequest {
  branding?: BrandingSettings;
  theme?: ThemeSettings;
  layout?: LayoutSettings;
  animations?: AnimationSettings;
  localization?: LocalizationSettings;
  ecommerce?: Partial<EcommerceSettings>;
  security?: Record<string, any>;
  notifications?: Record<string, any>;
  marketing?: MarketingSettings;
  integrations?: Record<string, any>;
  performance?: Record<string, any>;
  compliance?: Record<string, any>;
  features?: FeatureSettings;
  userPreferences?: UserPreferences;
  application?: ApplicationSettings;
}

export interface SettingsResponse {
  success: boolean;
  data?: Settings;
  message?: string;
}

export interface SettingsListResponse {
  success: boolean;
  data?: Settings[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface PresetResponse {
  success: boolean;
  data?: SettingsPreset;
  message?: string;
}

export interface PresetListResponse {
  success: boolean;
  data?: SettingsPreset[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
