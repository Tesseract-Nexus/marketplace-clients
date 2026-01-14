import Constants from 'expo-constants';

// Environment-based configuration with tenant-specific API gateway
const ENV = {
  development: {
    // Development uses devtest environment - tenant-specific API gateways
    // Pattern: {tenant-slug}-api.tesserix.app
    API_BASE_DOMAIN: 'tesserix.app',
    API_URL_PATTERN: 'https://{slug}-api.tesserix.app',
    DEFAULT_API_URL: 'https://dev-api.tesserix.app', // Pre-login auth endpoint
    WS_URL_PATTERN: 'wss://{slug}-api.tesserix.app/ws',
  },
  staging: {
    // Staging environment
    API_BASE_DOMAIN: 'tesserix.app',
    API_URL_PATTERN: 'https://{slug}-api-staging.tesserix.app',
    DEFAULT_API_URL: 'https://api-staging.tesserix.app',
    WS_URL_PATTERN: 'wss://{slug}-api-staging.tesserix.app/ws',
  },
  production: {
    // Production environment
    API_BASE_DOMAIN: 'tesserix.app',
    API_URL_PATTERN: 'https://{slug}-api.tesserix.app',
    DEFAULT_API_URL: 'https://api.tesserix.app',
    WS_URL_PATTERN: 'wss://{slug}-api.tesserix.app/ws',
  },
};

type Environment = 'development' | 'staging' | 'production';

const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel as string | undefined;
  if (releaseChannel?.startsWith('prod')) {
    return 'production';
  }
  if (releaseChannel?.startsWith('staging')) {
    return 'staging';
  }
  return 'development';
};

const environment = getEnvironment();
const envConfig = ENV[environment];

// Default API URL for login/pre-tenant operations
export const API_URL = envConfig.DEFAULT_API_URL;
export const DEFAULT_API_URL = envConfig.DEFAULT_API_URL;
export const API_URL_PATTERN = envConfig.API_URL_PATTERN;
export const WS_URL_PATTERN = envConfig.WS_URL_PATTERN;
export const ENV_NAME = environment;

/**
 * Get tenant-specific API URL
 * @param tenantSlug - The tenant's slug (e.g., 'demo-store')
 * @returns The tenant-specific API URL (e.g., 'https://demo-store-api.tesserix.app')
 */
export const getTenantApiUrl = (tenantSlug: string | null | undefined): string => {
  if (!tenantSlug) {
    return DEFAULT_API_URL;
  }
  return API_URL_PATTERN.replace('{slug}', tenantSlug);
};

/**
 * Get tenant-specific WebSocket URL
 * @param tenantSlug - The tenant's slug
 * @returns The tenant-specific WebSocket URL
 */
export const getTenantWsUrl = (tenantSlug: string | null | undefined): string => {
  if (!tenantSlug) {
    return WS_URL_PATTERN.replace('{slug}', 'demo-store'); // fallback
  }
  return WS_URL_PATTERN.replace('{slug}', tenantSlug);
};

