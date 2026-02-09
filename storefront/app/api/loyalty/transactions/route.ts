import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

// Helper to extract customer ID from JWT
function extractCustomerId(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || payload.customer_id || payload.id || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/loyalty/transactions
 * Get customer loyalty transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const customerId = request.headers.get('X-Customer-ID');
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    // Get customer ID from header or extract from token
    let customerIdToUse = customerId;
    if (!customerIdToUse && accessToken) {
      customerIdToUse = extractCustomerId(accessToken);
    }

    if (!customerIdToUse) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Forward query params
    const limit = request.nextUrl.searchParams.get('limit');
    const offset = request.nextUrl.searchParams.get('offset');
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/loyalty/transactions?${params}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
          'X-Customer-ID': customerIdToUse,
        },
      }
    );

    if (!response.ok) {
      console.error('[Loyalty API] Failed to get transactions: status', response.status);
      return NextResponse.json({ error: 'Failed to get transactions' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Service unavailable - return empty transactions
    console.error('[Loyalty API] Service unavailable:', error);
    return NextResponse.json({ transactions: [], total: 0 });
  }
}
