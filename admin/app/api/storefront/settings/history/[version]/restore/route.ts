import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';
import { ApiResponse, StorefrontSettings } from '@/lib/api/types';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

interface RouteParams {
  params: Promise<{ version: string }>;
}

/**
 * POST /api/storefront/settings/history/[version]/restore
 * Restore a specific version from history
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const storefrontId = request.headers.get('x-storefront-id') || request.headers.get('X-Storefront-ID');
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const userId = headers['x-jwt-claim-sub'];
    const authorization = headers['Authorization'];
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
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}/restore/${version}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'x-jwt-claim-tenant-id': tenantId }),
          ...(userId && { 'x-jwt-claim-sub': userId }),
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
