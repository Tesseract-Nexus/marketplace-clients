/**
 * Search API module for admin dashboard
 * Powered by Typesense search service for fast, relevant results
 */

// ========================================
// Types
// ========================================

export interface SearchResult<T> {
  hits: T[];
  found: number;
  search_time_ms: number;
  page: number;
  out_of: number;
  facets?: Record<string, FacetCount[]>;
  cached?: boolean;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface ProductSearchResult {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  sku?: string;
  brand?: string;
  price: number;
  sale_price?: number;
  currency: string;
  category?: string[];
  tags?: string[];
  in_stock: boolean;
  image_url?: string;
  created_at: number;
  updated_at: number;
}

export interface CustomerSearchResult {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  total_orders: number;
  total_spent: number;
  status: string;
  created_at: number;
}

export interface OrderSearchResult {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  currency: string;
  status: string;
  items: string[];
  created_at: number;
}

export interface CategorySearchResult {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  level: number;
  product_count: number;
}

export interface SearchOptions {
  query: string;
  filter_by?: string;
  sort_by?: string;
  facet_by?: string[];
  page?: number;
  per_page?: number;
}

export interface GlobalSearchResults {
  products: SearchResult<ProductSearchResult>;
  customers: SearchResult<CustomerSearchResult>;
  orders: SearchResult<OrderSearchResult>;
  categories: SearchResult<CategorySearchResult>;
}

// ========================================
// Configuration
// ========================================

/**
 * Check if code is running in browser
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the search service URL
 * SECURITY: Client-side calls use Next.js API routes (internal proxy)
 * Server-side calls use internal service URLs directly
 */
function getSearchUrl(): string {
  // Client-side: Always use Next.js API routes to keep internal services hidden
  if (isBrowser()) {
    return '/api/search/typesense';
  }
  // Server-side: Use internal service URL or API gateway
  const baseUrl = process.env.SEARCH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || `https://dev-api.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com'}`;
  return `${baseUrl}/api/v1/search`;
}

/**
 * Get auth headers for API requests
 */
function getAuthHeaders(tenantId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-jwt-claim-vendor-id': tenantId,
    'x-jwt-claim-tenant-id': tenantId,
  };
}

// ========================================
// Search Functions
// ========================================

/**
 * Search products using Typesense
 */
