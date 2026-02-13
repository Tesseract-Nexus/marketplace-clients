import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const COUPONS_SERVICE_URL = config.api.couponsService;

/**
 * POST /api/coupons/validate
 * Validate a coupon code
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const body = await request.json();

    const backendUrl = `${COUPONS_SERVICE_URL}/coupons/validate`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Coupons Route] Backend error:', error);
      return NextResponse.json(
        { valid: false, message: 'Invalid coupon code' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Coupons Route] Exception:', error);
    return NextResponse.json(
      { valid: false, message: 'Coupon service unavailable' },
      { status: 503 }
    );
  }
}
