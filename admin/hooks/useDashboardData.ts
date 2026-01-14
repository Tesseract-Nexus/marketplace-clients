'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { CACHE_TIMES, queryKeys } from '@/contexts/QueryProvider';
import { orderService } from '@/lib/services/orderService';
import { productService } from '@/lib/services/productService';
import { customerService } from '@/lib/services/customerService';
import { reviewService } from '@/lib/services/reviewService';
import {
  DashboardData,
  DashboardStats,
  ActivityItem,
  InventoryItem,
  OrderAnalyticsData,
  RevenueTrendItem,
  TopProductItem,
  SatisfactionData,
  RecentOrder,
  LowStockProduct,
} from '@/lib/types/dashboard';

/**
 * Dashboard Data Hook with React Query Caching
 *
 * This hook fetches all dashboard data in parallel and caches the results.
 * The cache prevents redundant API calls when navigating away and back.
 *
 * Cache Strategy:
 * - staleTime: 2 minutes (STANDARD) - data shown on dashboard can be slightly stale
 * - gcTime: 5 minutes (SEMI_STATIC) - keep in cache for navigation back
 */

// Initial empty state for dashboard data
const initialDashboardData: DashboardData = {
  stats: {
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    totalProducts: 0,
    productsChange: 0,
    totalCustomers: 0,
    customersChange: 0,
  },
  recentOrders: [],
  lowStockProducts: [],
  activityFeed: [],
  inventoryData: [],
  orderAnalytics: {
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  },
  revenueTrend: [],
  topProducts: [],
  satisfaction: { avgRating: 0, totalReviews: 0, satisfactionRate: 0 },
};

