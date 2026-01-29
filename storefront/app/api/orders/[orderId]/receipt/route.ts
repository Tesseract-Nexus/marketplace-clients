import { NextRequest, NextResponse } from 'next/server';

const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

/**
 * GET /api/orders/[orderId]/receipt
 * Get customer receipt - proxies to the storefront customer receipt endpoint
 * Requires customer JWT authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const authHeader = request.headers.get('Authorization');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required to download receipt' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Use the customer storefront receipt endpoint
    const backendUrl = `${ORDERS_SERVICE_URL}/api/v1/storefront/my/orders/${encodeURIComponent(orderId)}/receipt?format=${encodeURIComponent(format)}`;

    const response = await fetch(backendUrl, {
      headers: {
        'X-Tenant-ID': tenantId,
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Failed to get receipt' },
        { status: response.status }
      );
    }

    // For PDF, stream binary
    if (format === 'pdf') {
      const blob = await response.blob();
      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': response.headers.get('Content-Disposition') || 'inline; filename="receipt.pdf"',
        },
      });
    }

    // For HTML or JSON
    const body = await response.text();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    });
  } catch (error) {
    console.error('[BFF] Failed to get receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
