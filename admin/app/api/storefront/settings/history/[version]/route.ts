import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';
import { ThemeHistoryResponse } from '@/lib/api/types';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

interface RouteParams {
  params: Promise<{ version: string }>;
}

/**
 * GET /api/storefront/settings/history/[version]
 * Get a specific version from history
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ThemeHistoryResponse>> {
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
          message: 'X-Storefront-ID header is required',
        },
        { status: 400 }
      );
    }

    // Call the backend history version endpoint
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}/history/${version}`,
      {
        method: 'GET',
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
          message: result.message || 'Failed to fetch theme history version',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get history version error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch theme history version',
      },
      { status: 500 }
    );
  }
}
