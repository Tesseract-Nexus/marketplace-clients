import { config } from '@/lib/config';

// ========================================
// API Client Base
// ========================================

export interface ApiClientOptions {
  tenantId?: string;
  storefrontId?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// System user ID for public storefront API requests (anonymous visitors)
// This allows the storefront to read public data like theme settings without user authentication
const STOREFRONT_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function apiRequest<T>(
  url: string,
  options: RequestInit & ApiClientOptions = {}
): Promise<T> {
  const { tenantId, storefrontId, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (tenantId) {
    (headers as Record<string, string>)['X-Tenant-ID'] = tenantId;
  }
  if (storefrontId) {
    (headers as Record<string, string>)['X-Storefront-ID'] = storefrontId;
  }
  // Add system user ID for public API requests (required by settings-service auth)
  (headers as Record<string, string>)['X-User-ID'] = STOREFRONT_SYSTEM_USER_ID;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error?.message || `Request failed with status ${response.status}`,
      response.status,
      errorData.error?.code
    );
  }

  return response.json();
}

// ========================================
// Service-specific clients
// ========================================

export function createApiClient(tenantId: string, storefrontId: string) {
  const defaultOptions: ApiClientOptions = { tenantId, storefrontId };

  return {
    get: <T>(url: string, options?: RequestInit) =>
      apiRequest<T>(url, { ...options, ...defaultOptions, method: 'GET' }),

    post: <T>(url: string, data?: unknown, options?: RequestInit) =>
      apiRequest<T>(url, {
        ...options,
        ...defaultOptions,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),

    put: <T>(url: string, data?: unknown, options?: RequestInit) =>
      apiRequest<T>(url, {
        ...options,
        ...defaultOptions,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),

    patch: <T>(url: string, data?: unknown, options?: RequestInit) =>
      apiRequest<T>(url, {
        ...options,
        ...defaultOptions,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }),

    delete: <T>(url: string, options?: RequestInit) =>
      apiRequest<T>(url, { ...options, ...defaultOptions, method: 'DELETE' }),
  };
}

// ========================================
// Service URLs
// ========================================

export const serviceUrls = {
  settings: config.api.settingsService,
  products: config.api.productsService,
  categories: config.api.categoriesService,
  orders: config.api.ordersService,
  cart: config.api.cartService,
  vendors: config.api.vendorsService,
  tickets: config.api.ticketsService,
};
