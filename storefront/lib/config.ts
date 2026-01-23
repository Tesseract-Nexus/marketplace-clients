// Environment Configuration
// Server-side env vars (runtime) take precedence over NEXT_PUBLIC_* (build-time)

const isDev = process.env.NODE_ENV === 'development';
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
// Check if we're running on the client side (browser)
const isClient = typeof window !== 'undefined';

// Helper to get env var with fallback
// During build time: always use fallback to allow build to complete
// On client-side: return placeholder (client should use Next.js API routes, not direct service calls)
// During runtime in production server: throw error if using localhost fallback
function getEnv(serverKey: string, publicKey: string, devFallback: string): string {
  const value = process.env[serverKey] || process.env[publicKey];
  if (value) return value;

  // During build time, always use fallback
  if (isBuildTime) {
    return devFallback;
  }

  // On client-side, don't throw - client code should use Next.js API routes
  // Return empty string as placeholder (direct service calls won't work from browser anyway)
  if (isClient) {
    return '';
  }

  // In development server-side, use fallback with warning
  if (isDev) {
    console.warn(`[Config] Missing ${serverKey}/${publicKey}, using dev fallback: ${devFallback}`);
    return devFallback;
  }

  // SECURITY: In production server-side runtime, fail fast - no localhost fallbacks allowed
  throw new Error(
    `Missing required environment variable: ${serverKey} or ${publicKey}. ` +
    `Production deployments must have all service URLs configured.`
  );
}

export const config = {
  // API URLs - Use server-side env vars for SSR, fall back to NEXT_PUBLIC_* for client
  // In production, these should be configured via environment variables
  api: {
    settingsService: getEnv('SETTINGS_SERVICE_URL', 'NEXT_PUBLIC_SETTINGS_SERVICE_URL', 'http://localhost:8085'),
    tenantRouterService: getEnv('TENANT_ROUTER_SERVICE_URL', 'NEXT_PUBLIC_TENANT_ROUTER_SERVICE_URL', 'http://localhost:8089'),
    productsService: getEnv('PRODUCTS_SERVICE_URL', 'NEXT_PUBLIC_PRODUCTS_SERVICE_URL', 'http://localhost:3107'),
    categoriesService: getEnv('CATEGORIES_SERVICE_URL', 'NEXT_PUBLIC_CATEGORIES_SERVICE_URL', 'http://localhost:3031'),
    ordersService: getEnv('ORDERS_SERVICE_URL', 'NEXT_PUBLIC_ORDERS_SERVICE_URL', 'http://localhost:3108'),
    cartService: getEnv('CART_SERVICE_URL', 'NEXT_PUBLIC_CART_SERVICE_URL', 'http://localhost:3109'),
    customersService: getEnv('CUSTOMERS_SERVICE_URL', 'NEXT_PUBLIC_CUSTOMERS_SERVICE_URL', 'http://localhost:8080/api/v1'),
    paymentService: getEnv('PAYMENT_SERVICE_URL', 'NEXT_PUBLIC_PAYMENT_SERVICE_URL', 'http://localhost:8086'),
    reviewsService: getEnv('REVIEWS_SERVICE_URL', 'NEXT_PUBLIC_REVIEWS_SERVICE_URL', 'http://localhost:8084'),
    vendorsService: getEnv('VENDORS_SERVICE_URL', 'NEXT_PUBLIC_VENDOR_SERVICE_URL', 'http://localhost:3034'),
    ticketsService: getEnv('TICKETS_SERVICE_URL', 'NEXT_PUBLIC_TICKETS_SERVICE_URL', 'http://localhost:3036'),
    couponsService: getEnv('COUPONS_SERVICE_URL', 'NEXT_PUBLIC_COUPONS_SERVICE_URL', 'http://localhost:3035'),
    notificationService: getEnv('NOTIFICATION_SERVICE_URL', 'NEXT_PUBLIC_NOTIFICATION_SERVICE_URL', 'http://localhost:8090'),
    marketingService: getEnv('MARKETING_SERVICE_URL', 'NEXT_PUBLIC_MARKETING_SERVICE_URL', 'http://localhost:3007/api/v1'),
    giftCardsService: getEnv('GIFT_CARDS_SERVICE_URL', 'NEXT_PUBLIC_GIFT_CARDS_SERVICE_URL', 'http://localhost:3038/api/v1'),
    shippingService: getEnv('SHIPPING_SERVICE_URL', 'NEXT_PUBLIC_SHIPPING_SERVICE_URL', 'http://localhost:8088'),
  },

  // Feature flags
  features: {
    enableReviews: process.env.NEXT_PUBLIC_ENABLE_REVIEWS === 'true',
    enableWishlist: process.env.NEXT_PUBLIC_ENABLE_WISHLIST !== 'false', // default true
    enableSearch: process.env.NEXT_PUBLIC_ENABLE_SEARCH !== 'false', // default true
  },

  // Default tenant (for development only)
  defaultTenant: isDev ? (process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo') : '',

  // Asset URLs
  assets: {
    placeholder: '/placeholder.svg',
    logo: '/logo.svg',
  },

  // Environment info
  isDev,
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export type Config = typeof config;

/**
 * Validate that required service URLs are configured
 * Call this at runtime (e.g., in API routes) to ensure config is valid
 * before making external service calls
 * SECURITY: In production, throws error if any service uses localhost
 */
export function validateConfig(): void {
  const requiredServices = [
    'settingsService',
    'tenantRouterService',
    'productsService',
    'ordersService',
    'customersService',
    'paymentService',
  ] as const;

  const localhostServices: string[] = [];

  for (const service of requiredServices) {
    const url = config.api[service];
    // Check if it's still using localhost fallback in production
    if (!isDev && url.includes('localhost')) {
      localhostServices.push(service);
    }
  }

  if (localhostServices.length > 0) {
    const message = `[Config] SECURITY ERROR: Production environment has localhost URLs for: ${localhostServices.join(', ')}. ` +
      'All service URLs must be properly configured for production deployment.';
    console.error(message);
    throw new Error(message);
  }
}
