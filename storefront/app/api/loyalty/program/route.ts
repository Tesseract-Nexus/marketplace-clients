import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

/**
 * GET /api/loyalty/program
 * Get loyalty program configuration
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/loyalty/program`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(null, { status: 404 });
      }
      const error = await response.text();
      console.error('[Loyalty API] Failed to get program:', error);
      return NextResponse.json({ error: 'Failed to get loyalty program' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Service unavailable - return null gracefully (no loyalty program configured)
    console.error('[Loyalty API] Service unavailable:', error);
    return NextResponse.json(null, { status: 404 });
  }
}
