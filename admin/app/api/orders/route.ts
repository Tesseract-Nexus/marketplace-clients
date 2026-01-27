import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { parseRequestBody } from '@/lib/security/order-validation';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * Transform backend order format to frontend expected format
 * Backend returns nested objects (payment.status, shipping.method)
 * Frontend expects flat fields (paymentStatus, fulfillmentStatus)
 */
function transformOrder(order: Record<string, unknown>): Record<string, unknown> {
  const payment = order.payment as Record<string, unknown> | undefined;
  const shipping = order.shipping as Record<string, unknown> | undefined;
  const customer = order.customer as Record<string, unknown> | undefined;

  // Build shipping address from shipping object (backend format uses 'street' instead of 'addressLine1')
  let shippingAddress = order.shippingAddress as Record<string, unknown> | undefined;
  if (!shippingAddress && shipping) {
    shippingAddress = {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      addressLine1: shipping.street || '',
      addressLine2: '',
      city: shipping.city || '',
      state: shipping.state || '',
      postalCode: shipping.postalCode || '',
      country: shipping.country || '',
      phone: customer?.phone || '',
    };
  }

  return {
    ...order,
    // Map nested payment.status to paymentStatus
    paymentStatus: order.paymentStatus || payment?.status || 'PENDING',
    // Map fulfillment status - check shipping status or default
    fulfillmentStatus:
      order.fulfillmentStatus ||
      (shipping?.trackingNumber
        ? 'SHIPPED'
        : shipping?.actualDelivery
          ? 'DELIVERED'
          : 'UNFULFILLED'),
    // Map customer info to flat fields
    customerName:
      order.customerName ||
      (customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : ''),
    customerEmail: order.customerEmail || customer?.email || '',
    // Map customer phone
    customerPhone: customer?.phone || '',
    // Map shipping address for frontend display
    shippingAddress,
    // Map payment method
    paymentMethod: order.paymentMethod || payment?.method || '',
    // Map shipping method
    shippingMethod: order.shippingMethod || shipping?.method || '',
    // Map tracking number
    trackingNumber: order.trackingNumber || shipping?.trackingNumber || '',
    // Ensure currencyCode exists - map from backend 'currency' field
    currencyCode: order.currencyCode || order.currency || 'INR',
    // Map amounts - ensure they're strings for consistency
    subtotal: String(order.subtotal || '0'),
    tax: String(order.taxAmount || order.tax || '0'),
    shippingCost: String(order.shippingCost || shipping?.cost || '0'),
    discount: String(order.discountAmount || order.discount || '0'),
    total: String(order.total || '0'),
    // Map order date
    orderDate: order.orderDate || order.createdAt,
  };
}

/**
 * GET /api/orders
 * List orders with pagination and filtering
 * Auth is handled by backend orders-service via Istio JWT validation
 *
 * PERFORMANCE: Uses Redis caching with 30-second TTL for order lists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'] || 'default';

    console.log('[Orders API] GET request - tenant_id:', tenantId);
    console.log('[Orders API] Headers:', JSON.stringify(headers, null, 2));

    // Build cache key from query params
    const paramsString = searchParams.toString();
    const cacheKey = cacheKeys.orders(tenantId, paramsString);

    // PERFORMANCE: Check Redis cache first
    const cachedData = await cache.get<{
      data: Record<string, unknown>[];
      pagination: Record<string, unknown>;
    }>(cacheKey);

    if (cachedData) {
      // Cache hit - return immediately with cache indicator
      const nextResponse = NextResponse.json({
        success: true,
        data: cachedData.data,
        pagination: cachedData.pagination,
        cached: true,
      });
      nextResponse.headers.set('X-Cache', 'HIT');
      nextResponse.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
      return nextResponse;
    }

    // Cache miss - fetch from backend
    console.log('[Orders API] Cache MISS, fetching from backend...');
    console.log('[Orders API] Service URL:', ORDERS_SERVICE_URL);

    const response = await proxyToBackend(ORDERS_SERVICE_URL, 'orders', {
      method: 'GET',
      params: searchParams,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    console.log('[Orders API] Backend response status:', response.status);
    console.log('[Orders API] Backend response data preview:', JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      console.log('[Orders API] Backend returned error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Normalize response: backend returns { orders: [...] }
    // but frontend expects { data: [...] } for ApiListResponse
    const orders = (data.orders || data.data || []) as Record<string, unknown>[];
    console.log('[Orders API] Orders count:', orders.length);
    const transformedOrders = orders.map(transformOrder);

    // PERFORMANCE: Cache the result in Redis (30 seconds for orders)
    await cache.set(cacheKey, {
      data: transformedOrders,
      pagination: data.pagination,
    }, cacheTTL.orders);

    // Create response with cache headers for faster subsequent loads
    const nextResponse = NextResponse.json({
      success: true,
      data: transformedOrders,
      pagination: data.pagination,
      cached: false,
    });

    // Orders are dynamic data - short cache with stale-while-revalidate
    nextResponse.headers.set('X-Cache', 'MISS');
    nextResponse.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    nextResponse.headers.set('Vary', 'Accept-Encoding, x-jwt-claim-tenant-id');

    return nextResponse;
  } catch (error) {
    return handleApiError(error, 'GET orders');
  }
}

/**
 * POST /api/orders
 * Create a new order
 * Auth is handled by backend orders-service via Istio JWT validation
 *
 * PERFORMANCE: Invalidates orders cache on creation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: bodyResult.error,
          },
        },
        { status: 400 }
      );
    }

    const response = await proxyToBackend(ORDERS_SERVICE_URL, 'orders', {
      method: 'POST',
      body: bodyResult.data,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate orders cache for this tenant on successful creation
    if (response.ok) {
      const postHeaders = await getProxyHeaders(request) as Record<string, string>;
      const tenantId = postHeaders['x-jwt-claim-tenant-id'] || 'default';
      await cache.delPattern(`orders:${tenantId}:*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST orders');
  }
}
