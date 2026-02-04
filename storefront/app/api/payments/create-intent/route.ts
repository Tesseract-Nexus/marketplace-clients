import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Remove /api/v1 suffix if present (env var may include it)
const PAYMENT_SERVICE_URL = (process.env.PAYMENT_SERVICE_URL || 'http://localhost:3107').replace(/\/api\/v1\/?$/, '');

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

    const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
      body: JSON.stringify({
        ...body,
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
