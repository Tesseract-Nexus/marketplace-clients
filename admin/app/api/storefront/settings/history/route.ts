import { NextRequest, NextResponse } from 'next/server';
import { ThemeHistoryListResponse } from '@/lib/api/types';

// Settings Service URL - connects to the backend Go service
const SETTINGS_SERVICE_URL = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085';

// Get auth headers from incoming request
const getAuthHeaders = (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('x-storefront-id');
  const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  return { tenantId, storefrontId, userId, authorization };
};

/**
 * GET /api/storefront/settings/history
 * Get version history for the storefront theme settings
 */
export async function GET(request: NextRequest): Promise<NextResponse<ThemeHistoryListResponse>> {
  try {
    const { tenantId, storefrontId, userId, authorization } = getAuthHeaders(request);

    if (!storefrontId) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          total: 0,
          message: 'X-Storefront-ID header is required',
        },
        { status: 400 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    // Call the backend history endpoint
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/api/v1/storefront-theme/${storefrontId}/history?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'X-Tenant-ID': tenantId }),
          ...(userId && { 'X-User-ID': userId }),
          ...(authorization && { 'Authorization': authorization }),
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          total: 0,
          message: result.message || 'Failed to fetch theme history',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
      total: result.total || (result.data?.length || 0),
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch theme history',
      },
      { status: 500 }
    );
  }
}
