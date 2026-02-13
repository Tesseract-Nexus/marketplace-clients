import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

/**
 * GET /api/products
 * List products with pagination and filtering
 *
 * PERFORMANCE: Uses Redis caching with 60-second TTL for product lists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }

    // Build cache key from query params
    const paramsString = searchParams.toString();
    const cacheKey = cacheKeys.products(tenantId, paramsString);

    // PERFORMANCE: Check Redis cache first
    const cachedData = await cache.get<{
      data: unknown[];
      pagination: Record<string, unknown>;
    }>(cacheKey);

    if (cachedData) {
      // Cache hit - return immediately
      const nextResponse = NextResponse.json({
        success: true,
        data: cachedData.data,
        pagination: cachedData.pagination,
        cached: true,
      });
      nextResponse.headers.set('X-Cache', 'HIT');
      nextResponse.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
      return nextResponse;
    }

    // Cache miss - fetch from backend
    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, 'products', {
      method: 'GET',
      params: searchParams,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Normalize response
    const products = data.products || data.data || [];
    const pagination = data.pagination || {};

    // PERFORMANCE: Cache the result in Redis (60 seconds for products)
    await cache.set(cacheKey, {
      data: products,
      pagination,
    }, cacheTTL.products);

    const nextResponse = NextResponse.json({
      success: true,
      data: products,
      pagination,
      cached: false,
    });

    nextResponse.headers.set('X-Cache', 'MISS');
    nextResponse.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    nextResponse.headers.set('Vary', 'Accept-Encoding, x-jwt-claim-tenant-id');

    return nextResponse;
  } catch (error) {
    return handleApiError(error, 'GET products');
  }
}

/**
 * POST /api/products
 * Create a new product
 *
 * PERFORMANCE: Invalidates products cache on creation
 */
export async function POST(request: NextRequest) {
  try {
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, 'products', {
      method: 'POST',
      body,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate products cache for this tenant on successful creation
    if (response.ok) {
      await cache.delPattern(`products:${tenantId}:*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST products');
  }
}
