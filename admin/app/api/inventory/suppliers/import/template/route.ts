import { NextRequest, NextResponse } from 'next/server';

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8084';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const tenantId = request.headers.get('X-Vendor-ID') || request.headers.get('x-vendor-id');

    const response = await fetch(
      `${INVENTORY_SERVICE_URL}/suppliers/import/template?format=${format}`,
      {
        headers: {
          'X-Vendor-ID': tenantId || '',
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
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
      headers.set('Content-Disposition', response.headers.get('Content-Disposition') || `attachment; filename=suppliers_import_template.${format}`);

      return new NextResponse(blob, {
        status: 200,
        headers,
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