export async function searchProducts(
  tenantId: string,
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<ProductSearchResult>> {
  const searchUrl = getSearchUrl();

  const params: SearchOptions = {
    query: query || '*',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await fetch(`${searchUrl}/products`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();
    return transformSearchResponse(result);
  } catch (error) {
    console.error('Search products error:', error);
    return emptyResult();
  }
}

/**
 * Search customers using Typesense
 */
export async function searchCustomers(
  tenantId: string,
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<CustomerSearchResult>> {
  const searchUrl = getSearchUrl();

  const params: SearchOptions = {
    query: query || '*',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await fetch(`${searchUrl}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();
    return transformSearchResponse(result);
  } catch (error) {
    console.error('Search customers error:', error);
    return emptyResult();
  }
}

/**
 * Search orders using Typesense
 */
export async function searchOrders(
  tenantId: string,
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<OrderSearchResult>> {
  const searchUrl = getSearchUrl();

  const params: SearchOptions = {
    query: query || '*',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await fetch(`${searchUrl}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();
    return transformSearchResponse(result);
  } catch (error) {
    console.error('Search orders error:', error);
    return emptyResult();
  }
}

/**
 * Search categories using Typesense
 */
export async function searchCategories(
  tenantId: string,
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<CategorySearchResult>> {
  const searchUrl = getSearchUrl();

  const params: SearchOptions = {
    query: query || '*',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await fetch(`${searchUrl}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();
    return transformSearchResponse(result);
  } catch (error) {
    console.error('Search categories error:', error);
    return emptyResult();
  }
}

/**
 * Global search across all collections
 */
export async function globalSearch(
  tenantId: string,
  query: string,
  options: { perPage?: number } = {}
): Promise<GlobalSearchResults> {
  const searchUrl = getSearchUrl();
  const perPage = options.perPage || 5;

  try {
    const response = await fetch(`${searchUrl}`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify({
        query,
        per_page: perPage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Global search failed: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data || {};

    return {
      products: transformSearchResponse({ data: data.products }),
      customers: transformSearchResponse({ data: data.customers }),
      orders: transformSearchResponse({ data: data.orders }),
      categories: transformSearchResponse({ data: data.categories }),
    };
  } catch (error) {
    console.error('Global search error:', error);
    return {
      products: emptyResult(),
      customers: emptyResult(),
      orders: emptyResult(),
      categories: emptyResult(),
    };
  }
}

/**
 * Get autocomplete suggestions
 */
export async function getSuggestions(
  tenantId: string,
  query: string,
  collection: 'products' | 'customers' | 'orders' | 'categories' = 'products',
  limit: number = 5
): Promise<any[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const searchUrl = getSearchUrl();

  try {
    const response = await fetch(
      `${searchUrl}/suggest?q=${encodeURIComponent(query)}&collection=${collection}`,
      {
        method: 'GET',
        headers: getAuthHeaders(tenantId),
      }
    );

    if (!response.ok) {
      throw new Error(`Suggestions failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.suggestions || [];
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

// ========================================
// Sync Functions (Admin Only)
// ========================================

export interface SyncResult {
  collection: string;
  tenant_id: string;
  total_fetched: number;
  total_indexed: number;
  total_failed: number;
  duration: string;
  started_at: string;
  completed_at: string;
  errors?: string[];
}

/**
 * Trigger full sync for a collection
 */
export async function syncCollection(
  tenantId: string,
  collection: 'products' | 'customers' | 'orders' | 'categories',
  authToken?: string
): Promise<SyncResult | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || `https://dev-api.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com'}`;
  const syncUrl = `${baseUrl}/api/v1/index/sync/${collection}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-jwt-claim-vendor-id': tenantId,
      'x-jwt-claim-tenant-id': tenantId,
    };

    if (authToken) {
      headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    }

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Sync ${collection} error:`, error);
    return null;
  }
}

/**
 * Trigger full sync for all collections
 */
export async function syncAllCollections(
  tenantId: string,
  authToken?: string
): Promise<Record<string, SyncResult> | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || `https://dev-api.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com'}`;
  const syncUrl = `${baseUrl}/api/v1/index/sync/all`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-jwt-claim-vendor-id': tenantId,
      'x-jwt-claim-tenant-id': tenantId,
    };

    if (authToken) {
      headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    }

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Sync all failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Sync all error:', error);
    return null;
  }
}

// ========================================
// Helper Functions
// ========================================

function transformSearchResponse<T>(response: any): SearchResult<T> {
  const data = response.data || response;

  if (!data) {
    return emptyResult();
  }

  return {
    hits: data.hits?.map((hit: any) => hit.document) || [],
    found: data.found || 0,
    search_time_ms: data.search_time_ms || 0,
    page: data.page || 1,
    out_of: data.out_of || 0,
    facets: transformFacets(data.facet_counts),
    cached: response.cached,
  };
}

function transformFacets(facetCounts: any[]): Record<string, FacetCount[]> | undefined {
  if (!facetCounts || facetCounts.length === 0) {
    return undefined;
  }

  const facets: Record<string, FacetCount[]> = {};
  for (const facet of facetCounts) {
    facets[facet.field_name] = facet.counts.map((c: any) => ({
      value: c.value,
      count: c.count,
    }));
  }
  return facets;
}

function emptyResult<T>(): SearchResult<T> {
  return {
    hits: [],
    found: 0,
    search_time_ms: 0,
    page: 1,
    out_of: 0,
  };
}
