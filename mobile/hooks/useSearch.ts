/**
 * Search hooks for mobile app
 * Powered by Typesense search service
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import {
  searchProducts,
  searchProductsWithFacets,
  searchCategories,
  globalSearch,
  getSuggestions,
  ProductSearchResult,
  CategorySearchResult,
  SearchResult,
  GlobalSearchResult,
} from '../lib/api/search';
import { APP_CONFIG, QUERY_KEYS } from '../lib/constants';
import { useAuthStore } from '../stores/auth-store';

// ========================================
// Types
// ========================================

export interface UseSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  minLength?: number;
}

export interface UseProductSearchOptions extends UseSearchOptions {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  perPage?: number;
}

// ========================================
// Product Search Hook
// ========================================

/**
 * Hook for searching products with Typesense
 * Includes debouncing, caching, and automatic tenant context
 */
export function useProductSearch(query: string, options: UseProductSearchOptions = {}) {
  const {
    enabled = true,
    debounceMs = APP_CONFIG.SEARCH_DEBOUNCE,
    minLength = APP_CONFIG.MIN_SEARCH_LENGTH,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock = true,
    sortBy = 'relevance',
    perPage = 20,
  } = options;

  const tenant = useAuthStore((state) => state.currentTenant);
  const tenantId = tenant?.id || '';

  // Debounce the search query
  const debouncedQuery = useDebounce(query, debounceMs);

  // Only search if query meets minimum length
  const shouldSearch = enabled && debouncedQuery.length >= minLength;

  const queryResult = useQuery<SearchResult<ProductSearchResult>>({
    queryKey: [
      ...QUERY_KEYS.SEARCH_PRODUCTS(tenantId, debouncedQuery),
      { category, brand, minPrice, maxPrice, inStock, sortBy },
    ],
    queryFn: () =>
      searchProductsWithFacets(debouncedQuery, {
        category,
        brand,
        minPrice,
        maxPrice,
        inStock,
        sortBy,
        perPage,
      }),
    enabled: shouldSearch && !!tenantId,
    staleTime: APP_CONFIG.STALE_TIME,
    gcTime: APP_CONFIG.GC_TIME,
  });

  return {
    ...queryResult,
    products: queryResult.data?.hits || [],
    totalResults: queryResult.data?.found || 0,
    searchTimeMs: queryResult.data?.search_time_ms || 0,
    facets: queryResult.data?.facets,
    isSearching: queryResult.isFetching,
    hasResults: (queryResult.data?.hits?.length || 0) > 0,
  };
}

// ========================================
// Category Search Hook
// ========================================

/**
 * Hook for searching categories with Typesense
 */
export function useCategorySearch(query: string, options: UseSearchOptions = {}) {
  const {
    enabled = true,
    debounceMs = APP_CONFIG.SEARCH_DEBOUNCE,
    minLength = APP_CONFIG.MIN_SEARCH_LENGTH,
  } = options;

  const tenant = useAuthStore((state) => state.currentTenant);
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength;

  const queryResult = useQuery<SearchResult<CategorySearchResult>>({
    queryKey: ['tenant', tenantId, 'search', 'categories', debouncedQuery],
    queryFn: () => searchCategories(debouncedQuery),
    enabled: shouldSearch && !!tenantId,
    staleTime: APP_CONFIG.STALE_TIME,
    gcTime: APP_CONFIG.GC_TIME,
  });

  return {
    ...queryResult,
    categories: queryResult.data?.hits || [],
    totalResults: queryResult.data?.found || 0,
    isSearching: queryResult.isFetching,
    hasResults: (queryResult.data?.hits?.length || 0) > 0,
  };
}

// ========================================
// Global Search Hook
// ========================================

/**
 * Hook for global search across products and categories
 * Useful for search overlay / command palette
 */
export function useGlobalSearch(
  query: string,
  options: UseSearchOptions & { perPage?: number } = {}
) {
  const {
    enabled = true,
    debounceMs = APP_CONFIG.SEARCH_DEBOUNCE,
    minLength = APP_CONFIG.MIN_SEARCH_LENGTH,
    perPage = 5,
  } = options;

  const tenant = useAuthStore((state) => state.currentTenant);
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength;

  const queryResult = useQuery<GlobalSearchResult>({
    queryKey: QUERY_KEYS.SEARCH(tenantId, debouncedQuery),
    queryFn: () => globalSearch(debouncedQuery, { perPage }),
    enabled: shouldSearch && !!tenantId,
    staleTime: APP_CONFIG.STALE_TIME,
    gcTime: APP_CONFIG.GC_TIME,
  });

  const totalResults = useMemo(() => {
    if (!queryResult.data) {
      return 0;
    }
    return (queryResult.data.products?.found || 0) + (queryResult.data.categories?.found || 0);
  }, [queryResult.data]);

  return {
    ...queryResult,
    products: queryResult.data?.products?.hits || [],
    categories: queryResult.data?.categories?.hits || [],
    totalResults,
    isSearching: queryResult.isFetching,
    hasResults: totalResults > 0,
  };
}

// ========================================
// Suggestions Hook
// ========================================

/**
 * Hook for autocomplete suggestions
 * Optimized for fast, real-time search-as-you-type
 */
export function useSearchSuggestions(
  query: string,
  collection: 'products' | 'categories' = 'products',
  options: UseSearchOptions & { limit?: number } = {}
) {
  const {
    enabled = true,
    debounceMs = 150, // Faster debounce for suggestions
    minLength = APP_CONFIG.MIN_SEARCH_LENGTH,
    limit = 5,
  } = options;

  const tenant = useAuthStore((state) => state.currentTenant);
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength;

  const queryResult = useQuery<ProductSearchResult[] | CategorySearchResult[]>({
    queryKey: QUERY_KEYS.SEARCH_SUGGESTIONS(tenantId, debouncedQuery),
    queryFn: () => getSuggestions(debouncedQuery, collection, limit),
    enabled: shouldSearch && !!tenantId,
    staleTime: 30000, // 30 seconds for suggestions
    gcTime: 60000, // 1 minute
  });

  return {
    ...queryResult,
    suggestions: queryResult.data || [],
    isSearching: queryResult.isFetching,
    hasSuggestions: (queryResult.data?.length || 0) > 0,
  };
}

// ========================================
// Search State Hook
// ========================================

/**
 * Hook for managing search state in a search screen/modal
 * Provides query state, filters, and pagination
 */
export function useSearchState() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  }>({});

  const queryClient = useQueryClient();
  const tenant = useAuthStore((state) => state.currentTenant);
  const tenantId = tenant?.id || '';

  const clearSearch = useCallback(() => {
    setQuery('');
    setPage(1);
    setFilters({});
  }, []);

  const updateFilter = useCallback(
    <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1); // Reset page when filters change
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const invalidateSearch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['tenant', tenantId, 'search'],
    });
  }, [queryClient, tenantId]);

  return {
    query,
    setQuery,
    page,
    setPage,
    filters,
    setFilters,
    updateFilter,
    clearSearch,
    clearFilters,
    invalidateSearch,
  };
}

export default {
  useProductSearch,
  useCategorySearch,
  useGlobalSearch,
  useSearchSuggestions,
  useSearchState,
};
