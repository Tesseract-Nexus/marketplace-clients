import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl, getAuthHeaders } from '@/lib/config/api';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const tenantId = request.headers.get('X-Tenant-ID') ||
                     request.headers.get('x-tenant-id') ||
                     request.headers.get('X-Vendor-ID') ||
                     request.headers.get('x-vendor-id');

    const authHeaders = getAuthHeaders();

    const response = await fetch(
      `${STAFF_SERVICE_URL}/departments/import/template?format=${format}`,
      {
        headers: {
          'X-Vendor-ID': tenantId || '',
          'X-Tenant-ID': tenantId || authHeaders['X-Tenant-ID'] || '',
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

    // For file downloads, pass through the response
    if (format === 'csv' || format === 'xlsx') {
      const blob = await response.blob();
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
      headers.set('Content-Disposition', response.headers.get('Content-Disposition') || `attachment; filename=department_import_template.${format}`);

      return new NextResponse(blob, {
        status: 200,
        headers,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching department import template:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch template' } },
      { status: 500 }
    );
  }
}
