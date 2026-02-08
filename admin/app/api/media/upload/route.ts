import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// Document service URL - uses internal k8s service name or external URL
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8082';

// Public bucket for marketplace assets (products, categories, banners) - direct GCS access
const PUBLIC_BUCKET = process.env.STORAGE_PUBLIC_BUCKET || 'marketplace-devtest-public-au';
const PUBLIC_BUCKET_URL = process.env.STORAGE_PUBLIC_BUCKET_URL || `https://storage.googleapis.com/${PUBLIC_BUCKET}`;

// Entity types that can have media
type EntityType = 'product' | 'category' | 'warehouse';
// Media types for different purposes
type MediaType = 'image' | 'logo' | 'banner' | 'icon' | 'video' | 'gallery';

interface MediaUploadResponse {
  success: boolean;
  media?: {
    id: string;
    url: string;
    path: string;
    fileName: string;
    contentType: string;
    size: number;
    mediaType: MediaType;
    entityType: EntityType;
    entityId?: string;
    position: number;
    uploadedAt: string;
  };
  message?: string;
}

const getAuthInfo = async (request: NextRequest) => {
  const headers = await getProxyHeaders(request) as Record<string, string>;
  const tenantId = headers['x-jwt-claim-tenant-id'] || '';
  const userId = headers['x-jwt-claim-sub'] || '';

  if (!tenantId) {
    return null; // Missing required tenant header
  }

  return { tenantId, userId, headers };
};

// File type validation based on media type
const getAllowedTypes = (mediaType: MediaType): string[] => {
  switch (mediaType) {
    case 'video':
      return ['video/mp4', 'video/webm', 'video/quicktime'];
    case 'logo':
    case 'icon':
      return ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    default:
      return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  }
};

// Max file size based on media type
const getMaxSize = (mediaType: MediaType): number => {
  switch (mediaType) {
    case 'video':
      return 100 * 1024 * 1024; // 100MB
    case 'banner':
      return 5 * 1024 * 1024; // 5MB
    case 'logo':
    case 'icon':
      return 2 * 1024 * 1024; // 2MB
    default:
      return 10 * 1024 * 1024; // 10MB
  }
};

/**
 * POST /api/media/upload
 * Generic media upload endpoint for products, categories, and warehouses
 *
 * Form fields:
 * - file: File (required)
 * - entityType: 'product' | 'category' | 'warehouse' (required)
 * - mediaType: 'image' | 'logo' | 'banner' | 'icon' | 'video' | 'gallery' (required)
 * - entityId: string (optional, for associating with existing entity)
 * - position: number (optional, default 0)
 */
export async function POST(request: NextRequest): Promise<NextResponse<MediaUploadResponse>> {
  try {
    const authInfo = await getAuthInfo(request);
    if (!authInfo) {
      return NextResponse.json(
        { success: false, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }
    const { tenantId, userId, headers } = authInfo;
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const entityType = formData.get('entityType') as EntityType | null;
    const mediaType = formData.get('mediaType') as MediaType | null;
    const entityId = formData.get('entityId') as string | null;
    const position = parseInt(formData.get('position') as string) || 0;

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!entityType || !['product', 'category', 'warehouse', 'staff'].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid entity type. Must be: product, category, warehouse, or staff' },
        { status: 400 }
      );
    }

    if (!mediaType || !['image', 'logo', 'banner', 'icon', 'video', 'gallery'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid media type. Must be: image, logo, banner, icon, video, or gallery' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = getAllowedTypes(mediaType);
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `Invalid file type for ${mediaType}. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = getMaxSize(mediaType);
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { success: false, message: `File size exceeds ${maxSizeMB}MB limit for ${mediaType}` },
        { status: 400 }
      );
    }

    // Build storage path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const entityIdPart = entityId || 'temp';

    // Path structure: marketplace/{tenantId}/{entityType}s/{entityId}/{mediaType}/{filename}
    const storagePath = `marketplace/${tenantId}/${entityType}s/${entityIdPart}/${mediaType}/${uniqueFileName}`;

    // Build tags for metadata
    const tags = [
      `tenantId:${tenantId}`,
      `entityType:${entityType}`,
      `mediaType:${mediaType}`,
      `position:${position}`,
      entityId ? `entityId:${entityId}` : '',
    ].filter(Boolean).join(',');

    // Create FormData for document-service
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket', PUBLIC_BUCKET);
    uploadFormData.append('path', storagePath);
    uploadFormData.append('tags', tags);
    uploadFormData.append('isPublic', 'true'); // Media assets should be public for storefront access

    // Upload to document-service - remove Content-Type as it's set by FormData
    const uploadUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents/upload`;
    const { 'Content-Type': _, ...uploadHeaders } = headers;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...uploadHeaders,
        'X-Product-ID': 'marketplace',
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Document service upload failed:', errorData);
      throw new Error(errorData.message || `Document service returned ${response.status}`);
    }

    const result = await response.json();
    const mediaId = `${mediaType}_${timestamp}`;

    // Get the URL - document-service should return a public URL for public assets
    let viewUrl = result.url;
    if (!viewUrl && result.publicUrl) {
      viewUrl = result.publicUrl;
    }

    // If no URL returned, construct it from the document service
    if (!viewUrl) {
      // For public bucket, construct direct GCS URL - no presigned URL needed
      viewUrl = `${PUBLIC_BUCKET_URL}/${storagePath}`;
    }

    return NextResponse.json(
      {
        success: true,
        media: {
          id: mediaId,
          url: viewUrl,
          path: storagePath,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          mediaType,
          entityType,
          entityId: entityId || undefined,
          position,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 }
    );
  }
}
