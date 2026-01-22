/**
 * API Configuration Module
 * Centralized configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  // Base URL for Next.js API routes (acts as proxy)
  BASE_URL: '/api',

  // Microservice URLs (server-side only, not exposed to client)
  SERVICES: {
    CATEGORIES: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3031/api/v1',
    PRODUCTS: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3107/api/v1',
    ORDERS: process.env.ORDERS_SERVICE_URL || 'http://localhost:3004/api/v1',
    VENDORS: process.env.VENDORS_SERVICE_URL || 'http://localhost:3034/api/v1',
    STAFF: process.env.STAFF_SERVICE_URL || 'http://localhost:3035/api/v1',
    CUSTOMERS: process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8080/api/v1',
    REVIEWS: process.env.REVIEWS_SERVICE_URL || 'http://localhost:3006/api/v1',
    COUPONS: process.env.COUPONS_SERVICE_URL || 'http://localhost:3005/api/v1',
    TICKETS: process.env.TICKETS_SERVICE_URL || 'http://localhost:3036/api/v1',
    SETTINGS: process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085/api/v1',
    INVENTORY: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8088/api/v1',
    PAYMENTS: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:8089/api/v1',
    TAX: process.env.TAX_SERVICE_URL || 'http://localhost:8091/api/v1',
    LOCATION: process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1',
    ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8092/api/v1',
    MARKETING: process.env.MARKETING_SERVICE_URL || 'http://localhost:3007/api/v1',
    GIFT_CARDS: process.env.GIFT_CARDS_SERVICE_URL || 'http://localhost:3038/api/v1',
    SHIPPING: process.env.SHIPPING_SERVICE_URL || 'http://localhost:8090/api',
    QR: process.env.QR_SERVICE_URL || 'http://localhost:8080/api/v1',
    AUDIT: process.env.AUDIT_SERVICE_URL || 'http://localhost:8093/api/v1',
    APPROVAL: process.env.APPROVAL_SERVICE_URL || 'http://localhost:8095/api/v1',
    ADS: process.env.ADS_SERVICE_URL || 'http://localhost:3039/api/v1',
    TENANT_ONBOARDING: process.env.TENANT_ONBOARDING_SERVICE_URL || 'http://tenant-onboarding.marketplace.svc.cluster.local/api',
  },

  // Request configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second

  // Feature flags - mock data is disabled by default, should only be used for local dev
  USE_MOCK_DATA: false,

  // Auth headers - REMOVED hardcoded fallbacks
  // Tenant and User IDs MUST come from JWT authentication via headers
  // No fallback values - if no auth context, requests should fail
  HEADERS: {
    TENANT_ID: '',  // Set dynamically from TenantContext
    USER_ID: '',    // Set dynamically from JWT claims
  },
} as const;

/**
 * Get service URL by name
 */
export function getServiceUrl(service: keyof typeof API_CONFIG.SERVICES): string {
  return API_CONFIG.SERVICES[service];
}

/**
 * Get auth headers for API requests
 * NOTE: Returns empty headers - actual values MUST come from:
 * 1. JWT authentication (for user ID via x-jwt-claim-sub)
 * 2. TenantContext (for tenant ID set on API client via x-jwt-claim-tenant-id)
 * 3. Incoming request headers (forwarded by proxy functions)
 *
 * This function now returns empty headers intentionally.
 * The getProxyHeaders() function in api-route-handler.ts will extract
 * x-jwt-claim-tenant-id from the incoming client request if present.
 */
export function getAuthHeaders(): Record<string, string> {
  // Return empty object - no fallback values
  // Headers must come from dynamic authentication context
  return {};
}

/**
 * Check if mock data mode is enabled
 */
export function isMockMode(): boolean {
  return API_CONFIG.USE_MOCK_DATA;
}