// Legacy export for backward compatibility
export const WS_URL = getTenantWsUrl('demo-store');

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    RESEND_VERIFICATION: '/api/v1/auth/resend-verification',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    ME: '/api/v1/auth/me',
  },
  // Tenants
  TENANTS: {
    LIST: '/api/v1/tenants',
    USER_TENANTS: '/api/v1/users/me/tenants', // Get user's tenants
    CREATE: '/api/v1/tenants',
    GET: (id: string) => `/api/v1/tenants/${id}`,
    UPDATE: (id: string) => `/api/v1/tenants/${id}`,
    DETAILS: (id: string) => `/api/v1/tenants/${id}/details`,
    CHECK_SLUG: (slug: string) => `/api/v1/tenants/check-slug/${slug}`,
    VALIDATE: (slug: string) => `/api/v1/tenants/validate?slug=${slug}`,
    BY_SLUG: (slug: string) => `/api/v1/tenants/slug/${slug}`,
    SWITCH: '/api/v1/tenants/switch',
    SET_DEFAULT: '/api/v1/tenants/set-default',
  },
  // Products
  PRODUCTS: {
    LIST: '/api/v1/products',
    CREATE: '/api/v1/products',
    GET: (id: string) => `/api/v1/products/${id}`,
    UPDATE: (id: string) => `/api/v1/products/${id}`,
    DELETE: (id: string) => `/api/v1/products/${id}`,
    DUPLICATE: (id: string) => `/api/v1/products/${id}/duplicate`,
    STATS: '/api/v1/products/stats',
    BULK_UPDATE: '/api/v1/products/bulk',
    INVENTORY: '/api/v1/products/inventory',
    IMAGES: '/api/v1/products/images', // Web admin pattern - upload images
    IMPORT: '/api/v1/products/import', // Web admin pattern - import from file
    IMPORT_TEMPLATE: '/api/v1/products/import/template', // Web admin pattern
  },
  // Categories
  CATEGORIES: {
    LIST: '/api/v1/categories',
    CREATE: '/api/v1/categories',
    GET: (id: string) => `/api/v1/categories/${id}`,
    UPDATE: (id: string) => `/api/v1/categories/${id}`,
    DELETE: (id: string) => `/api/v1/categories/${id}`,
    TREE: '/api/v1/categories/tree',
  },
  // Orders
  ORDERS: {
    LIST: '/api/v1/orders',
    CREATE: '/api/v1/orders',
    GET: (id: string) => `/api/v1/orders/${id}`,
    UPDATE: (id: string) => `/api/v1/orders/${id}`,
    FULFILL: (id: string) => `/api/v1/orders/${id}/fulfill`,
    FULFILLMENT_STATUS: (id: string) => `/api/v1/orders/${id}/fulfillment-status`, // Web admin pattern
    PAYMENT_STATUS: (id: string) => `/api/v1/orders/${id}/payment-status`, // Web admin pattern
    STATUS: (id: string) => `/api/v1/orders/${id}/status`, // Web admin pattern
    VALID_TRANSITIONS: (id: string) => `/api/v1/orders/${id}/valid-transitions`, // Web admin
    REFUND: (id: string) => `/api/v1/orders/${id}/refund`,
    CANCEL: (id: string) => `/api/v1/orders/${id}/cancel`,
    STATS: '/api/v1/orders/stats',
    ANALYTICS: '/api/v1/orders/analytics', // Web admin pattern
  },
  // Customers
  CUSTOMERS: {
    LIST: '/api/v1/customers',
    CREATE: '/api/v1/customers',
    GET: (id: string) => `/api/v1/customers/${id}`,
    UPDATE: (id: string) => `/api/v1/customers/${id}`,
    DELETE: (id: string) => `/api/v1/customers/${id}`,
    ORDERS: (id: string) => `/api/v1/customers/${id}/orders`,
    NOTES: (id: string) => `/api/v1/customers/${id}/notes`, // Web admin pattern
    ADDRESSES: (id: string) => `/api/v1/customers/${id}/addresses`, // Web admin pattern
    ADDRESS: (id: string, addressId: string) => `/api/v1/customers/${id}/addresses/${addressId}`, // Web admin
    STATS: '/api/v1/customers/stats',
  },
  // Cart
  CART: {
    GET: '/api/v1/cart',
    ADD_ITEM: '/api/v1/cart/items',
    UPDATE_ITEM: (id: string) => `/api/v1/cart/items/${id}`,
    REMOVE_ITEM: (id: string) => `/api/v1/cart/items/${id}`,
    CLEAR: '/api/v1/cart/clear',
    APPLY_COUPON: '/api/v1/cart/coupon',
    REMOVE_COUPON: '/api/v1/cart/coupon',
    SET_SHIPPING: '/api/v1/cart/shipping-address',
    SET_BILLING: '/api/v1/cart/billing-address',
    CHECKOUT: '/api/v1/cart/checkout',
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
    DELETE: (id: string) => `/api/v1/notifications/${id}`,
    DELETE_ALL: '/api/v1/notifications',
    PREFERENCES: '/api/v1/notifications/preferences',
    REGISTER_DEVICE: '/api/v1/notifications/device',
  },
  // Analytics
  ANALYTICS: {
    OVERVIEW: '/api/v1/analytics/overview', // Web admin pattern
    DASHBOARD: '/api/v1/analytics/dashboard',
    SALES: '/api/v1/analytics/sales',
    CUSTOMERS: '/api/v1/analytics/customers',
    PRODUCTS: '/api/v1/analytics/products',
    INVENTORY: '/api/v1/analytics/inventory', // Web admin pattern
    FINANCIAL: '/api/v1/analytics/financial', // Web admin pattern
    REAL_TIME: '/api/v1/analytics/realtime',
  },
  // Settings
  SETTINGS: {
    GET: '/api/v1/settings',
    UPDATE: '/api/v1/settings',
    PAYMENT_PROVIDERS: '/api/v1/settings/payment-providers',
    SHIPPING_METHODS: '/api/v1/settings/shipping-methods',
  },
  // Upload
  UPLOAD: {
    IMAGE: '/api/v1/upload/image',
    FILE: '/api/v1/upload/file',
  },
  // Search (Typesense-powered)
  SEARCH: {
    GLOBAL: '/api/v1/search',
    PRODUCTS: '/api/v1/search/products',
    CATEGORIES: '/api/v1/search/categories',
    SUGGEST: '/api/v1/search/suggest',
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tesseract_access_token',
  REFRESH_TOKEN: 'tesseract_refresh_token',
  ID_TOKEN: 'tesseract_id_token',
  TOKEN_EXPIRES_AT: 'tesseract_token_expires_at',
  USER: 'tesseract_user',
  CURRENT_TENANT: 'tesseract_current_tenant',
  TENANTS: 'tesseract_tenants',
  THEME_MODE: 'tesseract_theme_mode',
  ONBOARDING_DATA: 'tesseract_onboarding_data',
  CART: 'tesseract_cart',
  RECENT_SEARCHES: 'tesseract_recent_searches',
  PUSH_TOKEN: 'tesseract_push_token',
  BIOMETRIC_ENABLED: 'tesseract_biometric_enabled',
  LAST_SYNC: 'tesseract_last_sync',
} as const;

