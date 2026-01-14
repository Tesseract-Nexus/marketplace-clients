"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Query client configuration for storefront - optimized for customer-facing experience
// - Longer staleTime for better perceived performance
// - Aggressive prefetching for instant navigation
// - Offline-first for resilience
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data freshness: Consider data fresh for 2 minutes (customer-facing can be slightly stale)
        staleTime: 2 * 60 * 1000,

        // Garbage collection: Keep unused data for 15 minutes
        gcTime: 15 * 60 * 1000,

        // Retry configuration: 3 retries with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch behavior - aggressive for fresh data
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Offline-first: Serve stale data while revalidating
        networkMode: "offlineFirst",
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
        networkMode: "always",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Re-export hooks
export { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

// Query key factory for storefront
export const queryKeys = {
  // Products
  products: {
    all: ["products"] as const,
    list: (tenantId: string, filters: Record<string, unknown>) =>
      [...queryKeys.products.all, "list", tenantId, filters] as const,
    detail: (tenantId: string, id: string) =>
      [...queryKeys.products.all, "detail", tenantId, id] as const,
    search: (tenantId: string, query: string) =>
      [...queryKeys.products.all, "search", tenantId, query] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    tree: (tenantId: string) => [...queryKeys.categories.all, "tree", tenantId] as const,
    detail: (tenantId: string, id: string) => [...queryKeys.categories.all, "detail", tenantId, id] as const,
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    current: (tenantId: string, customerId?: string) =>
      [...queryKeys.cart.all, tenantId, customerId || "guest"] as const,
  },

  // Customer
  customer: {
    all: ["customer"] as const,
    profile: (tenantId: string, id: string) => [...queryKeys.customer.all, "profile", tenantId, id] as const,
    orders: (tenantId: string, id: string) => [...queryKeys.customer.all, "orders", tenantId, id] as const,
    addresses: (tenantId: string, id: string) => [...queryKeys.customer.all, "addresses", tenantId, id] as const,
    wishlist: (tenantId: string, id: string) => [...queryKeys.customer.all, "wishlist", tenantId, id] as const,
  },

  // Reviews
  reviews: {
    all: ["reviews"] as const,
    forProduct: (tenantId: string, productId: string) =>
      [...queryKeys.reviews.all, "product", tenantId, productId] as const,
  },

  // Storefront settings
  storefront: {
    all: ["storefront"] as const,
    settings: (tenantId: string) => [...queryKeys.storefront.all, "settings", tenantId] as const,
    theme: (tenantId: string) => [...queryKeys.storefront.all, "theme", tenantId] as const,
  },
};

// TTL constants for different data types
export const CACHE_TTL = {
  PRODUCTS: 5 * 60 * 1000,      // 5 minutes
  CATEGORIES: 30 * 60 * 1000,   // 30 minutes - rarely change
  CART: 0,                       // No caching - always fresh
  CUSTOMER: 2 * 60 * 1000,      // 2 minutes
  REVIEWS: 10 * 60 * 1000,      // 10 minutes
  STOREFRONT: 60 * 60 * 1000,   // 1 hour - very stable
};
