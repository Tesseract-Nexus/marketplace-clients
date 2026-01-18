import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// Document service URL - uses internal k8s service name or external URL
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8082';
const DOCUMENT_SERVICE_BUCKET = process.env.DOCUMENT_SERVICE_BUCKET || 'tesseracthub-devtest-assets';

// Asset types and their configurations
const ASSET_CONFIG: Record<string, { maxSize: number; allowedTypes: string[]; filename: string }> = {
  logo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    filename: 'logo',
  },
  favicon: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/x-icon', 'image/png', 'image/svg+xml', 'image/vnd.microsoft.icon'],
    filename: 'favicon',
  },
  banner: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    filename: 'banner',
  },
};

type AssetType = 'logo' | 'favicon' | 'banner';

interface BrandingAssetResponse {
  success: boolean;
  asset?: {
    url: string;
    publicUrl: string;
    path: string;
    assetType: string;
    fileName: string;
    contentType: string;
    size: number;
    uploadedAt: string;
  };
  message?: string;
}

// Get auth info from Istio JWT headers
const getAuthInfo = async (request: NextRequest) => {
  const headers = await getProxyHeaders(request) as Record<string, string>;
  const tenantId = headers['x-jwt-claim-tenant-id'] || '';
  const userId = headers['x-jwt-claim-sub'] || '';
  return { tenantId, userId, headers };
};

// Validate that tenant ID is present
const validateTenantId = async (request: NextRequest): Promise<string | null> => {
  const { tenantId } = await getAuthInfo(request);
  if (!tenantId) {
    return null;
  }
  return tenantId;
};

/**
 * Build the storage path for branding assets
 *
 * Path structure:
 * - Admin branding: admin-marketplace/<tenant_id>/<asset_type>.<ext>
 * - Storefront branding: admin-marketplace/<tenant_id>/storefront/<storefront_id>/<asset_type>.<ext>
 */
function buildStoragePath(
  tenantId: string,
  assetType: AssetType,
  fileExtension: string,
  storefrontId?: string
): string {
  const filename = `${ASSET_CONFIG[assetType].filename}.${fileExtension}`;

  if (storefrontId) {
    return `admin-marketplace/${tenantId}/storefront/${storefrontId}/${filename}`;
  }
  return `admin-marketplace/${tenantId}/${filename}`;
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/gif': 'gif',
  };
  return mimeToExt[mimeType] || 'png';
}

/**
 * Build public URL for the asset (for direct access)
 */
function buildPublicUrl(path: string): string {
  // This URL will be accessible via the document-service proxy or CDN
  return `/api/admin/branding/assets/serve?path=${encodeURIComponent(path)}`;
}

/**
 * GET /api/admin/branding/assets?assetType=logo&storefrontId=xxx
 * Get the current branding asset URL
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = await validateTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const { headers } = await getAuthInfo(request);
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('assetType') as AssetType;
    const storefrontId = searchParams.get('storefrontId') || undefined;

    if (!assetType || !ASSET_CONFIG[assetType]) {
      return NextResponse.json(
        { success: false, message: 'Invalid asset type. Allowed: logo, favicon, banner' },
        { status: 400 }
      );
    }

    // Build the expected path
    const extensions = ['png', 'jpg', 'svg', 'webp', 'ico'];
    let foundAsset = null;

    // Try to find the asset with different extensions
    for (const ext of extensions) {
      const path = buildStoragePath(tenantId, assetType, ext, storefrontId);

      // Check if document exists
      const checkUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents/exists?bucket=${DOCUMENT_SERVICE_BUCKET}&path=${encodeURIComponent(path)}`;

      try {
        const response = await fetch(checkUrl, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            // Generate presigned URL for viewing
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
                expiresIn: 86400, // 24 hours
              }),
            });

            if (presignedResponse.ok) {
              const presignedData = await presignedResponse.json();
              foundAsset = {
                url: presignedData.url,
                publicUrl: buildPublicUrl(path),
                path,
                assetType,
              };
              break;
            }
          }
        }
      } catch {
        // Continue to next extension
      }
    }

    if (foundAsset) {
      return NextResponse.json({ success: true, asset: foundAsset });
    }

    return NextResponse.json(
      { success: true, asset: null, message: 'No asset found' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting branding asset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get asset' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/branding/assets
 * Upload a new branding asset (logo, favicon, or banner)
 *
 * FormData:
 * - file: File
 * - assetType: 'logo' | 'favicon' | 'banner'
 * - storefrontId?: string (optional, for storefront-specific assets)
 */