async function fetchDashboardData(): Promise<DashboardData> {
  // Parallel data fetching - use Promise.allSettled to handle partial failures gracefully
  // PERFORMANCE: Reduced limits to match actual display needs (dashboard shows max 5-10 items per widget)
  const results = await Promise.allSettled([
    orderService.getOrders({ limit: 10 }),      // Only need 5 recent + some for analytics
    productService.getProducts({ limit: 15 }),  // Only need 10 for inventory chart + 5 low stock
    customerService.getCustomers({ limit: 1 }), // Just for total count
    reviewService.getReviews({ limit: 10 }),    // Only need 5 for activity feed
    orderService.getOrderAnalytics().catch(() => null), // Analytics is optional
    reviewService.getStatistics().catch(() => null) // Pre-calculated review statistics
  ]);

  // Extract results safely
  const ordersRes = results[0].status === 'fulfilled' ? results[0].value : { data: [], pagination: { total: 0 } };
  const productsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [], pagination: { total: 0 } };
  const customersRes = results[2].status === 'fulfilled' ? results[2].value : { data: [], pagination: { total: 0 } };
  const reviewsRes = results[3].status === 'fulfilled' ? results[3].value : { data: [], pagination: { total: 0 } };
  const analyticsRes = results[4].status === 'fulfilled' ? results[4].value : null;
  const reviewStatsRes = results[5].status === 'fulfilled' ? results[5].value : null;

  // Process Orders
  const orders = ordersRes.data || [];
  const totalOrders = ordersRes.pagination?.total || orders.length;

  // Calculate analytics from orders if API analytics not available
  const totalRevenue = orders.reduce((sum: number, order: { total?: string | number }) => sum + (parseFloat(String(order.total)) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / orders.length : 0;

  // Process Analytics Data - use API data if available, otherwise calculate from orders
  const analytics = analyticsRes?.data?.overview || null;

  // Calculate order status counts from orders data as fallback
  const statusCounts = {
    pendingOrders: orders.filter((o: { status?: string }) => o.status === 'PLACED' || o.status === 'PENDING').length,
    processingOrders: orders.filter((o: { status?: string }) => o.status === 'PROCESSING' || o.status === 'CONFIRMED').length,
    shippedOrders: orders.filter((o: { fulfillmentStatus?: string }) =>
      o.fulfillmentStatus === 'DISPATCHED' ||
      o.fulfillmentStatus === 'IN_TRANSIT' ||
      o.fulfillmentStatus === 'OUT_FOR_DELIVERY' ||
      o.fulfillmentStatus === 'SHIPPED'
    ).length,
    deliveredOrders: orders.filter((o: { fulfillmentStatus?: string; status?: string }) => o.fulfillmentStatus === 'DELIVERED' || o.status === 'COMPLETED').length,
    cancelledOrders: orders.filter((o: { status?: string }) => o.status === 'CANCELLED').length,
  };

  const orderAnalytics: OrderAnalyticsData = {
    totalOrders: analytics?.totalOrders || totalOrders,
    pendingOrders: analytics?.pendingOrders || statusCounts.pendingOrders,
    processingOrders: analytics?.processingOrders || statusCounts.processingOrders,
    shippedOrders: analytics?.shippedOrders || statusCounts.shippedOrders,
    deliveredOrders: analytics?.deliveredOrders || statusCounts.deliveredOrders,
    cancelledOrders: analytics?.cancelledOrders || statusCounts.cancelledOrders,
    totalRevenue: analytics?.totalRevenue || totalRevenue,
    averageOrderValue: analytics?.averageOrderValue || avgOrderValue,
  };

  // Calculate 7-day revenue trend from orders
  const last7Days: RevenueTrendItem[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter((o: { createdAt?: string; orderDate?: string }) => {
      const orderDate = new Date(o.createdAt || o.orderDate || '').toISOString().split('T')[0];
      return orderDate === dateStr;
    });
    last7Days.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((sum: number, o: { total?: string | number }) => sum + (parseFloat(String(o.total)) || 0), 0),
      orders: dayOrders.length
    });
  }

  // Calculate Top Selling Products from order items
  const productSales: Record<string, { name: string; units: number; revenue: number }> = {};
  orders.forEach((order: { items?: Array<{ productName?: string; name?: string; quantity?: number; totalPrice?: string | number; total?: string | number }> }) => {
    (order.items || []).forEach((item) => {
      const productName = item.productName || item.name || 'Unknown';
      if (!productSales[productName]) {
        productSales[productName] = { name: productName, units: 0, revenue: 0 };
      }
      productSales[productName].units += item.quantity || 1;
      productSales[productName].revenue += parseFloat(String(item.totalPrice || item.total || 0));
    });
  });
  const topProducts: TopProductItem[] = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Customer Satisfaction - use pre-calculated statistics from server API
  let satisfaction: SatisfactionData = { avgRating: 0, totalReviews: 0, satisfactionRate: 0 };

  if (reviewStatsRes?.success && reviewStatsRes?.data) {
    const stats = reviewStatsRes.data;
    satisfaction = {
      avgRating: stats.avgRating || 0,
      totalReviews: stats.totalReviews || 0,
      satisfactionRate: stats.satisfactionRate || 0,
    };
  } else {
    const totalReviews = reviewsRes.pagination?.total || (reviewsRes.data || []).length;
    satisfaction = {
      avgRating: 0,
      totalReviews,
      satisfactionRate: 0,
    };
  }

  // Process Products
  const products = productsRes.data || [];
  const totalProducts = productsRes.pagination?.total || products.length;
  const lowStockProducts: LowStockProduct[] = products.filter((p: { quantity?: number; lowStockThreshold?: number }) =>
    (p.quantity || 0) <= (p.lowStockThreshold || 5)
  ).slice(0, 5).map((p: { id: string; name: string; sku?: string; quantity?: number; lowStockThreshold?: number }) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    quantity: p.quantity || 0,
    lowStockThreshold: p.lowStockThreshold,
  }));

  // Process Inventory Data for chart (top 10 products by name for visualization)
  const inventoryData: InventoryItem[] = products
    .slice(0, 10)
    .map((p: { id: string; name?: string; sku?: string; quantity?: number; lowStockThreshold?: number }) => ({
      id: p.id,
      name: p.name && p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name || 'Unknown',
      sku: p.sku || 'N/A',
      quantity: p.quantity || 0,
      lowStockThreshold: p.lowStockThreshold || 5,
      maxStock: Math.max(p.quantity || 0, p.lowStockThreshold || 5, 100)
    }));

  // Process Customers
  const totalCustomers = customersRes.pagination?.total || 0;

  // Build stats
  const stats: DashboardStats = {
    totalRevenue,
    revenueChange: 0,
    totalOrders,
    ordersChange: 0,
    totalProducts,
    productsChange: 0,
    totalCustomers,
    customersChange: 0
  };

  const recentOrders: RecentOrder[] = orders.slice(0, 5).map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    customer: o.customer ? { name: `${o.customer.firstName} ${o.customer.lastName}`.trim() } : undefined,
  }));

  // Build Activity Feed from recent items
  const reviews = reviewsRes.data || [];
  const activityFeed: ActivityItem[] = [
    ...orders.slice(0, 5).map((o: { id: string; orderNumber?: string; createdAt: string; total?: string | number }) => ({
      id: `order-${o.id}`,
      type: 'order' as const,
      title: 'New Order Received',
      description: `Order #${o.orderNumber || o.id.slice(0, 8)}`,
      timestamp: o.createdAt,
      metadata: { amount: parseFloat(String(o.total)) }
    })),
    ...reviews.slice(0, 5).map((r: { id: string; title?: string; createdAt: string; rating?: number; average_rating?: number; averageRating?: number; ratings?: Array<{ score?: number; maxScore?: number; max_score?: number }> }) => {
      let reviewRating: number | undefined = r.rating;
      if (!reviewRating && typeof r.averageRating === 'number') {
        reviewRating = r.averageRating;
      }
      if (!reviewRating && typeof r.average_rating === 'number') {
        reviewRating = r.average_rating;
      }
      if (!reviewRating && r.ratings && Array.isArray(r.ratings) && r.ratings.length > 0) {
        const totalScore = r.ratings.reduce((sum, rating) => sum + (rating?.score ?? 0), 0);
        const totalMaxScore = r.ratings.reduce((sum, rating) => sum + (rating?.maxScore ?? rating?.max_score ?? 5), 0);
        reviewRating = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 5 * 10) / 10 : undefined;
      }
      return {
        id: `review-${r.id}`,
        type: 'review' as const,
        title: 'New Review',
        description: r.title || 'Product review',
        timestamp: r.createdAt,
        metadata: { rating: reviewRating }
      };
    })
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 10);

  return {
    stats,
    recentOrders,
    lowStockProducts,
    activityFeed,
    inventoryData,
    orderAnalytics,
    revenueTrend: last7Days,
    topProducts,
    satisfaction,
  };
}

/**
 * Hook for fetching dashboard data with React Query caching
 */
export function useDashboardData() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';

  return useQuery<DashboardData>({
    queryKey: queryKeys.analytics.dashboard(tenantId),
    queryFn: fetchDashboardData,
    enabled: !!tenantId,
    staleTime: CACHE_TIMES.STANDARD, // 2 minutes - dashboard can show slightly stale data
    gcTime: CACHE_TIMES.SEMI_STATIC, // 5 minutes - keep in cache for quick navigation back
    placeholderData: initialDashboardData, // Show empty state while loading
  });
}

/**
 * Hook to manually invalidate dashboard cache
 * Useful when user manually refreshes or after mutations that affect dashboard data
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';

  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.dashboard(tenantId),
    });
  };
}

/**
 * Hook to refetch dashboard data (invalidate + fetch fresh)
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';

  return () => {
    return queryClient.refetchQueries({
      queryKey: queryKeys.analytics.dashboard(tenantId),
    });
  };
}
