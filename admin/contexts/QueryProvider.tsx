"use client";

import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { REACT_QUERY_CONFIG, CACHE_TIMES, CIRCUIT_BREAKER_CONFIG } from "@/lib/polling/config";

/**
 * ENTERPRISE Query Client Configuration
 *
 * Optimized for production with:
 * - Configurable via environment variables
 * - Exponential backoff with max retry limit
 * - Network-aware caching (offlineFirst)
 * - Disabled refetchOnWindowFocus to prevent excessive API calls
 * - Per-query cache time customization via CACHE_TIMES
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ENTERPRISE: Data freshness - configurable via env
        staleTime: REACT_QUERY_CONFIG.STALE_TIME,

        // ENTERPRISE: Garbage collection - configurable via env
        gcTime: REACT_QUERY_CONFIG.GC_TIME,

        // ENTERPRISE: Retry with exponential backoff (matches circuit breaker config)
        retry: REACT_QUERY_CONFIG.RETRY_ATTEMPTS,
        retryDelay: (attemptIndex) =>
          Math.min(
            1000 * Math.pow(2, attemptIndex),
            CIRCUIT_BREAKER_CONFIG.MAX_BACKOFF
          ),

        // ENTERPRISE: Refetch behavior - disabled window focus to prevent tab-switch storms
        refetchOnWindowFocus: REACT_QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
        refetchOnReconnect: REACT_QUERY_CONFIG.REFETCH_ON_RECONNECT,
        refetchOnMount: true,

        // ENTERPRISE: Network mode - serve stale data while offline
        networkMode: "offlineFirst",
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,

        // Network mode for mutations - always attempt
        networkMode: "always",
      },
    },
  });
}

/**
 * ENTERPRISE: Cache time presets for different data types
 * Use these when defining queries:
 *
 * @example
 * useQuery({
 *   queryKey: ['products'],
 *   queryFn: fetchProducts,
 *   staleTime: CACHE_TIMES.STANDARD,
 * })
 */
export { CACHE_TIMES };

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Use useState to ensure the same client is used across renders
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

// Re-export hooks for convenience
export { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

// Custom hook for optimistic updates
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    queryKey: unknown[];
    optimisticUpdate: (variables: TVariables, previousData: TData | undefined) => TData;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = getQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(options.queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(options.queryKey, (old: TData | undefined) =>
        options.optimisticUpdate(variables, old)
      );

      // Return a context with the previous value
      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
      options.onError?.(error);
    },
    onSuccess: (data) => {
      options.onSuccess?.(data);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
}

// Custom hook for prefetching
export function usePrefetch() {
  const queryClient = getQueryClient();

  return {
    prefetchQuery: <TData,>(queryKey: unknown[], queryFn: () => Promise<TData>) => {
      return queryClient.prefetchQuery({ queryKey, queryFn });
    },
  };
}

// Query key factory for consistent key management
export const queryKeys = {
  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    overview: (tenantId: string) => [...queryKeys.products.all, "overview", tenantId] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Customers
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    tree: (tenantId: string) => [...queryKeys.categories.all, "tree", tenantId] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.categories.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.categories.all, "detail", id] as const,
  },

  // Inventory
  inventory: {
    all: ["inventory"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.inventory.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.inventory.all, "detail", id] as const,
  },

  // Analytics
  analytics: {
    all: ["analytics"] as const,
    dashboard: (tenantId: string) => [...queryKeys.analytics.all, "dashboard", tenantId] as const,
    sales: (tenantId: string, period: string) => [...queryKeys.analytics.all, "sales", tenantId, period] as const,
    customers: (tenantId: string) => [...queryKeys.analytics.all, "customers", tenantId] as const,
  },
};
