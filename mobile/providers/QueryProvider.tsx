import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { APP_CONFIG } from '@/lib/constants';

// Configure focus manager for React Native
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    handleFocus(state === 'active');
  });

  return () => {
    subscription.remove();
  };
});

// Create query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness
      staleTime: APP_CONFIG.STALE_TIME, // 1 minute
      gcTime: APP_CONFIG.GC_TIME, // 10 minutes (formerly cacheTime)

      // Refetching behavior
      refetchOnWindowFocus: Platform.OS === 'web',
      refetchOnMount: true,
      refetchOnReconnect: true,

      // Retry configuration
      retry: APP_CONFIG.MAX_RETRIES,
      retryDelay: (attemptIndex) =>
        Math.min(APP_CONFIG.RETRY_DELAY * Math.pow(2, attemptIndex), 30000),

      // Network mode
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations on failure
      retry: 1,
      retryDelay: APP_CONFIG.RETRY_DELAY,

      // Network mode
      networkMode: 'offlineFirst',
    },
  },
});

// Query key factory for type-safe keys
export const queryKeys = {
  // Auth
  user: ['user'] as const,
  tenants: ['tenants'] as const,

  // Tenant-scoped queries
  tenant: (tenantId: string) => ['tenant', tenantId] as const,

  products: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'products'] as const,
    list: (tenantId: string, filters?: object) =>
      [...queryKeys.products.all(tenantId), 'list', filters] as const,
    detail: (tenantId: string, id: string) =>
      [...queryKeys.products.all(tenantId), id] as const,
    stats: (tenantId: string) =>
      [...queryKeys.products.all(tenantId), 'stats'] as const,
  },

  orders: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'orders'] as const,
    list: (tenantId: string, filters?: object) =>
      [...queryKeys.orders.all(tenantId), 'list', filters] as const,
    detail: (tenantId: string, id: string) =>
      [...queryKeys.orders.all(tenantId), id] as const,
    stats: (tenantId: string) =>
      [...queryKeys.orders.all(tenantId), 'stats'] as const,
  },

  customers: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'customers'] as const,
    list: (tenantId: string, filters?: object) =>
      [...queryKeys.customers.all(tenantId), 'list', filters] as const,
    detail: (tenantId: string, id: string) =>
      [...queryKeys.customers.all(tenantId), id] as const,
    stats: (tenantId: string) =>
      [...queryKeys.customers.all(tenantId), 'stats'] as const,
  },

  categories: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'categories'] as const,
    tree: (tenantId: string) =>
      [...queryKeys.categories.all(tenantId), 'tree'] as const,
  },

  cart: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'cart'] as const,
    shippingRates: (tenantId: string) =>
      [...queryKeys.cart.all(tenantId), 'shipping-rates'] as const,
  },

  notifications: {
    all: (tenantId: string) =>
      [...queryKeys.tenant(tenantId), 'notifications'] as const,
    list: (tenantId: string, filters?: object) =>
      [...queryKeys.notifications.all(tenantId), 'list', filters] as const,
  },

  analytics: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'analytics'] as const,
    dashboard: (tenantId: string) =>
      [...queryKeys.analytics.all(tenantId), 'dashboard'] as const,
    sales: (tenantId: string, params?: object) =>
      [...queryKeys.analytics.all(tenantId), 'sales', params] as const,
    customers: (tenantId: string, params?: object) =>
      [...queryKeys.analytics.all(tenantId), 'customers', params] as const,
  },

  settings: {
    all: (tenantId: string) => [...queryKeys.tenant(tenantId), 'settings'] as const,
  },
} as const;

// Utility to invalidate all tenant-scoped queries
export const invalidateTenantQueries = (tenantId: string) => {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tenant(tenantId),
  });
};

// Utility to clear cache for non-current tenants (memory optimization)
export const clearOtherTenantCaches = (currentTenantId: string) => {
  queryClient.getQueryCache().findAll().forEach((query) => {
    const key = query.queryKey;
    if (
      Array.isArray(key) &&
      key[0] === 'tenant' &&
      key[1] !== currentTenantId
    ) {
      queryClient.removeQueries({ queryKey: key });
    }
  });
};

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
