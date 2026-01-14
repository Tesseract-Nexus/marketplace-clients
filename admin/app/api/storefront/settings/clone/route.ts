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

interface CloneRequest {
  sourceStorefrontId: string;
}

/**
 * POST /api/storefront/settings/clone
 * Clone theme settings from another storefront
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const { tenantId, storefrontId, userId, authorization } = getAuthHeaders(request);

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

    const body = await request.json() as CloneRequest;

    if (!body.sourceStorefrontId) {
      return NextResponse.json(
        {
          success: false,
          data: null as unknown as StorefrontSettings,
          message: 'sourceStorefrontId is required',
        },
        { status: 400 }
      );
    }

    // Call the backend clone endpoint
    // The target storefront is identified by storefrontId header
    // The source is passed in the request body
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/api/v1/storefront-theme/${storefrontId}/clone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'X-Tenant-ID': tenantId }),
          ...(userId && { 'X-User-ID': userId }),
          ...(authorization && { 'Authorization': authorization }),
        },
        body: JSON.stringify({
          sourceTenantId: body.sourceStorefrontId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null as unknown as StorefrontSettings,
          message: result.message || 'Failed to clone theme settings',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Theme settings cloned successfully',
    });
  } catch (error) {
    console.error('Clone settings error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null as unknown as StorefrontSettings,
        message: error instanceof Error ? error.message : 'Failed to clone theme settings',
      },
      { status: 500 }
    );
  }
}