// OIDC Configuration (Keycloak)
export const OIDC_CONFIG = {
  // Customer IDP for mobile app authentication
  ISSUER_URL: 'https://devtest-customer-idp.tesserix.app/realms/tesserix-customer',
  CLIENT_ID: 'mobile-app',
  REDIRECT_URI: 'tesserix://auth/callback',
  POST_LOGOUT_REDIRECT_URI: 'tesserix://auth/logout',
  SCOPES: ['openid', 'profile', 'email', 'offline_access'],
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  USER: ['user'],
  TENANTS: ['tenants'],
  HOME_PAGE: (tenantId: string) => ['tenant', tenantId, 'home'],
  PRODUCTS: (tenantId: string) => ['tenant', tenantId, 'products'],
  PRODUCT: (tenantId: string, id: string) => ['tenant', tenantId, 'products', id],
  CATEGORIES: (tenantId: string) => ['tenant', tenantId, 'categories'],
  ORDERS: (tenantId: string) => ['tenant', tenantId, 'orders'],
  ORDER: (tenantId: string, id: string) => ['tenant', tenantId, 'orders', id],
  CUSTOMERS: (tenantId: string) => ['tenant', tenantId, 'customers'],
  CUSTOMER: (tenantId: string, id: string) => ['tenant', tenantId, 'customers', id],
  CART: (tenantId: string) => ['tenant', tenantId, 'cart'],
  NOTIFICATIONS: (tenantId: string) => ['tenant', tenantId, 'notifications'],
  DASHBOARD: (tenantId: string) => ['tenant', tenantId, 'dashboard'],
  DASHBOARD_STATS: (tenantId: string) => ['tenant', tenantId, 'dashboard', 'stats'],
  ANALYTICS: (tenantId: string, type: string) => ['tenant', tenantId, 'analytics', type],
  SETTINGS: (tenantId: string) => ['tenant', tenantId, 'settings'],
  SEARCH: (tenantId: string, query: string) => ['tenant', tenantId, 'search', query],
  SEARCH_PRODUCTS: (tenantId: string, query: string) => ['tenant', tenantId, 'search', 'products', query],
  SEARCH_SUGGESTIONS: (tenantId: string, query: string) => ['tenant', tenantId, 'search', 'suggestions', query],
} as const;

// App Configuration
export const APP_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Timeouts
  API_TIMEOUT: 30000,
  REFRESH_TOKEN_THRESHOLD: 300, // 5 minutes before expiry

  // Cache
  STALE_TIME: 60000, // 1 minute
  GC_TIME: 600000, // 10 minutes

  // Retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Upload
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Search
  SEARCH_DEBOUNCE: 300,
  MIN_SEARCH_LENGTH: 2,

  // Animation
  ANIMATION_DURATION: 300,

  // Biometric
  BIOMETRIC_TIMEOUT: 10000,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  OFFLINE: 'You are offline. Some features may not be available.',
} as const;

// Feature Flags
export const FEATURES = {
  BIOMETRIC_AUTH: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: true,
  ANALYTICS: true,
  REVIEWS: true,
  WISHLIST: true,
  MULTI_LANGUAGE: false,
  DARK_MODE: true,
} as const;
