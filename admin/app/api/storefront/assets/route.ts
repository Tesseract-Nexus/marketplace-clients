import { NextRequest, NextResponse } from 'next/server';
import { StorefrontAsset, UploadAssetResponse, ApiResponse } from '@/lib/api/types';

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
  hero: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    filename: 'hero',
  },
  banner: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    filename: 'banner',
  },
  product: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    filename: 'product',
  },
  category: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    filename: 'category',
  },
  custom: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    filename: 'custom',
  },
};

const getAuthHeaders = (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id');
  const storefrontId = request.headers.get('x-storefront-id');
  const userId = request.headers.get('x-user-id');
  return { tenantId, storefrontId, userId };
};

/**
 * Build the storage path for storefront assets
 * Path structure: storefront-assets/{tenant-id}/{storefront-id}/{type}/{filename}.{ext}
 */
function buildStoragePath(
  tenantId: string,
  storefrontId: string,
  assetType: string,
  fileExtension: string,
  uniqueId?: string
): string {
  const id = uniqueId || Date.now().toString();
  const filename = `${ASSET_CONFIG[assetType]?.filename || assetType}-${id}.${fileExtension}`;
  return `storefront-assets/${tenantId}/${storefrontId}/${assetType}/${filename}`;
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
 * Build public URL for the asset (for direct access via serve endpoint)
 */
function buildPublicUrl(path: string): string {
  return `/api/storefront/assets/serve?path=${encodeURIComponent(path)}`;
}

/**
 * Generate presigned URL for an asset
 */
async function generatePresignedUrl(path: string, tenantId: string): Promise<string | null> {
  try {
    const presignedResponse = await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
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
      return presignedData.url || null;
    }
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
  }
  return null;
}

/**
 * GET /api/storefront/assets
 * List all assets for the current storefront
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontAsset[]>>> {
  try {
    const { tenantId, storefrontId } = getAuthHeaders(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, data: [], message: 'X-Tenant-ID header is required' },
        { status: 400 }
      );
    }

    if (!storefrontId) {
      return NextResponse.json(
        { success: false, data: [], message: 'X-Storefront-ID header is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // List documents from document service
    const prefix = `storefront-assets/${tenantId}/${storefrontId}${type ? `/${type}` : ''}`;

    const response = await fetch(
      `${DOCUMENT_SERVICE_URL}/api/v1/documents?bucket=${DOCUMENT_SERVICE_BUCKET}&prefix=${encodeURIComponent(prefix)}&includeMetadata=true`,
      {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to list documents from document service:', await response.text());
      // Return empty array on error for better UX
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const data = await response.json();

    // Transform document service response to StorefrontAsset format
    const assets: StorefrontAsset[] = await Promise.all(
      (data.documents || []).map(async (doc: any) => {
        const docPath = doc.key || doc.path;
        const presignedUrl = await generatePresignedUrl(docPath, tenantId);

        return {
          id: doc.id || docPath,
          tenantId,
          storefrontId,
          type: extractTypeFromPath(docPath),
          url: presignedUrl || buildPublicUrl(docPath),
          filename: doc.filename || extractFilenameFromPath(docPath),
          mimeType: doc.mimeType || doc.contentType || 'application/octet-stream',
          size: doc.size || 0,
          createdAt: doc.createdAt || doc.lastModified || new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

/**
 * POST /api/storefront/assets
 * Upload a new asset to the document service with proper directory structure
 *
 * Directory structure: storefront-assets/{tenant-id}/{storefront-id}/{type}/{filename}
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadAssetResponse>> {
  try {
    const { tenantId, storefrontId, userId } = getAuthHeaders(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, asset: null as any, message: 'X-Tenant-ID header is required' } as any,
        { status: 400 }
      );
    }

    if (!storefrontId) {
      return NextResponse.json(
        { success: false, asset: null as any, message: 'X-Storefront-ID header is required' } as any,
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, asset: null as any, message: 'No file provided' } as any,
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, asset: null as any, message: 'Asset type is required' } as any,
        { status: 400 }
      );
    }

    // Get asset config (or use defaults for custom types)
    const config = ASSET_CONFIG[type] || ASSET_CONFIG.custom;

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, asset: null as any, message: `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}` } as any,
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        { success: false, asset: null as any, message: `File size exceeds ${Math.round(config.maxSize / 1024 / 1024)}MB limit` } as any,
        { status: 400 }
      );
    }

    // Get file extension
    const ext = getExtensionFromMimeType(file.type);

    // Generate storage path
    const storagePath = buildStoragePath(tenantId, storefrontId, type, ext);

    // Build tags for metadata
    const tags = `type:${type},tenantId:${tenantId},storefrontId:${storefrontId}`;

    // Create FormData for document service upload
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket', DOCUMENT_SERVICE_BUCKET);
    uploadFormData.append('path', storagePath);
    uploadFormData.append('tags', tags);
    uploadFormData.append('isPublic', 'true');

    // Upload to document service
    const uploadUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents/upload`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Tenant-ID': tenantId,
        ...(userId && { 'X-User-ID': userId }),
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Document service upload failed:', errorText);
      return NextResponse.json(
        { success: false, asset: null as any, message: 'Failed to upload file to storage' } as any,
        { status: 500 }
      );
    }

    const uploadResult = await uploadResponse.json();

    // Generate presigned URL for viewing
    let viewUrl = uploadResult.url;
    if (!viewUrl) {
      viewUrl = await generatePresignedUrl(storagePath, tenantId);
    }

    const asset: StorefrontAsset = {
      id: uploadResult.id || crypto.randomUUID(),
      tenantId,
      storefrontId,
      type: type as StorefrontAsset['type'],
      url: viewUrl || buildPublicUrl(storagePath),
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        asset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { success: false, asset: null as any, message: 'Failed to upload asset' } as any,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storefront/assets
 * Delete an asset by path from document service
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { tenantId } = getAuthHeaders(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, data: null, message: 'X-Tenant-ID header is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');
    const assetPath = searchParams.get('path');

    if (!assetId && !assetPath) {
      return NextResponse.json(
        { success: false, data: null, message: 'Asset ID or path is required' },
        { status: 400 }
      );
    }

    // Delete from document service
    const deletePath = assetPath || assetId;
    const deleteResponse = await fetch(
      `${DOCUMENT_SERVICE_URL}/api/v1/documents/${DOCUMENT_SERVICE_BUCKET}/file/${encodeURIComponent(deletePath!)}`,
      {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId,
        },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      console.error('Document service delete failed:', await deleteResponse.text());
      return NextResponse.json(
        { success: false, data: null, message: 'Failed to delete asset from storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

// Helper functions

function extractTypeFromPath(path: string): StorefrontAsset['type'] {
  const parts = path.split('/');
  // Path structure: storefront-assets/{tenant-id}/{storefront-id}/{type}/{filename}
  if (parts.length >= 4) {
    const type = parts[3];
    if (['logo', 'favicon', 'hero', 'banner', 'product', 'category', 'custom'].includes(type)) {
      return type as StorefrontAsset['type'];
    }
  }
  return 'custom';
}

function extractFilenameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || 'unknown';
}
