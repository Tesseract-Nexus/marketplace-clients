import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// System user ID for public storefront requests
const STOREFRONT_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * POST /api/search - Search products via products-service
 * This acts as a fallback when Typesense search doesn't return results
 */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || '';
  const storefrontId = request.headers.get('X-Storefront-ID') || '';

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { query, limit = 10 } = body;
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(50, Math.max(1, Math.floor(parsedLimit)))
      : 10;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search products via products-service public storefront endpoint (no auth required)
    const url = `${config.api.productsService}/storefront/products?search=${encodeURIComponent(query)}&status=ACTIVE&limit=${safeLimit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-Vendor-ID': tenantId,
        'X-User-ID': STOREFRONT_SYSTEM_USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Search API error:', response.status, error);
      return NextResponse.json(
        {
          success: false,
          error: error.error || 'Search failed',
          data: [],
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data || [],
      total: data.pagination?.total || 0,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}
