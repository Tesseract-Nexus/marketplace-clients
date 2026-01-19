import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

// SECURITY: POST handler is preferred - token is sent in request body, not URL
// This prevents token exposure in browser history, referrer headers, and server logs
// NOTE: Staff-service only supports GET for this endpoint, so we extract token from body
// and forward as a GET request with query parameter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Forward as GET request to staff-service (which only supports GET for this endpoint)
    return proxyGet(STAFF_SERVICE_URL, `auth/invitation/verify?token=${encodeURIComponent(token)}`, request);
  } catch (error) {
    console.error('[Invitation Verify] Error processing request:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}

// DEPRECATED: GET handler kept for backward compatibility
// Tokens in URLs are a security risk - they leak via history/referrer/logs
export async function GET(request: NextRequest) {
  console.warn('[SECURITY] Deprecated: Invitation verification via GET with token in URL. Use POST with token in body instead.');
  const token = request.nextUrl.searchParams.get('token');
  return proxyGet(STAFF_SERVICE_URL, `auth/invitation/verify?token=${encodeURIComponent(token || '')}`, request);
}
