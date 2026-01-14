import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const COUPONS_SERVICE_URL = config.api.couponsService;

/**
 * POST /api/coupons/validate
 * Validate a coupon code
 */
export async function POST(request: NextRequest) {
  console.log('[Coupons Route] POST /api/coupons/validate');

  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    console.log('[Coupons Route] Headers:', { tenantId, storefrontId });

    if (!tenantId) {
      console.log('[Coupons Route] Missing tenant ID');
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('[Coupons Route] Request body:', body);

    const backendUrl = `${COUPONS_SERVICE_URL}/coupons/validate`;
    console.log('[Coupons Route] Calling backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId || '',
      },
      body: JSON.stringify(body),
    });

    console.log('[Coupons Route] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Coupons Route] Backend error:', error);
      return NextResponse.json(
        { valid: false, message: 'Invalid coupon code' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Coupons Route] Backend success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Coupons Route] Exception:', error);
    return NextResponse.json(
      { valid: false, message: 'Coupon service unavailable' },
      { status: 503 }
    );
  }
}
