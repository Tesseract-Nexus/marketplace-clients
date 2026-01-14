import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

// Remove trailing slashes and ensure proper base URL
const getBaseUrl = () => {
  const url = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085';
  // Remove trailing slash and /api/v1 suffix if present (we'll add it ourselves)
  return url.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
};

const SETTINGS_SERVICE_BASE = getBaseUrl();

// Get auth headers from incoming request - NO fallbacks, tenant must come from request
const getAuthHeaders = (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  return headers;
};

// Validate that tenant ID is present
const validateTenantId = (request: NextRequest): string | null => {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return null;
  }
  return tenantId;
};

export async function GET(request: NextRequest) {
  try {
    const tenantId = validateTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'X-Tenant-ID header is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Build cache key from tenant ID and query params
    const cacheKey = `${cacheKeys.settings(tenantId)}:list${queryString ? `:${queryString}` : ''}`;

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const url = `${SETTINGS_SERVICE_BASE}/api/v1/settings${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(request),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Cache the successful response
    await cache.set(cacheKey, data, cacheTTL.settings);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = validateTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'X-Tenant-ID header is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${SETTINGS_SERVICE_BASE}/api/v1/settings`, {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Invalidate settings cache for this tenant after creating new settings
    await cache.delPattern(`${cacheKeys.settings(tenantId)}*`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create settings' },
      { status: 500 }
    );
  }
}