export async function POST(request: NextRequest): Promise<NextResponse<BrandingAssetResponse>> {
  try {
    const tenantId = await validateTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const { userId, headers } = await getAuthInfo(request);
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const assetType = formData.get('assetType') as AssetType | null;
    const storefrontId = formData.get('storefrontId') as string | null;

    // Validate asset type
    if (!assetType || !ASSET_CONFIG[assetType]) {
      return NextResponse.json(
        { success: false, message: 'Invalid asset type. Allowed: logo, favicon, banner' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    const config = ASSET_CONFIG[assetType];

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `Invalid file type for ${assetType}. Allowed: ${config.allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return NextResponse.json(
        { success: false, message: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // Build storage path (fixed filename for consistent URLs)
    const fileExtension = getExtensionFromMimeType(file.type);
    const storagePath = buildStoragePath(tenantId, assetType, fileExtension, storefrontId || undefined);

    // Build tags for metadata
    const tags = [
      `tenantId:${tenantId}`,
      `assetType:${assetType}`,
      `scope:${storefrontId ? 'storefront' : 'admin'}`,
      storefrontId ? `storefrontId:${storefrontId}` : '',
    ].filter(Boolean).join(',');

    // First, delete any existing asset with same base path (any extension)
    // This ensures we can overwrite since document-service has unique path constraint
    const extensions = ['png', 'jpg', 'svg', 'webp', 'ico'];
    for (const ext of extensions) {
      const oldPath = buildStoragePath(tenantId, assetType, ext, storefrontId || undefined);
      try {
        await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/${DOCUMENT_SERVICE_BUCKET}/file/${encodeURIComponent(oldPath)}`, {
          method: 'DELETE',
          headers,
        });
      } catch {
        // Ignore errors - file might not exist
      }
    }

    // Create FormData for document-service
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket', DOCUMENT_SERVICE_BUCKET);
    uploadFormData.append('path', storagePath);
    uploadFormData.append('tags', tags);
    uploadFormData.append('isPublic', 'true'); // Branding assets should be public

    // Upload to document-service - remove Content-Type as it's set by FormData
    const uploadUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents/upload`;
    const { 'Content-Type': _, ...uploadHeaders } = headers;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: uploadHeaders,
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Document service returned ${response.status}`);
    }

    const result = await response.json();

    // Get presigned URL for immediate viewing
    let viewUrl = result.url;
    if (!viewUrl) {
      const presignedResponse = await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/presigned-url`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: storagePath,
          bucket: DOCUMENT_SERVICE_BUCKET,
          method: 'GET',
          expiresIn: 86400, // 24 hours
        }),
      });

      if (presignedResponse.ok) {
        const presignedData = await presignedResponse.json();
        viewUrl = presignedData.url;
      }
    }

    // Build public URL (for storing in settings)
    const publicUrl = buildPublicUrl(storagePath);

    return NextResponse.json(
      {
        success: true,
        asset: {
          url: viewUrl || publicUrl,
          publicUrl,
          path: storagePath,
          assetType,
          fileName: `${config.filename}.${fileExtension}`,
          contentType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading branding asset:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/branding/assets?assetType=logo&storefrontId=xxx
 * Delete a branding asset
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = await validateTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const { headers } = await getAuthInfo(request);
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('assetType') as AssetType;
    const storefrontId = searchParams.get('storefrontId') || undefined;

    if (!assetType || !ASSET_CONFIG[assetType]) {
      return NextResponse.json(
        { success: false, message: 'Invalid asset type' },
        { status: 400 }
      );
    }

    // Delete all possible extensions
    const extensions = ['png', 'jpg', 'svg', 'webp', 'ico'];
    let deleted = false;

    for (const ext of extensions) {
      const path = buildStoragePath(tenantId, assetType, ext, storefrontId);
      try {
        const response = await fetch(
          `${DOCUMENT_SERVICE_URL}/api/v1/documents/${DOCUMENT_SERVICE_BUCKET}/file/${encodeURIComponent(path)}`,
          {
            method: 'DELETE',
            headers,
          }
        );
        if (response.ok) {
          deleted = true;
        }
      } catch {
        // Continue to next extension
      }
    }

    return NextResponse.json({
      success: true,
      message: deleted ? 'Asset deleted successfully' : 'No asset found to delete',
    });
  } catch (error) {
    console.error('Error deleting branding asset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
