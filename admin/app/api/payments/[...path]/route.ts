import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';

const PAYMENTS_SERVICE_URL = getServiceUrl('PAYMENTS');

/**
 * Catch-all route handler for payment service proxy
 * Routes all /api/payments/* requests to the payment service
 */

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const { searchParams } = new URL(request.url);
    const response = await proxyToBackend(PAYMENTS_SERVICE_URL, pathStr, {
      method: 'GET',
      params: searchParams,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `GET /payments/${pathStr}`);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(PAYMENTS_SERVICE_URL, pathStr, {
      method: 'POST',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `POST /payments/${pathStr}`);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(PAYMENTS_SERVICE_URL, pathStr, {
      method: 'PUT',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PUT /payments/${pathStr}`);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(PAYMENTS_SERVICE_URL, pathStr, {
      method: 'DELETE',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `DELETE /payments/${pathStr}`);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(PAYMENTS_SERVICE_URL, pathStr, {
      method: 'PATCH',
      body,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PATCH /payments/${pathStr}`);
  }
}
