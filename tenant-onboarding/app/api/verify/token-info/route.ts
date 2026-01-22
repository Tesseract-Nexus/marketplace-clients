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

// REMOVED: GET handler was deprecated due to security risk (tokens in URLs)
// All clients should use the POST endpoint with token in request body
