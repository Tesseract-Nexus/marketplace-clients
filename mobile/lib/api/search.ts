/**
 * Search API module for mobile app
 * Powered by Typesense search service for fast, relevant results
 */

import { ENDPOINTS } from '../constants';
import { apiGet, apiPost } from './client';

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

// ========================================
// Search Functions
// ========================================

/**
 * Search products using Typesense
 * Returns fast, relevant results with faceting support
 */
export async function searchProducts(
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<ProductSearchResult>> {
  const params: SearchOptions = {
    query: query || '*',
    filter_by: options.filter_by || 'in_stock:=true',
    sort_by: options.sort_by || '_text_match:desc,price:asc',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await apiPost<SearchResult<ProductSearchResult>>(
      ENDPOINTS.SEARCH.PRODUCTS,
      params
    );

    return transformSearchResponse(response.data);
  } catch (error) {
    console.error('Search products error:', error);
    return emptyResult();
  }
}

/**
 * Search categories using Typesense
 */
export async function searchCategories(
  query: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult<CategorySearchResult>> {
  const params: SearchOptions = {
    query: query || '*',
    page: options.page || 1,
    per_page: options.per_page || 20,
    ...options,
  };

  try {
    const response = await apiPost<SearchResult<CategorySearchResult>>(
      ENDPOINTS.SEARCH.CATEGORIES,
      params
    );

    return transformSearchResponse(response.data);
  } catch (error) {
    console.error('Search categories error:', error);
    return emptyResult();
  }
}

/**
 * Global search across products and categories
 */
export async function globalSearch(
  query: string,
  options: { perPage?: number } = {}
): Promise<GlobalSearchResult> {
  const perPage = options.perPage || 5;

  try {
    const response = await apiPost<{
      products?: SearchResult<ProductSearchResult>;
      categories?: SearchResult<CategorySearchResult>;
    }>(ENDPOINTS.SEARCH.GLOBAL, {
      query,
      per_page: perPage,
    });

    const data = response.data || {};

    return {
      products: data.products ? transformSearchResponse(data.products) : emptyResult(),
      categories: data.categories ? transformSearchResponse(data.categories) : emptyResult(),
    };
  } catch (error) {
    console.error('Global search error:', error);
    return {
      products: emptyResult(),
      categories: emptyResult(),
    };
  }
}

/**
 * Get autocomplete suggestions
 */
export async function getSuggestions(
  query: string,
  collection: 'products' | 'categories' = 'products',
  limit: number = 5
): Promise<ProductSearchResult[] | CategorySearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await apiGet<{ suggestions: ProductSearchResult[] | CategorySearchResult[] }>(
      `${ENDPOINTS.SEARCH.SUGGEST}?q=${encodeURIComponent(query)}&collection=${collection}&limit=${limit}`
    );

    return response.data?.suggestions || [];
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

/**
 * Search products with facets for filtering
 * Useful for product listing pages with filters
 */
export async function searchProductsWithFacets(
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

  if (options.inStock !== false) {
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

  return searchProducts(query, {
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

function transformSearchResponse<T>(data: any): SearchResult<T> {
  if (!data) {
    return emptyResult();
  }

  // Handle direct response or wrapped in data property
  const searchData = data.data || data;

  return {
    hits: searchData.hits?.map((hit: any) => hit.document || hit) || [],
    found: searchData.found || 0,
    search_time_ms: searchData.search_time_ms || 0,
    page: searchData.page || 1,
    out_of: searchData.out_of || 0,
    facets: transformFacets(searchData.facet_counts),
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

// ========================================
// Search API Export
// ========================================

export const searchApi = {
  products: searchProducts,
  productsWithFacets: searchProductsWithFacets,
  categories: searchCategories,
  global: globalSearch,
  suggestions: getSuggestions,
};
