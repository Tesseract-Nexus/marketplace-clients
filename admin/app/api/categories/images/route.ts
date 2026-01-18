import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// Document service URL - uses internal k8s service name or external URL
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8082';

// Public bucket for marketplace assets (products, categories) - direct GCS access
const PUBLIC_BUCKET = process.env.STORAGE_PUBLIC_BUCKET || 'marketplace-devtest-public-au';
const PUBLIC_BUCKET_URL = process.env.STORAGE_PUBLIC_BUCKET_URL || `https://storage.googleapis.com/${PUBLIC_BUCKET}`;

// Maximum images allowed per category
const MAX_CATEGORY_IMAGES = 3;

interface CategoryImageResponse {
  success: boolean;
  image?: {
    id: string;
    url: string;
    path: string;
    fileName: string;
    contentType: string;
    size: number;
    imageType: string;
    position: number;
    uploadedAt: string;
  };
  message?: string;
}

interface ListImagesResponse {
  success: boolean;
  images: Array<{
    id: string;
    name: string;
    url: string;
    path: string;
    position: number;
    metadata: Record<string, string>;
  }>;
  count: number;
  maxAllowed: number;
}

/**
 * GET /api/categories/images?categoryId=xxx
 * List all images for a category via document-service
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest): Promise<NextResponse<ListImagesResponse>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      return NextResponse.json(
        { success: false, images: [], count: 0, maxAllowed: MAX_CATEGORY_IMAGES, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, images: [], count: 0, maxAllowed: MAX_CATEGORY_IMAGES, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    // List documents from document-service with prefix filter
    // Path: marketplace/{tenantId}/categories/{categoryId}/images/
    const prefix = `marketplace/${tenantId}/categories/${categoryId}/images/`;
    const listUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents?bucket=${PUBLIC_BUCKET}&prefix=${encodeURIComponent(prefix)}&includeMetadata=true`;

    const response = await fetch(listUrl, {
      headers: {
        'x-jwt-claim-tenant-id': tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`Document service returned ${response.status}`);
    }

    const data = await response.json();

    // Map document-service response to our format
    const images = (data.documents || []).map((doc: Record<string, unknown>, index: number) => ({
      id: `img_${index}_${Date.now()}`,
      name: (doc.filename as string) || (doc.path as string)?.split('/').pop() || '',
      url: (doc.url as string) || `${PUBLIC_BUCKET_URL}/${doc.path}`,
      path: doc.path as string,
      position: parseInt(((doc.tags as Record<string, string>)?.position as string) || String(index), 10),
      metadata: {
        contentType: doc.mimeType as string,
        size: String(doc.size),
        ...(doc.tags as Record<string, string>),
      },
    }));

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
      maxAllowed: MAX_CATEGORY_IMAGES,
    });
  } catch (error) {
    console.error('Error listing category images:', error);
    return NextResponse.json(
      { success: false, images: [], count: 0, maxAllowed: MAX_CATEGORY_IMAGES, message: 'Failed to list images' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories/images
 * Upload a new category image via document-service
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 *
 * Form fields:
 * - file: File (required)
 * - categoryId: string (required)
 * - imageType: 'icon' | 'banner' | 'gallery' (optional, default: 'gallery')
 * - position: number (optional, default: 0)
 */
export async function POST(request: NextRequest): Promise<NextResponse<CategoryImageResponse>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const userId = headers['x-jwt-claim-sub'] || '';

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const categoryId = formData.get('categoryId') as string | null;
    const imageType = (formData.get('imageType') as string) || 'gallery';
    const position = parseInt(formData.get('position') as string) || 0;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for images, 5MB for banners)
    const maxSize = imageType === 'banner' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { success: false, message: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // Require categoryId for proper storage organization
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required. Please save the category first before uploading images.' },
        { status: 400 }
      );
    }

    // Check current image count to enforce limit
    const prefix = `marketplace/${tenantId}/categories/${categoryId}/images/`;
    const listUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents?bucket=${PUBLIC_BUCKET}&prefix=${encodeURIComponent(prefix)}&includeMetadata=false`;

    const listResponse = await fetch(listUrl, {
      headers: {
        'x-jwt-claim-tenant-id': tenantId,
      },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const currentCount = (listData.documents || []).length;
      if (currentCount >= MAX_CATEGORY_IMAGES) {
        return NextResponse.json(
          { success: false, message: `Maximum ${MAX_CATEGORY_IMAGES} images allowed per category. Please delete an existing image first.` },
          { status: 400 }
        );
      }
    }

    // Build storage path with tenant and category IDs for proper multi-tenant isolation
    // Path: marketplace/{tenantId}/categories/{categoryId}/images/{imageType}/{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const storagePath = `marketplace/${tenantId}/categories/${categoryId}/images/${imageType}/${uniqueFileName}`;

    // Build tags for metadata
    const tags = [
      `tenantId:${tenantId}`,
      `categoryId:${categoryId}`,
      `imageType:${imageType}`,
      `position:${position}`,
    ].join(',');

    // Create FormData for document-service
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket', PUBLIC_BUCKET);
    uploadFormData.append('path', storagePath);
    uploadFormData.append('tags', tags);
    uploadFormData.append('isPublic', 'true'); // Category images must be public for storefront

    // Upload to document-service
    const uploadUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'x-jwt-claim-tenant-id': tenantId,
        ...(userId && { 'x-jwt-claim-sub': userId }),
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Document service returned ${response.status}`);
    }

    const imageId = `img_${timestamp}`;

    // Use public GCS URL since images are public - no proxy needed
    const publicUrl = `${PUBLIC_BUCKET_URL}/${storagePath}`;

    return NextResponse.json(
      {
        success: true,
        image: {
          id: imageId,
          url: publicUrl,
          path: storagePath,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          imageType,
          position,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading category image:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/images?path=xxx
 * Delete a category image via document-service
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing required tenant ID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, message: 'Image path is required' },
        { status: 400 }
      );
    }

    // Verify the path belongs to this tenant (security check)
    if (!path.startsWith(`marketplace/${tenantId}/`)) {
      return NextResponse.json(
        { success: false, message: 'Access denied: Image does not belong to this tenant' },
        { status: 403 }
      );
    }

    // Delete via document-service
    const deleteUrl = `${DOCUMENT_SERVICE_URL}/api/v1/documents/${PUBLIC_BUCKET}/file/${encodeURIComponent(path)}`;
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'x-jwt-claim-tenant-id': tenantId,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Document service returned ${response.status}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category image:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
