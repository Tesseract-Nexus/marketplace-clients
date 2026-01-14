'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { CACHE_TIMES, queryKeys } from '@/contexts/QueryProvider';

/**
 * Analytics Query Hooks with React Query Caching
 *
 * These hooks provide cached data fetching for dashboard and analytics pages.
 * Data is cached according to CACHE_TIMES configuration to reduce network requests.
 *
 * Cache Strategy:
 * - Dashboard data: STANDARD (2 minutes) - frequently viewed but doesn't need real-time
 * - Analytics overview: STANDARD (2 minutes) - aggregated data can be slightly stale
 * - Sales analytics: VOLATILE (30 seconds) - more frequently changing
 * - Customer analytics: STANDARD (2 minutes) - aggregated data
 * - Inventory analytics: VOLATILE (30 seconds) - stock levels can change quickly
 */

// Types for analytics data
interface AnalyticsOverviewData {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueChange: number;
    ordersChange: number;
    aovChange: number;
    revenueByDay: Array<{ date: string; value: number }>;
    topProducts: Array<{ productName: string; revenue: number; unitsSold: number }>;
    topCategories: Array<{ categoryName: string; revenue: number }>;
  } | null;
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  } | null;
  customers: {
    totalCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
    averageLifetimeValue: number;
  } | null;
  financial: {
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    grossProfitMargin: number;
  } | null;
}

interface SalesAnalyticsData {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  totalItemsSold: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  revenueByDay: Array<{ date: string; value: number; count?: number }>;
  ordersByDay: Array<{ date: string; value: number; count?: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    revenue: number;
    averagePrice: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    unitsSold: number;
    revenue: number;
    orderCount: number;
  }>;
  revenueByStatus: Array<{
    status: string;
    orderCount: number;
    totalRevenue: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    orderCount: number;
    totalAmount: number;
    percentage: number;
    successRate: number;
  }>;
}

interface CustomerAnalyticsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  averageOrdersPerCustomer: number;
  customerRetentionRate: number;
  customersByValue: Array<{
    segmentName: string;
    customerCount: number;
    totalRevenue: number;
    averageValue: number;
    percentage: number;
  }>;
  customersByOrders: Array<{
    segmentName: string;
    customerCount: number;
    totalRevenue: number;
    averageValue: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate: string;
    lastOrderDate: string;
    daysSinceLastOrder: number;
  }>;
  customerGrowth: Array<{
    date: string;
    value: number;
    count?: number;
  }>;
  geographicDistribution: Array<{
    country: string;
    state?: string;
    city?: string;
    customerCount: number;
    orderCount: number;
    revenue: number;
  }>;
  customerCohorts: Array<{
    cohortMonth: string;
    customerCount: number;
    retentionRates: number[];
  }>;
}

interface InventoryAnalyticsData {
  totalProducts: number;
  totalSkus: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    stockLevel: number;
    reorderLevel: number;
    value: number;
    lastRestocked?: string;
  }>;
  outOfStockProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    stockLevel: number;
    reorderLevel: number;
    value: number;
    lastRestocked?: string;
  }>;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    daysInStock: number;
    turnoverRate: number;
    currentStock: number;
  }>;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    daysInStock: number;
    turnoverRate: number;
    currentStock: number;
  }>;
  inventoryByCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
  }>;
  inventoryTurnover: Array<{
    period: string;
    turnoverRate: number;
    daysToSell: number;
  }>;
}

/**
 * Hook for fetching analytics overview data with caching
 */
export function useAnalyticsOverview(dateRange: string = 'last30days') {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';

  return useQuery<AnalyticsOverviewData>({
    queryKey: [...queryKeys.analytics.all, 'overview', tenantId, dateRange],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant selected');

      const response = await fetch(`/api/analytics/overview?preset=${dateRange}`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics overview');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!tenantId,
    staleTime: CACHE_TIMES.STANDARD, // 2 minutes - good for overview data
    gcTime: CACHE_TIMES.SEMI_STATIC, // 5 minutes before garbage collection
  });
}

/**
 * Hook for fetching sales analytics with caching
 */
export function useSalesAnalytics(dateRange: string = 'last30days') {
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const tenantId = currentTenant?.id || '';
  const userId = user?.id || '';

  return useQuery<SalesAnalyticsData>({
    queryKey: queryKeys.analytics.sales(tenantId, dateRange),
    queryFn: async () => {
      if (!tenantId || !userId) throw new Error('Missing tenant or user');

      const response = await fetch(`/api/analytics/sales?preset=${dateRange}`, {
        headers: {
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales analytics');
      }

      return response.json();
    },
    enabled: !!tenantId && !!userId,
    staleTime: CACHE_TIMES.VOLATILE, // 30 seconds - sales data changes more frequently
    gcTime: CACHE_TIMES.STANDARD, // 2 minutes before garbage collection
  });
}

/**
 * Hook for fetching customer analytics with caching
 */
export function useCustomerAnalytics(dateRange: string = 'last30days') {
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const tenantId = currentTenant?.id || '';
  const userId = user?.id || '';

  return useQuery<CustomerAnalyticsData>({
    queryKey: [...queryKeys.analytics.customers(tenantId), dateRange],
    queryFn: async () => {
      if (!tenantId || !userId) throw new Error('Missing tenant or user');

      const response = await fetch(`/api/analytics/customers?preset=${dateRange}`, {
        headers: {
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer analytics');
      }

      return response.json();
    },
    enabled: !!tenantId && !!userId,
    staleTime: CACHE_TIMES.STANDARD, // 2 minutes - customer data is fairly stable
    gcTime: CACHE_TIMES.SEMI_STATIC, // 5 minutes before garbage collection
  });
}

/**
 * Hook for fetching inventory analytics with caching
 */
export function useInventoryAnalytics(dateRange: string = 'last30days') {
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const tenantId = currentTenant?.id || '';
  const userId = user?.id || '';

  return useQuery<InventoryAnalyticsData>({
    queryKey: [...queryKeys.analytics.all, 'inventory', tenantId, dateRange],
    queryFn: async () => {
      if (!tenantId || !userId) throw new Error('Missing tenant or user');

      const response = await fetch(`/api/analytics/inventory?preset=${dateRange}`, {
        headers: {
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory analytics');
      }

      return response.json();
    },
    enabled: !!tenantId && !!userId,
    staleTime: CACHE_TIMES.VOLATILE, // 30 seconds - inventory can change quickly
    gcTime: CACHE_TIMES.STANDARD, // 2 minutes before garbage collection
  });
}

/**
 * Hook to manually invalidate analytics cache
 * Useful when user manually refreshes or after mutations
 */
export function useInvalidateAnalytics() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';

  return {
    invalidateOverview: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.analytics.all, 'overview', tenantId],
      });
    },
    invalidateSales: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.sales(tenantId, ''),
        exact: false,
      });
    },
    invalidateCustomers: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.customers(tenantId),
      });
    },
    invalidateInventory: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.analytics.all, 'inventory', tenantId],
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all,
      });
    },
  };
}
