import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

/**
 * GET /api/offers
 * Get personalized offers for storefront
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    // Forward query params
    const limit = request.nextUrl.searchParams.get('limit');
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId || '',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/offers?${params}`,
      { headers }
    );

    if (!response.ok) {
      // Return empty offers if endpoint not available
      return NextResponse.json({ offers: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Service unavailable - return empty offers
    console.error('[Offers API] Service unavailable:', error);
    return NextResponse.json({ offers: [] });
  }
}
