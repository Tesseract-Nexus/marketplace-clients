import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

/**
 * GET /api/promotions
 * Get active promotions
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    // Forward query params
    const position = request.nextUrl.searchParams.get('position');
    const page = request.nextUrl.searchParams.get('page');
    const params = new URLSearchParams();
    if (position) params.set('position', position);
    if (page) params.set('page', page);

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/promotions?${params}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      // Return empty array if endpoint not available
      return NextResponse.json({ promotions: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Service unavailable - return empty promotions
    console.error('[Promotions API] Service unavailable:', error);
    return NextResponse.json({ promotions: [] });
  }
}
