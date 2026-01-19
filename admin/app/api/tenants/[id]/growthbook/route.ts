import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://tenant-service.marketplace.svc.cluster.local:8080';

/**
 * GET /api/tenants/[id]/growthbook
 * Get GrowthBook configuration for a tenant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proxyHeaders = await getProxyHeaders(request);

    // Fetch from tenant service
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/${id}/growthbook`,
      {
        method: 'GET',
        headers: proxyHeaders as HeadersInit,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to get GrowthBook config',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('[GrowthBook Config] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get GrowthBook configuration',
      },
      { status: 500 }
    );
  }
}
