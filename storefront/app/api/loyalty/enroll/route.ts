import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

// Helper to extract customer ID from JWT
function extractCustomerId(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || payload.customer_id || payload.id || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/loyalty/enroll
 * Enroll customer in loyalty program
 */
export async function POST(request: NextRequest) {
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

    // Get optional referral code from request body
    let referralCode: string | undefined;
    try {
      const body = await request.json();
      referralCode = body.referralCode;
    } catch {
      // No body or invalid JSON - that's ok, referral code is optional
    }

    const response = await fetch(
      `${MARKETING_SERVICE_URL}/storefront/loyalty/enroll`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
          'X-Customer-ID': customerIdToUse,
        },
        body: JSON.stringify({ referralCode }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Loyalty API] Failed to enroll:', error);
      return NextResponse.json({ error: 'Failed to enroll in loyalty program' }, { status: response.status });
    }

    const data = await response.json();

    // Transform backend response to match frontend expected format
    const transformed = {
      id: data.id,
      customerId: data.customerId,
      programId: data.tenantId,
      pointsBalance: data.availablePoints ?? data.totalPoints ?? 0,
      lifetimePoints: data.lifetimePoints ?? 0,
      currentTier: data.currentTier || 'Member',
      tierProgress: 0,
      referralCode: data.referralCode || null,
      referredBy: data.referredBy || null,
      enrolledAt: data.joinedAt || data.createdAt,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    // Service unavailable
    console.error('[Loyalty API] Service unavailable:', error);
    return NextResponse.json({ error: 'Loyalty service unavailable' }, { status: 503 });
  }
}
