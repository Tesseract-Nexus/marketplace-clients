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
 * GET /api/loyalty/referrals/stats
 * Get referral statistics for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');
    const accessToken = authorization?.replace('Bearer ', '');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const customerId = extractCustomerId(accessToken);
    if (!customerId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/loyalty/referrals/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
          'X-Customer-ID': customerId,
        },
      }
    );

    if (!response.ok) {
      // Return default stats if service unavailable
      return NextResponse.json({
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        pointsEarned: 0,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Referral Stats API] Error:', error);
    // Return default stats on error
    return NextResponse.json({
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      pointsEarned: 0,
    });
  }
}
