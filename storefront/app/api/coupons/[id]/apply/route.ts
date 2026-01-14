import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const COUPONS_SERVICE_URL = config.api.couponsService;

/**
 * POST /api/coupons/[id]/apply
 * Apply a coupon to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: couponId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(
      `${COUPONS_SERVICE_URL}/coupons/${couponId}/apply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Coupons API] Apply failed:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to apply coupon' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Coupons API] Service unavailable:', error);
    return NextResponse.json(
      { success: false, message: 'Coupon service unavailable' },
      { status: 503 }
    );
  }
}
