import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { handleApiError, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const QR_SERVICE_URL = getServiceUrl('QR');

interface UploadQRRequest {
  qr_id: string;
  image_base64: string;
  logo_base64?: string;
  content_type?: string;
}

interface UploadQRResponse {
  success: boolean;
  data?: {
    id: string;
    storage_url: string;
    logo_url?: string;
  };
  error?: {
    message: string;
  };
}

/**
 * POST /api/qr/upload
 * Upload a composite QR code image (with logo overlay) to GCS
 *
 * This endpoint allows the frontend to:
 * 1. Generate a plain QR code from the backend
 * 2. Apply logo overlay client-side
 * 3. Upload the composite image to replace the original
 *
 * Additionally, the logo can be stored separately for later retrieval.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UploadQRRequest = await request.json();

    if (!body.qr_id || !body.image_base64) {
      return NextResponse.json(
        { success: false, error: { message: 'qr_id and image_base64 are required' } },
        { status: 400 }
      );
    }

    // Get tenant ID from headers
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || '';

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { message: 'X-Tenant-ID header is required' } },
        { status: 401 }
      );
    }

    // Forward to QR service for storage
    const response = await fetch(`${QR_SERVICE_URL}/qr/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify({
        qr_id: body.qr_id,
        image_base64: body.image_base64,
        logo_base64: body.logo_base64,
        content_type: body.content_type || 'image/png',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const nextResponse = NextResponse.json({ success: true, data }, { status: 200 });
      nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
      return nextResponse;
    }

    return NextResponse.json(
      { success: false, error: data.error || { message: 'Failed to upload QR code' } },
      { status: response.status }
    );
  } catch (error) {
    return handleApiError(error, 'POST qr/upload');
  }
}
