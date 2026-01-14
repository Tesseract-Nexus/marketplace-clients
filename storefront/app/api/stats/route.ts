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

// Fetch product count from products-service
async function fetchProductStats(tenantId: string): Promise<{ totalProducts: number }> {
  try {
    const url = `${config.api.productsService}/api/v1/products/stats`;
    const response = await fetch(url, {
      headers: {
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // Try getting count from list endpoint
      const listUrl = `${config.api.productsService}/api/v1/products?limit=1&status=ACTIVE`;
      const listResponse = await fetch(listUrl, {
        headers: {
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json',
        },
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
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
  try {
    const url = `${config.api.reviewsService}/api/v1/reviews/stats`;
    const response = await fetch(url, {
      headers: {
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // Try analytics endpoint
      const analyticsUrl = `${config.api.reviewsService}/api/v1/reviews/analytics`;
      const analyticsResponse = await fetch(analyticsUrl, {
        headers: {
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json',
        },
      });

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json();
        return {
          averageRating: data.data?.overview?.averageRating || data.overview?.averageRating || 0,
          totalReviews: data.data?.overview?.totalReviews || data.overview?.totalReviews || 0,
        };
      }
      return { averageRating: 0, totalReviews: 0 };
    }

    const data = await response.json();
    return {
      averageRating: data.data?.averageRating || data.averageRating || 0,
      totalReviews: data.data?.totalReviews || data.totalReviews || 0,
    };
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
      headers: {
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (customersResponse.ok) {
      const data = await customersResponse.json();
      return data.pagination?.total || data.total || 0;
    }

    // Fallback to orders-service to count unique customers
    const ordersUrl = `${config.api.ordersService}/api/v1/orders?limit=1`;
    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
    });

    if (ordersResponse.ok) {
      const data = await ordersResponse.json();
      // Note: This is a rough estimate based on orders, not distinct customers
      return Math.ceil((data.pagination?.total || data.total || 0) * 0.7);
    }

    return 0;
  } catch (error) {
    console.error('Error fetching customer count:', error);
    return 0;
  }
}
