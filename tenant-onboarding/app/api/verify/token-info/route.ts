import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';

// SECURITY: POST handler is preferred - token is sent in request body, not URL
// This prevents token exposure in browser history, referrer headers, and server logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Token is required' } },
        { status: 400 }
      );
    }

    // Forward to backend using POST with token in body
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/verify/token-info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': Math.random().toString(36).substring(2) + Date.now().toString(36),
        },
        body: JSON.stringify({ token }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Token not found or expired' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get token info error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// DEPRECATED: GET handler kept for backward compatibility during migration
// TODO: Remove after 14 days - Tokens in URLs are a security risk
export async function GET(request: NextRequest) {
  console.warn('[SECURITY] Deprecated: Token info via GET with token in URL. Use POST with token in body instead.');
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Token is required' } },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/verify/token-info?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': Math.random().toString(36).substring(2) + Date.now().toString(36),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Token not found or expired' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get token info error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
