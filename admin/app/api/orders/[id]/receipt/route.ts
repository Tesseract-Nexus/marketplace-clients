import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/orders/:id/receipt
 * Get receipt for an order (generates PDF inline)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.json(
        { error: { message: 'Invalid order ID' } },
        { status: 400 }
      );
    }

    const headers = await getProxyHeaders(request) as Record<string, string>;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    const backendUrl = `${ORDERS_SERVICE_URL}/orders/${encodeURIComponent(id)}/receipt?format=${encodeURIComponent(format)}`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: { message: errorBody || 'Failed to get receipt' } },
        { status: response.status }
      );
    }

    // For PDF, stream the binary response
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

    // For HTML or JSON, pass through
    const body = await response.text();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/orders/:id/receipt
 * Generate and store a receipt for an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.json(
        { error: { message: 'Invalid order ID' } },
        { status: 400 }
      );
    }

    const headers = await getProxyHeaders(request) as Record<string, string>;

    // Parse optional body (format, template, locale, sendEmail)
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine - defaults will be used
    }

    const backendUrl = `${ORDERS_SERVICE_URL}/orders/${encodeURIComponent(id)}/receipt/generate`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: id,
        format: body.format || 'pdf',
        template: body.template || 'default',
        documentType: body.documentType || 'RECEIPT',
        sendEmail: body.sendEmail || false,
        locale: body.locale || '',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: { message: errorBody || 'Failed to generate receipt' } },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
