import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

/**
 * PUT /api/tenants/set-default
 * Set the user's default tenant
 */
export async function PUT(request: NextRequest) {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const userId = headers['x-jwt-claim-sub'];

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
          ...headers,
          'Content-Type': 'application/json',
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
    return handleApiError(error, 'PUT tenants/set-default');
  }
}
