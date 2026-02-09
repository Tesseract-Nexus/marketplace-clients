import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Remove /api/v1 suffix if present (env var may include it)
const PAYMENT_SERVICE_URL = (process.env.PAYMENT_SERVICE_URL || 'http://localhost:3107').replace(/\/api\/v1\/?$/, '');
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// POST /api/payments/create-intent - Create payment intent
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Transform gateway type to uppercase (payment service expects STRIPE, RAZORPAY, etc.)
    const gatewayType = body.gatewayType?.toUpperCase() || body.gatewayType;

    logger.debug('[BFF] Creating payment intent for tenant:', tenantId);
    logger.debug('[BFF] Payment gateway:', gatewayType);
    logger.debug('[BFF] Order ID:', body.orderId);

    // SECURITY: Fetch the order from orders-service to get the server-calculated total.
    // The client-provided amount is intentionally ignored to prevent price manipulation.
    if (!body.orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let serverAmount: number;
    try {
      const orderResponse = await fetch(`${ORDERS_SERVICE_URL}/api/v1/orders/${body.orderId}`, {
        headers: {
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        },
      });

      if (!orderResponse.ok) {
        logger.error('[BFF] Failed to fetch order for payment amount verification:', orderResponse.status);
        return NextResponse.json({ error: 'Failed to verify order total' }, { status: 400 });
      }

      const orderData = await orderResponse.json();
      serverAmount = orderData.total;
      logger.info('[BFF] Using server-calculated order total:', serverAmount);

      if (body.amount && Math.abs(body.amount - serverAmount) > 0.01) {
        logger.warn('[BFF] Client amount mismatch — client:', body.amount, 'server:', serverAmount);
      }
    } catch (fetchErr) {
      logger.error('[BFF] Failed to fetch order:', fetchErr);
      return NextResponse.json({ error: 'Failed to verify order total' }, { status: 500 });
    }

    const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
      body: JSON.stringify({
        ...body,
        amount: serverAmount,
        gatewayType,
      }),
    });

    logger.debug('[BFF] Payment service response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[BFF] Payment service error:', errorText);
      let error = {};
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      return NextResponse.json(
        { error: (error as { error?: string; message?: string }).error || (error as { message?: string }).message || 'Failed to create payment intent' },
        { status: response.status }
      );
    }

    const data = await response.json();
    logger.info('[BFF] Payment intent created:', data.paymentIntentId);
    return NextResponse.json(data);
  } catch (error) {
    logger.error('[BFF] Failed to create payment intent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
