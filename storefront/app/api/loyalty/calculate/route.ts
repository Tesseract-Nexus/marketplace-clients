import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

/**
 * GET /api/loyalty/calculate
 * Calculate points value
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const points = request.nextUrl.searchParams.get('points');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    if (!points) {
      return NextResponse.json({ error: 'Missing points parameter' }, { status: 400 });
    }

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/loyalty/calculate?points=${points}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    if (!response.ok) {
      // Return default calculation if endpoint not available
      const pointsNum = parseInt(points, 10);
      return NextResponse.json({ dollarValue: pointsNum / 100 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Service unavailable - return default calculation
    console.error('[Loyalty API] Service unavailable:', error);
    const pointsNum = parseInt(request.nextUrl.searchParams.get('points') || '0', 10);
    return NextResponse.json({ dollarValue: pointsNum / 100 });
  }
}
