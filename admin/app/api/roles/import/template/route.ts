import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const headers = await getProxyHeaders(request) as Record<string, string>;

    const response = await fetch(
      `${STAFF_SERVICE_URL}/roles/import/template?format=${format}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: { message: error } },
        { status: response.status }
      );
    }

    // For file downloads, pass through the response
    if (format === 'csv' || format === 'xlsx') {
      const blob = await response.blob();
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
      responseHeaders.set('Content-Disposition', response.headers.get('Content-Disposition') || `attachment; filename=role_import_template.${format}`);

      return new NextResponse(blob, {
        status: 200,
        headers: responseHeaders,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'GET roles/import/template');
  }
}
