import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * GET /api/categories/import/template
 * Download a template file for category import
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'] || '';

    const response = await fetch(
      `${CATEGORIES_SERVICE_URL}/categories/import/template?format=${format}`,
      {
        headers: {
          'X-Vendor-ID': tenantId,
          'x-jwt-claim-tenant-id': tenantId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: { message: error } },
        { status: response.status }
      );
    }

    if (format === 'csv' || format === 'xlsx') {
      const blob = await response.blob();
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
      responseHeaders.set('Content-Disposition', response.headers.get('Content-Disposition') || `attachment; filename=categories_import_template.${format}`);

      return new NextResponse(blob, {
        status: 200,
        headers: responseHeaders,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch template' } },
      { status: 500 }
    );
  }
}
