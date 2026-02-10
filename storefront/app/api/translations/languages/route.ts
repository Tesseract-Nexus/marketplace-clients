import { NextRequest, NextResponse } from 'next/server';

const TRANSLATION_SERVICE_URL =
  process.env.TRANSLATION_SERVICE_URL || 'http://translation-service.marketplace.svc.cluster.local:8080';

/**
 * GET /api/translations/languages - Get available languages
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');

  const url = `${TRANSLATION_SERVICE_URL}/api/v1/languages`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error fetching languages:', error);
    return NextResponse.json(
      { languages: [], error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}
