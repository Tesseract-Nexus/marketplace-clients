import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

/**
 * GET /api/products/[id]/promotions
 * Get active promotions for a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/products/${productId}/promotions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    if (!response.ok) {
      // Return empty promotions if service unavailable
      return NextResponse.json({ promotions: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Product Promotions API] Error:', error);
    // Return empty promotions on error (component has fallback)
    return NextResponse.json({ promotions: [] });
  }
}
