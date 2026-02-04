/**
 * Search API module for storefront
 * Powered by Typesense search service for fast, relevant results
 */

import { apiRequest, serviceUrls } from './client';

// System user ID for public storefront API requests (anonymous visitors)
// This allows the storefront to search without user authentication
const STOREFRONT_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

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

export interface GlobalSearchResult {
  products: SearchResult<ProductSearchResult>;
  categories: SearchResult<CategorySearchResult>;
}

// Typesense response types
interface TypesenseHit<T> {
  document: T;
  highlights?: Array<{ field: string; snippet: string }>;
  text_match?: number;
}

interface TypesenseFacetCount {
  value: string;
  count: number;
}

interface TypesenseFacet {
  field_name: string;
  counts: TypesenseFacetCount[];
}

interface TypesenseSearchResponse<T> {
  hits?: TypesenseHit<T>[];
  found?: number;
  search_time_ms?: number;
  page?: number;
  out_of?: number;
  facet_counts?: TypesenseFacet[];
}

// ========================================
// Search Functions
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
  // Server-side: Use API gateway or internal service URL
  const baseUrl = process.env.SEARCH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://dev-api.mark8ly.app';
  return `${baseUrl}/api/v1/search`;
}

/**
 * Search products using Typesense
 * Returns fast, relevant results with faceting support
 */
