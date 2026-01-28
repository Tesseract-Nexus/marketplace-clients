import { apiRequest, serviceUrls } from './client';
import {
  ApiResponse,
  ApiListResponse,
  StorefrontSettings,
  StorefrontMarketingConfig,
  Product,
  Category,
  TenantInfo,
  ContentPage,
  DEFAULT_STOREFRONT_SETTINGS,
} from '@/types/storefront';

// ========================================
// Tenant & Storefront Settings
// ========================================

/**
 * Storefront resolution data returned from vendor-service
 */
export interface StorefrontResolution {
  id: string;
  tenantId: string;
  isActive: boolean;
  name?: string;
  logoUrl?: string;
  themeConfig?: Record<string, unknown>;
}

/**
 * Resolve storefront by slug from vendor-service
 * Uses the public endpoint which doesn't require authentication
 * Returns isActive status for "Coming Soon" page handling
 */
export async function resolveStorefront(slug: string): Promise<StorefrontResolution | null> {
  try {
    // Use public endpoint for anonymous storefront access
    const url = `${serviceUrls.vendors}/public/storefronts/resolve/by-slug/${slug}`;
    console.log(`[resolveStorefront] Fetching from: ${url}`);

    const response = await apiRequest<ApiResponse<any>>(
      url,
      { cache: 'no-store' }
    );

    const data = response.data || response;
    const resolvedId = data.storefrontId || data.id;
    console.log(`[resolveStorefront] Resolved: storefrontId=${resolvedId}, tenantId=${data.tenantId || data.vendorId}, isActive=${data.isActive}`);

    return {
      id: resolvedId,
      tenantId: data.tenantId || data.vendorId,
      isActive: data.isActive ?? true, // Default to true for backward compatibility
      name: data.name,
      logoUrl: data.logoUrl,
      themeConfig: data.themeConfig,
    };
  } catch (error) {
    console.error('[resolveStorefront] Failed to resolve storefront:', error);
  }
  return null;
}

