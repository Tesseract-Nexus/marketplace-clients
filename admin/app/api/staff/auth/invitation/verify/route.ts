import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

/**
 * Verify staff invitation token
 *
 * This is a PUBLIC endpoint - users access it before login (no JWT).
 * Staff-service handles this without requiring tenant context because
 * the invitation token itself contains the tenant association.
 */

// SECURITY: POST handler is preferred - token is sent in request body, not URL
// This prevents token exposure in browser history, referrer headers, and server logs
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

    // Forward to staff-service (no tenant header needed - token contains tenant association)
    const url = `${STAFF_SERVICE_URL}/auth/invitation/verify?token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
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

  if (!token) {
    return NextResponse.json(
      { valid: false, message: 'Token is required' },
      { status: 400 }
    );
  }

  const url = `${STAFF_SERVICE_URL}/auth/invitation/verify?token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Invitation Verify] Error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}
