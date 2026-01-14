import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');
const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');
const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');
const REVIEWS_SERVICE_URL = getServiceUrl('REVIEWS');

interface DashboardData {
  orders: { data: unknown[]; pagination: { total: number } };
  products: { data: unknown[]; pagination: { total: number } };
  customers: { pagination: { total: number } };
  reviews: { data: unknown[]; pagination: { total: number } };
  analytics: unknown | null;
}

/**
 * GET /api/dashboard
 *
 * PERFORMANCE OPTIMIZED: Single endpoint that fetches all dashboard data in parallel
 * - Reduces waterfall by combining 5 API calls into 1
 * - Uses Redis caching with 60-second TTL
 * - Returns pre-aggregated data for immediate rendering
 *
 * Expected improvement: 500ms-1.5s faster dashboard load
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID') || 'default';
    const headers = getProxyHeaders(request);

    // Check cache first
    const cacheKey = cacheKeys.dashboard(tenantId);
    const cachedData = await cache.get<DashboardData>(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      }, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      });
    }

    // Fetch all data in parallel with reduced limits
    const [ordersRes, productsRes, customersRes, reviewsRes, analyticsRes] = await Promise.allSettled([
      // Orders - only need recent 10 for display
      fetch(`${ORDERS_SERVICE_URL}/orders?limit=10`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()),

      // Products - only need 15 for inventory chart
      fetch(`${PRODUCTS_SERVICE_URL}/products?limit=15`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()),

      // Customers - just need count
      fetch(`${CUSTOMERS_SERVICE_URL}/customers?limit=1`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()),

      // Reviews - only need recent 10
      fetch(`${REVIEWS_SERVICE_URL}/reviews?limit=10`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()),

      // Analytics - optional, don't fail if unavailable
      fetch(`${ORDERS_SERVICE_URL}/analytics/overview`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()).catch(() => null),
    ]);

    // Extract results with fallbacks
    const dashboardData: DashboardData = {
      orders: ordersRes.status === 'fulfilled'
        ? { data: ordersRes.value.orders || ordersRes.value.data || [], pagination: ordersRes.value.pagination || { total: 0 } }
        : { data: [], pagination: { total: 0 } },
      products: productsRes.status === 'fulfilled'
        ? { data: productsRes.value.products || productsRes.value.data || [], pagination: productsRes.value.pagination || { total: 0 } }
        : { data: [], pagination: { total: 0 } },
      customers: customersRes.status === 'fulfilled'
        ? { pagination: customersRes.value.pagination || { total: 0 } }
        : { pagination: { total: 0 } },
      reviews: reviewsRes.status === 'fulfilled'
        ? { data: reviewsRes.value.reviews || reviewsRes.value.data || [], pagination: reviewsRes.value.pagination || { total: 0 } }
        : { data: [], pagination: { total: 0 } },
      analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
    };

    // Cache for 60 seconds
    await cache.set(cacheKey, dashboardData, cacheTTL.dashboard);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      cached: false,
    }, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'Vary': 'Accept-Encoding, X-Tenant-ID',
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET dashboard');
  }
}
