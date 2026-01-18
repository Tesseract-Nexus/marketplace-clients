import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';
import { ApiResponse, StorefrontSettings } from '@/lib/api/types';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

interface CloneRequest {
  sourceStorefrontId: string;
}

/**
 * POST /api/storefront/settings/clone
 * Clone theme settings from another storefront
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
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
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}/clone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'x-jwt-claim-tenant-id': tenantId }),
          ...(userId && { 'x-jwt-claim-sub': userId }),
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
