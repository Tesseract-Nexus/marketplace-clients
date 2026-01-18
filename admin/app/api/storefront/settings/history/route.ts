import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';
import { ThemeHistoryListResponse } from '@/lib/api/types';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * GET /api/storefront/settings/history
 * Get version history for the storefront theme settings
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest): Promise<NextResponse<ThemeHistoryListResponse>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const storefrontId = request.headers.get('x-storefront-id') || request.headers.get('X-Storefront-ID');
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const userId = headers['x-jwt-claim-sub'];
    const authorization = headers['Authorization'];

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
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}/history?limit=${limit}`,
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
