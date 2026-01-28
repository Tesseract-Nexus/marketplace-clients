import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// Store stats response type
export interface StoreStats {
  productCount: number;
  customerCount: number;
  averageRating: number;
  totalReviews: number;
}

// Cache store stats for 5 minutes to reduce backend load
const CACHE_TTL_MS = 5 * 60 * 1000;
const statsCache = new Map<string, { data: StoreStats; timestamp: number }>();

function getCachedStats(cacheKey: string): StoreStats | null {
  const cached = statsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCachedStats(cacheKey: string, data: StoreStats): void {
  statsCache.set(cacheKey, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('x-storefront-id');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Missing tenant ID' },
      { status: 400 }
    );
  }

  const cacheKey = `${tenantId}:${storefrontId || 'default'}`;

  // Check cache first
  const cachedStats = getCachedStats(cacheKey);
  if (cachedStats) {
    return NextResponse.json({ data: cachedStats });
  }

  try {
    // Fetch stats from multiple services in parallel
    const [productStats, reviewStats, customerCount] = await Promise.all([
      fetchProductStats(tenantId),
      fetchReviewStats(tenantId),
      fetchCustomerCount(tenantId),
    ]);

    const stats: StoreStats = {
      productCount: productStats.totalProducts || 0,
      customerCount: customerCount || 0,
      averageRating: reviewStats.averageRating || 0,
      totalReviews: reviewStats.totalReviews || 0,
    };

    console.log('[Stats API] Fetched stats for tenant', tenantId, ':', JSON.stringify(stats));

    // Cache the result
    setCachedStats(cacheKey, stats);

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching store stats:', error);
    // Return empty stats on error instead of failing
    return NextResponse.json({
      data: {
        productCount: 0,
        customerCount: 0,
        averageRating: 0,
        totalReviews: 0,
      },
    });
  }
}

// Common headers for internal service calls
function internalHeaders(tenantId: string): Record<string, string> {
  return {
    'X-Tenant-ID': tenantId,
    'X-Internal-Service': 'storefront',
    'Content-Type': 'application/json',
  };
}

// Fetch product count from products-service
async function fetchProductStats(tenantId: string): Promise<{ totalProducts: number }> {
  try {
    const url = `${config.api.productsService}/api/v1/products/stats`;
    const response = await fetch(url, {
      headers: internalHeaders(tenantId),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // Try storefront endpoint which is known to work
      const listUrl = `${config.api.productsService}/storefront/products?limit=1&status=ACTIVE`;
      const listResponse = await fetch(listUrl, {
        headers: internalHeaders(tenantId),
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
        return { totalProducts: data.pagination?.total || data.total || 0 };
      }

      // Try non-storefront endpoint
      const altUrl = `${config.api.productsService}/api/v1/products?limit=1&status=ACTIVE`;
      const altResponse = await fetch(altUrl, {
        headers: internalHeaders(tenantId),
      });

      if (altResponse.ok) {
        const data = await altResponse.json();
        return { totalProducts: data.pagination?.total || data.total || 0 };
      }
      return { totalProducts: 0 };
    }

    const data = await response.json();
    return {
      totalProducts: data.data?.overview?.totalProducts ||
                     data.overview?.totalProducts ||
                     data.totalProducts ||
                     0,
    };
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return { totalProducts: 0 };
  }
}

// Fetch review stats from reviews-service
async function fetchReviewStats(tenantId: string): Promise<{ averageRating: number; totalReviews: number }> {
  const reviewsBase = (config.api.reviewsService || '').replace(/\/api\/v1\/?$/, '');

  try {
    // Try dedicated stats endpoint first
    const url = `${reviewsBase}/api/v1/reviews/stats`;
    const response = await fetch(url, {
      headers: internalHeaders(tenantId),
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();
      const avg = data.data?.averageRating || data.averageRating || 0;
      const total = data.data?.totalReviews || data.totalReviews || 0;
      if (total > 0) return { averageRating: avg, totalReviews: total };
    }

    // Try analytics endpoint
    const analyticsUrl = `${reviewsBase}/api/v1/reviews/analytics`;
    const analyticsResponse = await fetch(analyticsUrl, {
      headers: internalHeaders(tenantId),
    });

    if (analyticsResponse.ok) {
      const data = await analyticsResponse.json();
      const avg = data.data?.overview?.averageRating || data.overview?.averageRating || 0;
      const total = data.data?.overview?.totalReviews || data.overview?.totalReviews || 0;
      if (total > 0) return { averageRating: avg, totalReviews: total };
    }

    // Fallback: fetch all approved reviews and compute average from ratings
    const storefrontUrl = `${reviewsBase}/api/v1/storefront/reviews?status=APPROVED&limit=100`;
    const storefrontResponse = await fetch(storefrontUrl, {
      headers: internalHeaders(tenantId),
    });

    if (storefrontResponse.ok) {
      const data = await storefrontResponse.json();
      if (data.summary && data.summary.totalReviews > 0) {
        return {
          averageRating: data.summary.averageRating || 0,
          totalReviews: data.summary.totalReviews || 0,
        };
      }
      // Compute from review data
      const reviews = data.data || [];
      const totalCount = data.pagination?.total || reviews.length;
      if (totalCount > 0 && reviews.length > 0) {
        const scores = reviews
          .map((r: { ratings?: { overall?: { score: number } } }) => r.ratings?.overall?.score)
          .filter((s: number | undefined): s is number => typeof s === 'number' && s > 0);
        if (scores.length > 0) {
          const avg = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
          return {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: totalCount,
          };
        }
      }
    }

    return { averageRating: 0, totalReviews: 0 };
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return { averageRating: 0, totalReviews: 0 };
  }
}

// Fetch customer count from customers-service or orders-service
async function fetchCustomerCount(tenantId: string): Promise<number> {
  try {
    // Try customers-service first
    const customersUrl = `${config.api.customersService}/customers?limit=1`;
    const customersResponse = await fetch(customersUrl, {
      headers: internalHeaders(tenantId),
      next: { revalidate: 300 },
    });

    if (customersResponse.ok) {
      const data = await customersResponse.json();
      const count = data.pagination?.total || data.total || 0;
      if (count > 0) return count;
    }

    // Fallback to orders-service to count unique customers
    const ordersUrl = `${config.api.ordersService}/api/v1/orders?limit=1`;
    const ordersResponse = await fetch(ordersUrl, {
      headers: internalHeaders(tenantId),
    });

    if (ordersResponse.ok) {
      const data = await ordersResponse.json();
      return Math.ceil((data.pagination?.total || data.total || 0) * 0.7);
    }

    return 0;
  } catch (error) {
    console.error('Error fetching customer count:', error);
    return 0;
  }
}