export async function searchProducts(
  tenantId: string,
  storefrontId: string,
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<ProductSearchResult>> {
  const searchUrl = getSearchUrl();

  const params: SearchOptions = {
    query,
    filter_by: options.filter_by, // Don't apply in_stock filter by default - allow searching all products
    sort_by: options.sort_by || '_text_match:desc,price:asc',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await fetch(`${searchUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vendor-ID': tenantId,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-User-ID': STOREFRONT_SYSTEM_USER_ID,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      console.error(`Search API error: status=${response.status}, body=${errorBody}`);
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();

    // Log search results for debugging
    if (result.data?.found === 0) {
      console.log(`Search for "${query}" returned 0 results (tenant: ${tenantId})`);
    }

    // Transform Typesense response to our format
    const data = result.data as TypesenseSearchResponse<ProductSearchResult> | undefined;
    return {
      hits: data?.hits?.map((hit) => hit.document) || [],
      found: data?.found || 0,
      search_time_ms: data?.search_time_ms || 0,
      page: data?.page || 1,
      out_of: data?.out_of || 0,
      facets: transformFacets(data?.facet_counts),
    };
  } catch (error) {
    console.error('Search products error:', error);
    // Return empty results instead of throwing - allows UI to show "no results" gracefully
    return {
      hits: [],
      found: 0,
      search_time_ms: 0,
      page: 1,
      out_of: 0,
    };
  }
}

/**
 * Search categories using Typesense
 */
export async function searchCategories(
  tenantId: string,
  storefrontId: string,
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<CategorySearchResult>> {
  const searchUrl = getSearchUrl();

  const params: SearchOptions = {
    query,
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await fetch(`${searchUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vendor-ID': tenantId,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-User-ID': STOREFRONT_SYSTEM_USER_ID,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data as TypesenseSearchResponse<CategorySearchResult> | undefined;

    return {
      hits: data?.hits?.map((hit) => hit.document) || [],
      found: data?.found || 0,
      search_time_ms: data?.search_time_ms || 0,
      page: data?.page || 1,
      out_of: data?.out_of || 0,
    };
  } catch (error) {
    console.error('Search categories error:', error);
    return {
      hits: [],
      found: 0,
      search_time_ms: 0,
      page: 1,
      out_of: 0,
    };
  }
}

/**
 * Global search across products and categories
 */
export async function globalSearch(
  tenantId: string,
  storefrontId: string,
  query: string,
  options: { perPage?: number } = {}
): Promise<GlobalSearchResult> {
  const searchUrl = getSearchUrl();
  const perPage = options.perPage || 5;

  try {
    const response = await fetch(`${searchUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vendor-ID': tenantId,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-User-ID': STOREFRONT_SYSTEM_USER_ID,
      },
      body: JSON.stringify({
        query,
        per_page: perPage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Global search failed: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data as {
      products?: TypesenseSearchResponse<ProductSearchResult>;
      categories?: TypesenseSearchResponse<CategorySearchResult>;
    } | undefined;

    return {
      products: transformSearchResult<ProductSearchResult>(data?.products),
      categories: transformSearchResult<CategorySearchResult>(data?.categories),
    };
  } catch (error) {
    console.error('Global search error:', error);
    return {
      products: { hits: [], found: 0, search_time_ms: 0, page: 1, out_of: 0 },
      categories: { hits: [], found: 0, search_time_ms: 0, page: 1, out_of: 0 },
    };
  }
}

/**
 * Get autocomplete suggestions
 */
export async function getSuggestions(
  tenantId: string,
  storefrontId: string,
  query: string,
  collection: 'products' | 'categories' = 'products',
  limit: number = 5
): Promise<ProductSearchResult[] | CategorySearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const searchUrl = getSearchUrl();

  try {
    const response = await fetch(
      `${searchUrl}/suggest?q=${encodeURIComponent(query)}&collection=${collection}`,
      {
        method: 'GET',
        headers: {
          'X-Vendor-ID': tenantId,
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
          'X-User-ID': STOREFRONT_SYSTEM_USER_ID,
        },
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

/**
 * Search products with facets for filtering
 */
export async function searchProductsWithFacets(
  tenantId: string,
  storefrontId: string,
  query: string,
  options: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    perPage?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  } = {}
): Promise<SearchResult<ProductSearchResult>> {
  // Build filter string
  const filters: string[] = [];

  // Only filter by in_stock if explicitly requested (not by default)
  if (options.inStock === true) {
    filters.push('in_stock:=true');
  }
  if (options.category) {
    filters.push(`category:=[${options.category}]`);
  }
  if (options.brand) {
    filters.push(`brand:=${options.brand}`);
  }
  if (options.minPrice !== undefined) {
    filters.push(`price:>=${options.minPrice}`);
  }
  if (options.maxPrice !== undefined) {
    filters.push(`price:<=${options.maxPrice}`);
  }

  // Build sort string
  let sortBy = '_text_match:desc';
  switch (options.sortBy) {
    case 'price_asc':
      sortBy = 'price:asc';
      break;
    case 'price_desc':
      sortBy = 'price:desc';
      break;
    case 'newest':
      sortBy = 'created_at:desc';
      break;
  }

  return searchProducts(tenantId, storefrontId, query, {
    filter_by: filters.length > 0 ? filters.join(' && ') : undefined,
    sort_by: sortBy,
    facet_by: ['category', 'brand', 'in_stock'],
    page: options.page || 1,
    per_page: options.perPage || 20,
  });
}

// ========================================
// Helper Functions
// ========================================

function transformSearchResult<T>(data: TypesenseSearchResponse<T> | undefined): SearchResult<T> {
  if (!data) {
    return { hits: [], found: 0, search_time_ms: 0, page: 1, out_of: 0 };
  }

  return {
    hits: data.hits?.map((hit) => hit.document) || [],
    found: data.found || 0,
    search_time_ms: data.search_time_ms || 0,
    page: data.page || 1,
    out_of: data.out_of || 0,
    facets: transformFacets(data.facet_counts),
  };
}

function transformFacets(facetCounts: TypesenseFacet[] | undefined): Record<string, FacetCount[]> | undefined {
  if (!facetCounts || facetCounts.length === 0) {
    return undefined;
  }

  const facets: Record<string, FacetCount[]> = {};
  for (const facet of facetCounts) {
    facets[facet.field_name] = facet.counts.map((c) => ({
      value: c.value,
      count: c.count,
    }));
  }
  return facets;
}

// ========================================
// Customer Order & Payment Search
// ========================================

export interface OrderSearchResult {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  itemCount: number;
  itemsSummary?: string;
}

export interface PaymentSearchResult {
  id: string;
  orderId: string;
  orderNumber: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
}

/**
 * Search customer orders by query (order number or items)
 * Fetches orders from API and filters client-side
 */
export async function searchCustomerOrders(
  tenantId: string,
  storefrontId: string,
  customerEmail: string,
  query: string,
  limit: number = 5
): Promise<OrderSearchResult[]> {
  if (!customerEmail || !query || query.length < 2) {
    return [];
  }

  try {
    const { getOrders } = await import('./storefront');
    const orders = await getOrders(tenantId, storefrontId, { email: customerEmail });

    const queryLower = query.toLowerCase();
    const filtered = orders.filter((order) => {
      // Search by order number
      if (order.orderNumber?.toLowerCase().includes(queryLower)) return true;
      // Search by status
      if (order.status?.toLowerCase().includes(queryLower)) return true;
      // Search by item names
      const itemNames = order.items?.map((item) => item.name?.toLowerCase()).join(' ') || '';
      if (itemNames.includes(queryLower)) return true;
      return false;
    });

    return filtered.slice(0, limit).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status || 'UNKNOWN',
      totalAmount: order.total,
      currency: order.currency || 'USD',
      createdAt: order.createdAt,
      itemCount: order.items?.length || 0,
      itemsSummary: order.items?.map((item) => item.name).join(', '),
    }));
  } catch (error) {
    console.error('Failed to search customer orders:', error);
    return [];
  }
}

/**
 * Search customer payments by query (transaction ID or order number)
 * Fetches orders and extracts payment info
 */
export async function searchCustomerPayments(
  tenantId: string,
  storefrontId: string,
  customerEmail: string,
  query: string,
  limit: number = 5
): Promise<PaymentSearchResult[]> {
  if (!customerEmail || !query || query.length < 2) {
    return [];
  }

  try {
    const { getOrders } = await import('./storefront');
    const orders = await getOrders(tenantId, storefrontId, { email: customerEmail });

    const queryLower = query.toLowerCase();
    const payments: PaymentSearchResult[] = [];

    for (const order of orders) {
      if (!order.payment) continue;

      const matches =
        order.payment.transactionId?.toLowerCase().includes(queryLower) ||
        order.orderNumber?.toLowerCase().includes(queryLower) ||
        order.payment.method?.toLowerCase().includes(queryLower);

      if (matches) {
        payments.push({
          id: order.payment.id || order.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionId: order.payment.transactionId || '',
          status: order.payment.status,
          amount: order.payment.amount,
          currency: order.payment.currency || order.currency || 'USD',
          paymentMethod: order.payment.method,
          createdAt: order.createdAt,
        });
      }

      if (payments.length >= limit) break;
    }

    return payments;
  } catch (error) {
    console.error('Failed to search customer payments:', error);
    return [];
  }
}
