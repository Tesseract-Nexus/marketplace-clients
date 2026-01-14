/**
 * Search hooks for admin dashboard
 * Powered by Typesense search service
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchProducts,
  searchCustomers,
  searchOrders,
  searchCategories,
  globalSearch,
  getSuggestions,
  syncCollection,
  syncAllCollections,
  ProductSearchResult,
  CustomerSearchResult,
  OrderSearchResult,
  CategorySearchResult,
  SearchResult,
  GlobalSearchResults,
  SyncResult,
} from '@/lib/api/search';
import { useTenant } from '@/contexts/TenantContext';

// ========================================
// Constants
// ========================================

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 2;
const SEARCH_STALE_TIME = 60000; // 1 minute
const SEARCH_CACHE_TIME = 300000; // 5 minutes

// ========================================
// Types
// ========================================

export interface UseSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  minLength?: number;
}

export interface UseProductSearchOptions extends UseSearchOptions {
  filterBy?: string;
  sortBy?: string;
  facetBy?: string[];
  perPage?: number;
  page?: number;
}

// ========================================
// Debounce Hook
// ========================================

function useDebounce<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ========================================
// Product Search Hook
// ========================================

/**
 * Hook for searching products with Typesense
 */
export function useProductSearch(
  query: string,
  options: UseProductSearchOptions = {}
) {
  const {
    enabled = true,
    debounceMs = SEARCH_DEBOUNCE_MS,
    minLength = SEARCH_MIN_LENGTH,
    filterBy,
    sortBy,
    facetBy,
    perPage = 20,
    page = 1,
  } = options;

  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength && !!tenantId;

  const queryResult = useQuery<SearchResult<ProductSearchResult>>({
    queryKey: ['search', 'products', tenantId, debouncedQuery, { filterBy, sortBy, facetBy, perPage, page }],
    queryFn: () =>
      searchProducts(tenantId, debouncedQuery, {
        filter_by: filterBy,
        sort_by: sortBy,
        facet_by: facetBy,
        per_page: perPage,
        page,
      }),
    enabled: shouldSearch,
    staleTime: SEARCH_STALE_TIME,
    gcTime: SEARCH_CACHE_TIME,
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
// Customer Search Hook
// ========================================

/**
 * Hook for searching customers with Typesense
 */
export function useCustomerSearch(
  query: string,
  options: UseSearchOptions & { perPage?: number; page?: number } = {}
) {
  const {
    enabled = true,
    debounceMs = SEARCH_DEBOUNCE_MS,
    minLength = SEARCH_MIN_LENGTH,
    perPage = 20,
    page = 1,
  } = options;

  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength && !!tenantId;

  const queryResult = useQuery<SearchResult<CustomerSearchResult>>({
    queryKey: ['search', 'customers', tenantId, debouncedQuery, { perPage, page }],
    queryFn: () =>
      searchCustomers(tenantId, debouncedQuery, {
        per_page: perPage,
        page,
      }),
    enabled: shouldSearch,
    staleTime: SEARCH_STALE_TIME,
    gcTime: SEARCH_CACHE_TIME,
  });

  return {
    ...queryResult,
    customers: queryResult.data?.hits || [],
    totalResults: queryResult.data?.found || 0,
    searchTimeMs: queryResult.data?.search_time_ms || 0,
    isSearching: queryResult.isFetching,
    hasResults: (queryResult.data?.hits?.length || 0) > 0,
  };
}

// ========================================
// Order Search Hook
// ========================================

/**
 * Hook for searching orders with Typesense
 */
export function useOrderSearch(
  query: string,
  options: UseSearchOptions & { perPage?: number; page?: number; filterBy?: string } = {}
) {
  const {
    enabled = true,
    debounceMs = SEARCH_DEBOUNCE_MS,
    minLength = SEARCH_MIN_LENGTH,
    perPage = 20,
    page = 1,
    filterBy,
  } = options;

  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength && !!tenantId;

  const queryResult = useQuery<SearchResult<OrderSearchResult>>({
    queryKey: ['search', 'orders', tenantId, debouncedQuery, { perPage, page, filterBy }],
    queryFn: () =>
      searchOrders(tenantId, debouncedQuery, {
        per_page: perPage,
        page,
        filter_by: filterBy,
      }),
    enabled: shouldSearch,
    staleTime: SEARCH_STALE_TIME,
    gcTime: SEARCH_CACHE_TIME,
  });

  return {
    ...queryResult,
    orders: queryResult.data?.hits || [],
    totalResults: queryResult.data?.found || 0,
    searchTimeMs: queryResult.data?.search_time_ms || 0,
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
export function useCategorySearch(
  query: string,
  options: UseSearchOptions & { perPage?: number; page?: number } = {}
) {
  const {
    enabled = true,
    debounceMs = SEARCH_DEBOUNCE_MS,
    minLength = SEARCH_MIN_LENGTH,
    perPage = 20,
    page = 1,
  } = options;

  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength && !!tenantId;

  const queryResult = useQuery<SearchResult<CategorySearchResult>>({
    queryKey: ['search', 'categories', tenantId, debouncedQuery, { perPage, page }],
    queryFn: () =>
      searchCategories(tenantId, debouncedQuery, {
        per_page: perPage,
        page,
      }),
    enabled: shouldSearch,
    staleTime: SEARCH_STALE_TIME,
    gcTime: SEARCH_CACHE_TIME,
  });

  return {
    ...queryResult,
    categories: queryResult.data?.hits || [],
    totalResults: queryResult.data?.found || 0,
    searchTimeMs: queryResult.data?.search_time_ms || 0,
    isSearching: queryResult.isFetching,
    hasResults: (queryResult.data?.hits?.length || 0) > 0,
  };
}

// ========================================
// Global Search Hook
// ========================================

/**
 * Hook for global search across all collections
 * Useful for command palette / global search
 */
export function useGlobalSearch(
  query: string,
  options: UseSearchOptions & { perPage?: number } = {}
) {
  const {
    enabled = true,
    debounceMs = SEARCH_DEBOUNCE_MS,
    minLength = SEARCH_MIN_LENGTH,
    perPage = 5,
  } = options;

  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength && !!tenantId;

  const queryResult = useQuery<GlobalSearchResults>({
    queryKey: ['search', 'global', tenantId, debouncedQuery, { perPage }],
    queryFn: () => globalSearch(tenantId, debouncedQuery, { perPage }),
    enabled: shouldSearch,
    staleTime: SEARCH_STALE_TIME,
    gcTime: SEARCH_CACHE_TIME,
  });

  const totalResults = useMemo(() => {
    if (!queryResult.data) return 0;
    return (
      (queryResult.data.products?.found || 0) +
      (queryResult.data.customers?.found || 0) +
      (queryResult.data.orders?.found || 0) +
      (queryResult.data.categories?.found || 0)
    );
  }, [queryResult.data]);

  return {
    ...queryResult,
    products: queryResult.data?.products?.hits || [],
    customers: queryResult.data?.customers?.hits || [],
    orders: queryResult.data?.orders?.hits || [],
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
 */
export function useSearchSuggestions(
  query: string,
  collection: 'products' | 'customers' | 'orders' | 'categories' = 'products',
  options: UseSearchOptions & { limit?: number } = {}
) {
  const {
    enabled = true,
    debounceMs = 150,
    minLength = SEARCH_MIN_LENGTH,
    limit = 5,
  } = options;

  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const debouncedQuery = useDebounce(query, debounceMs);
  const shouldSearch = enabled && debouncedQuery.length >= minLength && !!tenantId;

  const queryResult = useQuery<any[]>({
    queryKey: ['search', 'suggestions', tenantId, collection, debouncedQuery, { limit }],
    queryFn: () => getSuggestions(tenantId, debouncedQuery, collection, limit),
    enabled: shouldSearch,
    staleTime: 30000,
    gcTime: 60000,
  });

  return {
    ...queryResult,
    suggestions: queryResult.data || [],
    isSearching: queryResult.isFetching,
    hasSuggestions: (queryResult.data?.length || 0) > 0,
  };
}

// ========================================
// Sync Hooks
// ========================================

/**
 * Hook for syncing a collection to Typesense
 */
export function useSyncCollection() {
  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';
  const queryClient = useQueryClient();

  return useMutation<SyncResult | null, Error, {
    collection: 'products' | 'customers' | 'orders' | 'categories';
    authToken?: string;
  }>({
    mutationFn: ({ collection, authToken }) =>
      syncCollection(tenantId, collection, authToken),
    onSuccess: (data, { collection }) => {
      // Invalidate search queries for the synced collection
      queryClient.invalidateQueries({
        queryKey: ['search', collection, tenantId],
      });
    },
  });
}

/**
 * Hook for syncing all collections to Typesense
 */
export function useSyncAllCollections() {
  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';
  const queryClient = useQueryClient();

  return useMutation<Record<string, SyncResult> | null, Error, { authToken?: string }>({
    mutationFn: ({ authToken }) => syncAllCollections(tenantId, authToken),
    onSuccess: () => {
      // Invalidate all search queries
      queryClient.invalidateQueries({
        queryKey: ['search'],
      });
    },
  });
}

// ========================================
// Search State Hook
// ========================================

/**
 * Hook for managing search state
 */
export function useSearchState() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | number | boolean>>({});

  const queryClient = useQueryClient();
  const { currentTenant: tenant } = useTenant();
  const tenantId = tenant?.id || '';

  const clearSearch = useCallback(() => {
    setQuery('');
    setPage(1);
    setFilters({});
  }, []);

  const updateFilter = useCallback(
    (key: string, value: string | number | boolean | undefined) => {
      setFilters((prev) => {
        if (value === undefined) {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: value };
      });
      setPage(1);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const invalidateSearch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['search'],
    });
  }, [queryClient]);

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
