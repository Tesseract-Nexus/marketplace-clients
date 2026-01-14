import { NextRequest, NextResponse } from 'next/server';

const TRANSLATION_SERVICE_URL =
  process.env.TRANSLATION_SERVICE_URL || 'http://translation-service.devtest.svc.cluster.local:8080';

/**
 * POST /api/translations/translate - Translate text
 */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('X-Storefront-ID') || request.headers.get('x-storefront-id');

  const body = await request.json();
  const url = `${TRANSLATION_SERVICE_URL}/api/v1/translate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Translations API] Error translating:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
