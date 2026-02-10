import { NextRequest, NextResponse } from 'next/server';

const TRANSLATION_SERVICE_URL =
  process.env.TRANSLATION_SERVICE_URL || 'http://translation-service.marketplace.svc.cluster.local:8080';

/**
 * GET /api/translations/user-preference - Get user's language preference
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');
  const authorization = request.headers.get('Authorization');

  const url = `${TRANSLATION_SERVICE_URL}/api/v1/user-preference`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(authorization && { Authorization: authorization }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error getting user preference:', error);
    return NextResponse.json(
      { error: 'Failed to get user preference' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/translations/user-preference - Update user's language preference
 */
export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');
  const authorization = request.headers.get('Authorization');

  const body = await request.json();
  const url = `${TRANSLATION_SERVICE_URL}/api/v1/user-preference`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(authorization && { Authorization: authorization }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error updating user preference:', error);
    return NextResponse.json(
      { error: 'Failed to update user preference' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/translations/user-preference - Reset user's language preference
 */
export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');
  const authorization = request.headers.get('Authorization');

  const url = `${TRANSLATION_SERVICE_URL}/api/v1/user-preference`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(authorization && { Authorization: authorization }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error resetting user preference:', error);
    return NextResponse.json(
      { error: 'Failed to reset user preference' },
      { status: 500 }
    );
  }
}
