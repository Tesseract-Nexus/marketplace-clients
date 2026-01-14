import { NextRequest, NextResponse } from 'next/server';

// Remove /api/v1 suffix if present (env var may include it)
const PAYMENT_SERVICE_URL = (process.env.PAYMENT_SERVICE_URL || 'http://localhost:3107').replace(/\/api\/v1\/?$/, '');

// POST /api/payments/confirm - Confirm payment
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

    console.log('[BFF] Confirming payment for tenant:', tenantId);
    console.log('[BFF] Payment intent ID:', body.paymentIntentId);

    const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
      body: JSON.stringify(body),
    });

    console.log('[BFF] Payment confirm response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF] Payment confirm error:', errorText);
      let error = {};
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      return NextResponse.json(
        { error: (error as { error?: string; message?: string }).error || (error as { message?: string }).message || 'Failed to confirm payment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[BFF] Payment confirmed:', data.paymentId, 'status:', data.status);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] Failed to confirm payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
