import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

/**
 * Get customer ID from headers, JWT, or session cookie.
 */
async function resolveCustomerId(request: NextRequest): Promise<string | null> {
  // 1. Explicit header (sent by client with customer.id from auth store)
  const headerCustomerId = request.headers.get('X-Customer-ID');
  if (headerCustomerId) return headerCustomerId;

  // 2. Extract from JWT Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader !== 'Bearer ' && authHeader !== 'Bearer') {
    try {
      const parts = authHeader.replace('Bearer ', '').split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.sub) return payload.sub;
      }
    } catch { /* ignore */ }
  }

  // 3. Fall back to session-based auth (OAuth flow)
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) return null;

    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      headers: {
        'Cookie': cookie,
        'X-Forwarded-Host': forwardedHost,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const tokenData = await response.json();
      if (tokenData.user_id) return tokenData.user_id;
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * POST /api/loyalty/enroll
 * Enroll customer in loyalty program
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const customerIdToUse = await resolveCustomerId(request);
    if (!customerIdToUse) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get optional fields from request body
    let referralCode: string | undefined;
    let dateOfBirth: string | undefined;
    try {
      const body = await request.json();
      referralCode = body.referralCode;
      dateOfBirth = body.dateOfBirth;
    } catch {
      // No body or invalid JSON - that's ok, fields are optional
    }

    const requestBody: Record<string, string> = {};
    if (referralCode) requestBody.referralCode = referralCode;
    if (dateOfBirth) requestBody.dateOfBirth = dateOfBirth;

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
        body: JSON.stringify(requestBody),
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
