import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, StorefrontSettings } from '@/lib/api/types';

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

interface RouteParams {
  params: Promise<{ version: string }>;
}

/**
 * POST /api/storefront/settings/history/[version]/restore
 * Restore a specific version from history
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const { tenantId, storefrontId, userId, authorization } = getAuthHeaders(request);
    const { version } = await params;

    if (!storefrontId) {
      return NextResponse.json(
        {
          success: false,
          data: null as unknown as StorefrontSettings,
          message: 'X-Storefront-ID header is required',
        },
        { status: 400 }
      );
    }

    // Call the backend restore endpoint
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/api/v1/storefront-theme/${storefrontId}/restore/${version}`,
      {
        method: 'POST',
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
          data: null as unknown as StorefrontSettings,
          message: result.message || 'Failed to restore theme version',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Theme restored to version ${version}`,
    });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null as unknown as StorefrontSettings,
        message: error instanceof Error ? error.message : 'Failed to restore theme version',
      },
      { status: 500 }
    );
  }
}
