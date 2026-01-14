import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '../../lib/auth-helper';

// Tenant Service URL - connects to the backend Go service
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

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
    const { userId, authToken } = await getAuthHeaders(request);

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
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          ...(authToken && { 'Authorization': authToken }),
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
    console.error('Error getting tenant deletion info:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get tenant info' },
      { status: 500 }
    );
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
    const { userId, authToken } = await getAuthHeaders(request);

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
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          ...(authToken && { 'Authorization': authToken }),
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
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
