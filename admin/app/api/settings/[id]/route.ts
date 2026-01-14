import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheKeys } from '@/lib/cache/redis';

// Remove trailing slashes and ensure proper base URL
const getBaseUrl = () => {
  const url = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085';
  return url.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
};

const SETTINGS_SERVICE_BASE = getBaseUrl();

const getAuthHeaders = (request: NextRequest, tenantIdOverride?: string | null) => {
  const tenantId = tenantIdOverride || request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
  const userId = request.headers.get('x-user-id') || request.headers.get('X-User-ID');

  // Tenant ID is required for multi-tenant isolation
  if (!tenantId) {
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
  };

  // User ID is optional but included if available
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  return headers;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, message: 'Missing required X-Tenant-ID header' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const response = await fetch(`${SETTINGS_SERVICE_BASE}/api/v1/settings/${id}`, {
      method: 'GET',
      headers: authHeaders,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // Extract tenantId from context in the body
    const tenantId = body?.context?.tenantId;
    const authHeaders = getAuthHeaders(request, tenantId);
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, message: 'Missing required X-Tenant-ID header' },
        { status: 400 }
      );
    }

    const response = await fetch(`${SETTINGS_SERVICE_BASE}/api/v1/settings/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Invalidate settings cache for this tenant
    if (tenantId) {
      await cache.delPattern(`${cacheKeys.settings(tenantId)}*`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, message: 'Missing required X-Tenant-ID header' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const response = await fetch(`${SETTINGS_SERVICE_BASE}/api/v1/settings/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Invalidate settings cache for this tenant
    if (tenantId) {
      await cache.delPattern(`${cacheKeys.settings(tenantId)}*`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
