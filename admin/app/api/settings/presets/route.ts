import { NextRequest, NextResponse } from 'next/server';

// Remove trailing slashes and ensure proper base URL
const getBaseUrl = () => {
  const url = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085';
  return url.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
};

const SETTINGS_SERVICE_BASE = getBaseUrl();

const getAuthHeaders = (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
  const userId = request.headers.get('x-user-id') || request.headers.get('X-User-ID');

  if (!tenantId || !userId) {
    return null; // Missing required auth headers
  }

  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-User-ID': userId,
  };
};

export async function GET(request: NextRequest) {
  try {
    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, message: 'Missing required authentication headers (X-Tenant-ID, X-User-ID)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${SETTINGS_SERVICE_BASE}/api/v1/presets${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}
