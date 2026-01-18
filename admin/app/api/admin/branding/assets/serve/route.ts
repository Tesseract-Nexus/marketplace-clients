import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// Document service URL
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8082';
const DOCUMENT_SERVICE_BUCKET = process.env.DOCUMENT_SERVICE_BUCKET || 'tesseracthub-devtest-assets';

const getAuthInfo = async (request: NextRequest) => {
  const headers = await getProxyHeaders(request) as Record<string, string>;
  const tenantId = headers['x-jwt-claim-tenant-id'] || '';

  if (!tenantId) {
    return null; // Missing required tenant header
  }

  return { tenantId, headers };
};

/**
 * GET /api/admin/branding/assets/serve?path=xxx
 * Proxy endpoint to serve branding assets from document-service
 * This allows consistent URLs that don't expire (unlike presigned URLs)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authInfo = await getAuthInfo(request);
    if (!authInfo) {
      return NextResponse.json(
        { success: false, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }
    const { headers } = authInfo;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, message: 'Path is required' },
        { status: 400 }
      );
    }

    // Validate path starts with admin-marketplace (security check)
    if (!path.startsWith('admin-marketplace/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid asset path' },
        { status: 403 }
      );
    }

    // Get presigned URL for the asset
    const presignedResponse = await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/presigned-url`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        bucket: DOCUMENT_SERVICE_BUCKET,
        method: 'GET',
        expiresIn: 3600, // 1 hour
      }),
    });

    if (!presignedResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }

    const presignedData = await presignedResponse.json();

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedData.url);
  } catch (error) {
    console.error('Error serving branding asset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to serve asset' },
      { status: 500 }
    );
  }
}
