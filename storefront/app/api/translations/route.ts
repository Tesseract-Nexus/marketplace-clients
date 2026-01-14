import { NextRequest, NextResponse } from 'next/server';

// Translation service URL - uses Kubernetes internal DNS in production
// Falls back to localhost for local development
const TRANSLATION_SERVICE_URL =
  process.env.TRANSLATION_SERVICE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://translation-service.devtest.svc.cluster.local:8080'
    : 'http://localhost:8080');

/**
 * GET /api/translations - Get available languages or user preference
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Missing tenant ID' },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || 'languages';
  const url = `${TRANSLATION_SERVICE_URL}/api/v1/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to translation service' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/translations - Translate text or batch translate
 */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Missing tenant ID' },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || 'translate';
  const body = await request.json();
  const url = `${TRANSLATION_SERVICE_URL}/api/v1/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Translation failed' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/translations - Update user language preference
 */
export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');
  const authorization = request.headers.get('Authorization');

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Missing tenant ID' },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || 'user-preference';
  const body = await request.json();
  const url = `${TRANSLATION_SERVICE_URL}/api/v1/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(authorization && { Authorization: authorization }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preference' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/translations - Reset user preference
 */
export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');
  const authorization = request.headers.get('Authorization');

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Missing tenant ID' },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || 'user-preference';
  const url = `${TRANSLATION_SERVICE_URL}/api/v1/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(authorization && { Authorization: authorization }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset preference' },
      { status: 500 }
    );
  }
}
