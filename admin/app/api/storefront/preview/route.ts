import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';
import { ApiResponse } from '@/lib/api/types';

interface PreviewResponse {
  previewUrl: string;
  expiresAt: string;
}

/**
 * POST /api/storefront/preview
 * Generate a preview URL for the storefront with current settings
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PreviewResponse>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      return NextResponse.json(
        { success: false, data: null as any, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Get the tenant slug from the request or use a default demo store
    const slug = body.slug || 'demo-store';

    // Generate preview URL with preview=true flag and timestamp for cache-busting
    const storefrontBaseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3200';
    const timestamp = Date.now();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    // The storefront will check for ?preview=true and show a preview banner
    // The timestamp ensures the iframe refreshes with latest settings
    const previewUrl = `${storefrontBaseUrl}/${slug}?preview=true&t=${timestamp}`;

    return NextResponse.json({
      success: true,
      data: {
        previewUrl,
        expiresAt,
      },
      message: 'Preview URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating preview URL:', error);
    return NextResponse.json(
      { success: false, data: null as any, message: 'Failed to generate preview URL' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/storefront/preview
 * Get the current preview URL if one exists
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PreviewResponse | null>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }

    // Generate preview URL with preview=true flag and timestamp
    const storefrontBaseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3200';
    const timestamp = Date.now();

    // Use demo-store as default slug for development
    const slug = 'demo-store';
    const previewUrl = `${storefrontBaseUrl}/${slug}?preview=true&t=${timestamp}`;

    return NextResponse.json({
      success: true,
      data: {
        previewUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      },
    });
  } catch (error) {
    console.error('Error getting preview URL:', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to get preview URL' },
      { status: 500 }
    );
  }
}