export async function resolveTenant(slug: string): Promise<TenantInfo | null> {
  try {
    const response = await apiRequest<ApiResponse<TenantInfo>>(
      `${serviceUrls.settings}/api/v1/storefront/resolve/${slug}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to resolve tenant:', error);
    return null;
  }
}

/**
 * Transform backend format to frontend format
 * Backend uses: showHero, showWishlistButton, termsRequired
 * Frontend uses: heroEnabled, showWishlist, showTermsCheckbox
 */
export function transformBackendSettings(data: Record<string, unknown>): Partial<StorefrontSettings> {
  const result: Record<string, unknown> = { ...data };

  // Transform homepageConfig
  if (data.homepageConfig && typeof data.homepageConfig === 'object') {
    const homepageConfig = data.homepageConfig as Record<string, unknown>;
    result.homepageConfig = {
      ...homepageConfig,
      heroEnabled: homepageConfig.showHero ?? homepageConfig.heroEnabled ?? true,
    };
  }

  // Transform productConfig
  if (data.productConfig && typeof data.productConfig === 'object') {
    const productConfig = data.productConfig as Record<string, unknown>;
    result.productConfig = {
      ...productConfig,
      showWishlist: productConfig.showWishlistButton ?? productConfig.showWishlist ?? true,
    };
  }

  // Transform checkoutConfig
  if (data.checkoutConfig && typeof data.checkoutConfig === 'object') {
    const checkoutConfig = data.checkoutConfig as Record<string, unknown>;
    result.checkoutConfig = {
      ...checkoutConfig,
      showTermsCheckbox: checkoutConfig.termsRequired ?? checkoutConfig.showTermsCheckbox ?? true,
    };
  }

  return result as Partial<StorefrontSettings>;
}

/**
 * Fetch theme settings from settings-service
 * Uses the public endpoint which doesn't require authentication
 */
export async function getStorefrontTheme(
  storefrontId: string,
  tenantId: string
): Promise<Partial<StorefrontSettings> | null> {
  try {
    // Use public endpoint for anonymous storefront access
    const url = `${serviceUrls.settings}/api/v1/public/storefront-theme/${storefrontId}`;
    console.log(`[getStorefrontTheme] Fetching from: ${url}, storefrontId=${storefrontId}, tenantId=${tenantId}`);

    const response = await apiRequest<ApiResponse<any>>(
      url,
      { tenantId, storefrontId, cache: 'no-store' }
    );

    const rawData = response.data || response;
    console.log(`[getStorefrontTheme] Received settings: themeTemplate=${rawData?.themeTemplate}, primaryColor=${rawData?.primaryColor}, colorMode=${rawData?.colorMode}`);
    return transformBackendSettings(rawData);
  } catch (error) {
    console.error('[getStorefrontTheme] Failed to fetch storefront theme:', error);
    return null;
  }
}

export async function getStorefrontSettings(
  storefrontId: string,
  tenantId: string
): Promise<StorefrontSettings> {
  try {
    const response = await apiRequest<ApiResponse<StorefrontSettings>>(
      `${serviceUrls.settings}/api/v1/storefront-theme/${storefrontId}`,
      { tenantId, storefrontId }
    );
    return mergeWithDefaults(response.data);
  } catch (error) {
    console.error('Failed to fetch storefront settings:', error);
    // Return defaults on error
    return {
      ...DEFAULT_STOREFRONT_SETTINGS,
      id: storefrontId,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetch dynamic content pages from settings-service
 * Uses the public endpoint for anonymous storefront access
 */
export async function getContentPages(
  storefrontId: string,
  tenantId: string
): Promise<ContentPage[]> {
  try {
    // Read from the public storefront-theme endpoint
    const response = await apiRequest<ApiResponse<any>>(
      `${serviceUrls.settings}/api/v1/public/storefront-theme/${storefrontId}`,
      { tenantId, storefrontId, cache: 'no-store' }
    );

    // Handle both wrapped { data: {...} } and unwrapped response formats
    const rawData = response.data || response;
    let pages = rawData?.contentPages || rawData?.ecommerce?.contentPages || [];

    // Fallback: If no pages found, try fetching from admin-portal context (where Admin saves them)
    if (pages.length === 0) {
      try {
        const queryParams = new URLSearchParams({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId
        });

        // Use public endpoint for anonymous storefront access (no auth required)
        const adminResponse = await apiRequest<ApiResponse<any>>(
          `${serviceUrls.settings}/api/v1/public/settings/context?${queryParams.toString()}`,
          { tenantId: storefrontId, storefrontId, cache: 'no-store' }
        );
        
        const adminData = adminResponse.data || adminResponse;
        if (adminData?.ecommerce?.contentPages) {
          pages = adminData.ecommerce.contentPages;
        }
      } catch (fallbackError) {
        // Ignore fallback error, return empty array
        console.warn('Fallback fetch for content pages failed:', fallbackError);
      }
    }

    return pages;
  } catch (error) {
    console.error('Failed to fetch content pages:', error);
    return [];
  }
}

/**
 * Fetch a single dynamic content page by its slug
 */
export async function getContentPage(
  storefrontId: string,
  tenantId: string,
  slug: string
): Promise<ContentPage | null> {
  const pages = await getContentPages(storefrontId, tenantId);
  return pages.find((p) => p.slug === slug && p.status === 'PUBLISHED') || null;
}

/**
 * Fetch marketing settings from admin portal settings
 * Admin saves these under the 'marketing' field in settings-service
 */
export async function getMarketingSettings(
  storefrontId: string,
  tenantId: string
): Promise<StorefrontMarketingConfig | null> {
  try {
    const queryParams = new URLSearchParams({
      applicationId: 'admin-portal',
      scope: 'application',
      tenantId: storefrontId
    });

    // Use public endpoint for anonymous storefront access (no auth required)
    const response = await apiRequest<ApiResponse<any>>(
      `${serviceUrls.settings}/api/v1/public/settings/context?${queryParams.toString()}`,
      { tenantId: storefrontId, storefrontId, cache: 'no-store' }
    );

    const data = response.data || response;

    // Map admin marketing.features to storefront marketingConfig
    if (data?.marketing?.features) {
      const features = data.marketing.features;
      return {
        enablePromoBanners: features.enablePromoBanners ?? true,
        enableProductPromotions: features.enableProductPromotions ?? true,
        enablePersonalizedOffers: features.enablePersonalizedOffers ?? true,
        enableReferralProgram: features.enableReferralProgram ?? true,
        enableLoyaltyProgram: features.enableLoyaltyProgram ?? true,
        enableAbandonedCartRecovery: features.enableAbandonedCartRecovery ?? true,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch marketing settings:', error);
    return null;
  }
}

/**
 * Store localization settings (currency, timezone, region)
 */
export interface StoreLocalization {
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  language: string;
  region: string;
  country: string;
  countryCode: string;
}

/**
 * Currency symbol mapping
 */
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  NZD: 'NZ$',
  SGD: 'S$',
  JPY: '¥',
  CNY: '¥',
};

/**
 * Fetch store localization settings from admin portal settings
 * This includes currency, timezone, region etc. configured in General Settings
 */
export async function getStoreLocalization(
  storefrontId: string,
  tenantId: string
): Promise<StoreLocalization> {
  const defaults: StoreLocalization = {
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    region: '',
    country: '',
    countryCode: '',
  };

  try {
    const queryParams = new URLSearchParams({
      applicationId: 'admin-portal',
      scope: 'application',
      tenantId: storefrontId
    });

    // Use public endpoint for anonymous storefront access (no auth required)
    const response = await apiRequest<ApiResponse<any>>(
      `${serviceUrls.settings}/api/v1/public/settings/context?${queryParams.toString()}`,
      { tenantId: storefrontId, storefrontId, cache: 'no-store' }
    );

    const data = response.data || response;

    // Extract localization from settings
    const localization = data?.localization || {};
    const ecommerce = data?.ecommerce || {};
    const storeInfo = ecommerce?.store || {};
    const pricing = ecommerce?.pricing || {};

    // Get currency from multiple possible locations
    const currency =
      localization?.currency?.code ||
      pricing?.currencies?.primary ||
      defaults.currency;

    // Get country info from store address
    const country = storeInfo?.address?.country || '';
    const countryCode = getCountryCode(country);

    return {
      currency,
      currencySymbol: currencySymbols[currency] || currency,
      timezone: localization?.timezone || defaults.timezone,
      dateFormat: localization?.dateFormat || defaults.dateFormat,
      language: localization?.language || defaults.language,
      region: localization?.region || country,
      country,
      countryCode,
    };
  } catch (error) {
    console.error('Failed to fetch store localization:', error);
    return defaults;
  }
}

/**
 * Get country code from country name
 */
function getCountryCode(countryName: string): string {
  const countryMap: Record<string, string> = {
    'Australia': 'AU',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'India': 'IN',
    'New Zealand': 'NZ',
    'Singapore': 'SG',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Japan': 'JP',
    'China': 'CN',
  };
  return countryMap[countryName] || '';
}

/**
 * Fetch admin-configured store name from settings-service
 * This is the business name set in Admin > General Settings > Store Name
 */
export async function getStoreName(
  storefrontId: string,
  tenantId: string
): Promise<string | null> {
  try {
    const queryParams = new URLSearchParams({
      applicationId: 'admin-portal',
      scope: 'application',
      tenantId: tenantId
    });

    const response = await apiRequest<ApiResponse<any>>(
      `${serviceUrls.settings}/api/v1/public/settings/context?${queryParams.toString()}`,
      { tenantId, storefrontId, cache: 'no-store' }
    );

    const data = response.data || response;
    return data?.ecommerce?.store?.name || null;
  } catch (error) {
    console.error('Failed to fetch store name:', error);
    return null;
  }
}

/**
 * Format price with store currency
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function mergeWithDefaults(settings: Partial<StorefrontSettings>): StorefrontSettings {
  return {
    ...DEFAULT_STOREFRONT_SETTINGS,
    ...settings,
    headerConfig: { ...DEFAULT_STOREFRONT_SETTINGS.headerConfig, ...settings.headerConfig },
    homepageConfig: { ...DEFAULT_STOREFRONT_SETTINGS.homepageConfig, ...settings.homepageConfig },
    footerConfig: { ...DEFAULT_STOREFRONT_SETTINGS.footerConfig, ...settings.footerConfig },
    productConfig: { ...DEFAULT_STOREFRONT_SETTINGS.productConfig, ...settings.productConfig },
    checkoutConfig: { ...DEFAULT_STOREFRONT_SETTINGS.checkoutConfig, ...settings.checkoutConfig },
    typographyConfig: { ...DEFAULT_STOREFRONT_SETTINGS.typographyConfig, ...settings.typographyConfig },
    layoutConfig: { ...DEFAULT_STOREFRONT_SETTINGS.layoutConfig, ...settings.layoutConfig },
    spacingStyleConfig: { ...DEFAULT_STOREFRONT_SETTINGS.spacingStyleConfig, ...settings.spacingStyleConfig },
    mobileConfig: { ...DEFAULT_STOREFRONT_SETTINGS.mobileConfig, ...settings.mobileConfig },
    advancedConfig: {
      ...DEFAULT_STOREFRONT_SETTINGS.advancedConfig,
      ...settings.advancedConfig,
      visibility: {
        ...DEFAULT_STOREFRONT_SETTINGS.advancedConfig?.visibility,
        ...settings.advancedConfig?.visibility,
      },
      performance: {
        ...DEFAULT_STOREFRONT_SETTINGS.advancedConfig?.performance,
        ...settings.advancedConfig?.performance,
      },
    },
    id: settings.id || '',
    tenantId: settings.tenantId || '',
    createdAt: settings.createdAt || new Date().toISOString(),
    updatedAt: settings.updatedAt || new Date().toISOString(),
  } as StorefrontSettings;
}

// ========================================
// Products
// ========================================

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name' | 'rating';
  page?: number;
  limit?: number;
}

export async function getProducts(
  tenantId: string,
  storefrontId: string,
  filters: ProductFilters = {}
): Promise<ApiListResponse<Product>> {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.search) params.set('search', filters.search);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.status) params.set('status', filters.status);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  // Note: serviceUrls.products already includes /api/v1 from env var
  // Use public storefront endpoint for browsing (no auth required)
  const url = `${serviceUrls.products}/storefront/products${queryString ? `?${queryString}` : ''}`;

  return apiRequest<ApiListResponse<Product>>(url, { tenantId, storefrontId });
}

export async function getProduct(
  tenantId: string,
  storefrontId: string,
  productId: string
): Promise<Product | null> {
  try {
    // Use public storefront endpoint (no auth required)
    const url = typeof window === 'undefined'
      ? `${serviceUrls.products}/storefront/products/${productId}`
      : `/api/products/${productId}`;
    const response = await apiRequest<ApiResponse<Product>>(url, { tenantId, storefrontId });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

export async function getFeaturedProducts(
  tenantId: string,
  storefrontId: string,
  limit: number = 8
): Promise<Product[]> {
  try {
    const response = await getProducts(tenantId, storefrontId, {
      status: 'ACTIVE',
      limit,
      sort: 'rating',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
}

export async function searchProducts(
  tenantId: string,
  storefrontId: string,
  query: string,
  limit: number = 10
): Promise<Product[]> {
  try {
    const response = await getProducts(tenantId, storefrontId, {
      search: query,
      status: 'ACTIVE',
      limit,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to search products:', error);
    return [];
  }
}

// ========================================
// Categories
// ========================================

export async function getCategories(
  tenantId: string,
  storefrontId: string
): Promise<Category[]> {
  try {
    // Use public storefront endpoint (no auth required)
    const response = await apiRequest<ApiListResponse<Category>>(
      `${serviceUrls.categories}/storefront/categories?isActive=true`,
      { tenantId, storefrontId }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getCategory(
  tenantId: string,
  storefrontId: string,
  categoryId: string
): Promise<Category | null> {
  try {
    // Use public storefront endpoint (no auth required)
    const response = await apiRequest<ApiResponse<Category>>(
      `${serviceUrls.categories}/storefront/categories/${categoryId}`,
      { tenantId, storefrontId }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return null;
  }
}

// ========================================
// Orders
// ========================================

export interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  customerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  total: number;
  subtotal: number;
  taxAmount?: number;
  tax?: number;
  shippingCost?: number;
  shipping?: number;
  discountAmount?: number;
  discount?: number;
  currency?: string;
  notes?: string;
  items: OrderItem[];
  customer?: OrderCustomer;
  shippingDetails?: OrderShipping;
  payment?: OrderPayment;
  timeline?: OrderTimelineEvent[];
  discounts?: OrderDiscount[];
  refunds?: OrderRefund[];
  shippingAddress?: Address;
  billingAddress?: Address;
  // Tax breakdown fields
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  utgstAmount?: number;
  gstCess?: number;
  isInterstate?: boolean;
  customerGstin?: string;
  vatAmount?: number;
  isVatReverseCharge?: boolean;
  customerVatNumber?: string;
  taxBreakdown?: TaxBreakdownItem[];
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCustomer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface OrderShipping {
  id?: string;
  method: string;
  carrier?: string;
  cost: number;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  stateCode?: string;
  postalCode: string;
  country: string;
  countryCode?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
}

export interface OrderPayment {
  id?: string;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: number;
  currency: string;
  transactionId?: string;
  gateway?: string;
}

export interface OrderTimelineEvent {
  id?: string;
  status: string;
  description: string;
  timestamp: string;
  createdBy?: string;
}

export interface OrderDiscount {
  id?: string;
  couponId?: string;
  couponCode?: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount: number;
  description?: string;
}

export interface OrderRefund {
  id?: string;
  amount: number;
  reason?: string;
  status: string;
  processedAt?: string;
}

export interface TaxBreakdownItem {
  jurisdictionName: string;
  taxType: string;
  rate: number;
  taxAmount: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Transform backend order format to frontend format
function transformOrder(order: any): Order {
  return {
    ...order,
    // Map items with correct field names
    items: (order.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName || item.name,
      price: item.unitPrice || item.price,
      quantity: item.quantity,
      image: item.image || '/placeholder.svg',
      variant: item.variant || item.sku,
    })),
    // Map trackingNumber from shipping if available
    trackingNumber: order.trackingNumber || order.shipping?.trackingNumber,
  };
}

export async function getOrders(
  tenantId: string,
  storefrontId: string,
  options?: { customerId?: string; email?: string; accessToken?: string }
): Promise<Order[]> {
  try {
    const params = new URLSearchParams();

    // If we have an accessToken, use the customer-authenticated endpoint
    // which validates ownership via JWT and only returns the customer's orders
    if (options?.accessToken) {
      const queryString = params.toString();
      const url = `${serviceUrls.orders}/storefront/my/orders${queryString ? `?${queryString}` : ''}`;

      const response = await apiRequest<any>(url, {
        tenantId,
        storefrontId,
        headers: {
          'Authorization': `Bearer ${options.accessToken}`,
        },
      });
      const orders = response.orders || response.data || [];
      return orders.map(transformOrder);
    }

    // Fallback: use admin endpoint with email filter (for backward compatibility)
    if (options?.customerId) params.set('customerId', options.customerId);
    if (options?.email) params.set('email', options.email);

    const queryString = params.toString();
    const url = `${serviceUrls.orders}/orders${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest<any>(url, { tenantId, storefrontId });
    const orders = response.orders || response.data || [];

    return orders.map(transformOrder);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

export async function getOrder(
  tenantId: string,
  storefrontId: string,
  orderId: string,
  accessToken?: string
): Promise<Order | null> {
  try {
    // Use customer-authenticated endpoint if accessToken is available
    const url = accessToken
      ? `${serviceUrls.orders}/storefront/my/orders/${orderId}`
      : `${serviceUrls.orders}/orders/${orderId}`;

    const response = await apiRequest<any>(url, {
      tenantId,
      storefrontId,
      ...(accessToken && {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
    });
    const order = response.data || response;
    return order?.id ? transformOrder(order) : null;
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  timeline: OrderTimelineEvent[];
}

export async function getOrderTracking(
  tenantId: string,
  storefrontId: string,
  orderId: string,
  accessToken?: string
): Promise<OrderTracking | null> {
  try {
    // Use customer-authenticated endpoint if accessToken is available
    const url = accessToken
      ? `${serviceUrls.orders}/storefront/my/orders/${orderId}/tracking`
      : `${serviceUrls.orders}/orders/${orderId}/tracking`;

    const response = await apiRequest<any>(url, {
      tenantId,
      storefrontId,
      ...(accessToken && {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
    });
    return response.data || response;
  } catch (error) {
    console.error('Failed to fetch order tracking:', error);
    return null;
  }
}

export interface ReturnItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
}

export interface Return {
  id: string;
  rmaNumber: string;
  orderId: string;
  status: string;
  reason: string;
  returnType: string;
  customerNotes: string;
  refundAmount: number;
  items: ReturnItem[];
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export async function getOrderReturns(
  tenantId: string,
  storefrontId: string,
  orderId: string
): Promise<Return[]> {
  try {
    const response = await apiRequest<any>(
      `${serviceUrls.orders}/returns?orderId=${orderId}`,
      { tenantId, storefrontId }
    );
    // API returns { returns: [...] }
    return response.returns || response.data || [];
  } catch (error) {
    console.error('Failed to fetch order returns:', error);
    return [];
  }
}
