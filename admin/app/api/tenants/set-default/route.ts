import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '../../lib/auth-helper';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

/**
 * PUT /api/tenants/set-default
 * Set the user's default tenant
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, authToken } = await getAuthHeaders(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Call tenant service to set default
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/users/me/tenants/default`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          ...(authToken && { 'Authorization': authToken }),
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      }
    );

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Default tenant updated' });
    }

    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { success: false, error: errorData.message || 'Failed to set default tenant' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Error setting default tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set default tenant' },
      { status: 500 }
    );
  }
}
