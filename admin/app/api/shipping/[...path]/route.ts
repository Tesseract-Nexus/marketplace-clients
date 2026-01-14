import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';

const SHIPPING_SERVICE_URL = getServiceUrl('SHIPPING');

/**
 * Catch-all route handler for shipping service proxy
 * Routes all /api/shipping/* requests to the shipping service
 */

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const { searchParams } = new URL(request.url);
    const response = await proxyToBackend(SHIPPING_SERVICE_URL, pathStr, {
      method: 'GET',
      params: searchParams,
      incomingRequest: request,
    });

    // Check if this is a label request (returns PDF)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      const pdfData = await response.arrayBuffer();
      return new NextResponse(pdfData, {
        status: response.status,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': response.headers.get('content-disposition') || 'inline; filename=label.pdf',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `GET /shipping/${pathStr}`);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(SHIPPING_SERVICE_URL, pathStr, {
      method: 'POST',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `POST /shipping/${pathStr}`);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(SHIPPING_SERVICE_URL, pathStr, {
      method: 'PUT',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PUT /shipping/${pathStr}`);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(SHIPPING_SERVICE_URL, pathStr, {
      method: 'DELETE',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `DELETE /shipping/${pathStr}`);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(SHIPPING_SERVICE_URL, pathStr, {
      method: 'PATCH',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PATCH /shipping/${pathStr}`);
  }
}
