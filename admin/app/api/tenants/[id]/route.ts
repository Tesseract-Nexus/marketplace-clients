import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

// Tenant Service URL - connects to the backend Go service
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

/**
 * GET /api/tenants/[id]
 * Get tenant deletion info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const userId = headers['x-jwt-claim-sub'];

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/${id}/deletion`,
      {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to get tenant info' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    return handleApiError(error, 'GET tenants/[id]');
  }
}

/**
 * DELETE /api/tenants/[id]
 * Delete a tenant (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const userId = headers['x-jwt-claim-sub'];

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/${id}`,
      {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Tenant Delete] Failed for tenant ${id}:`, data);
      return NextResponse.json(
        { success: false, message: data.message || data.error || 'Failed to delete tenant' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    return handleApiError(error, 'DELETE tenants/[id]');
  }
}
