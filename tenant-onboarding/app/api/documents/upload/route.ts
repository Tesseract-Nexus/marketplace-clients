import { NextRequest, NextResponse } from 'next/server';
import { gcsClient, type ProductType, type DocumentCategory } from '../../../../lib/storage/gcs-client';
import { errorResponse, successResponse, validateRequest, generateRequestId } from '../../lib/api-handler';

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB for logos

/**
 * Validate file magic bytes match claimed MIME type.
 * Prevents uploading disguised executables as images/PDFs.
 */
function validateMagicBytes(buffer: Buffer, claimedType: string): boolean {
  switch (claimedType) {
    case 'image/jpeg':
      // JPEG: starts with FF D8 FF
      return buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    case 'image/png':
      // PNG: starts with 89 50 4E 47 (‰PNG)
      return buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    case 'image/webp':
      // WebP: starts with RIFF....WEBP
      return buffer.length >= 12
        && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
        && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    case 'application/pdf':
      // PDF: starts with %PDF
      return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    case 'image/svg+xml': {
      // SVG: text starts with <?xml or <svg
      const head = buffer.subarray(0, Math.min(256, buffer.length)).toString('utf-8').trimStart();
      if (!head.startsWith('<?xml') && !head.startsWith('<svg')) return false;
      // SVG is the most dangerous image format for XSS — check for scripting vectors
      const full = buffer.toString('utf-8').toLowerCase();
      if (/<script[\s>]/i.test(full)) return false;
      if (/<foreignobject[\s>]/i.test(full)) return false;
      if (/\bon\w+\s*=/i.test(full)) return false; // on* event handlers (onclick, onerror, etc.)
      if (/javascript\s*:/i.test(full)) return false; // javascript: URIs in href/xlink:href
      return true;
    }
    default:
      // Unknown type — reject by default. This is safe because ALLOWED_MIME_TYPES
      // is checked before this function runs (line 124), so only types with a case
      // above will reach here. If a new MIME type is added to ALLOWED_MIME_TYPES,
      // a corresponding case MUST be added here or uploads will be rejected.
      return false;
  }
}

// Allowed MIME types per document category
const ALLOWED_MIME_TYPES: Record<DocumentCategory, string[]> = {
  address_proof: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  business_proof: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  logo: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
  general: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

// Validate product type
function isValidProduct(product: string): product is ProductType {
  return ['fanzone', 'marketplace', 'poker', 'onboarding'].includes(product);
}

// Validate document category
function isValidCategory(category: string): category is DocumentCategory {
  return ['address_proof', 'business_proof', 'logo', 'general'].includes(category);
}

// Detect product from request headers or context
function detectProduct(request: NextRequest): ProductType {
  // Check X-Product header first
  const productHeader = request.headers.get('x-product');
  if (productHeader && isValidProduct(productHeader)) {
    return productHeader;
  }

  // Check referer for product context
  const referer = request.headers.get('referer') || '';
  if (referer.includes('/onboarding') || referer.includes('onboarding.')) {
    return 'onboarding';
  }
  if (referer.includes('/fanzone') || referer.includes('fanzone.')) {
    return 'fanzone';
  }
  if (referer.includes('/marketplace') || referer.includes('marketplace.')) {
    return 'marketplace';
  }
  if (referer.includes('/poker') || referer.includes('poker.')) {
    return 'poker';
  }

  // Default to onboarding for this app
  return 'onboarding';
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  // Validate request (rate limiting)
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const tenantId = formData.get('tenantId') as string | null;
    const categoryInput = formData.get('category') as string | null;
    const productInput = formData.get('product') as string | null;
    const documentType = formData.get('documentType') as string | null; // e.g., 'utility_bill', 'abn'

    // Validate required fields
    if (!file) {
      return errorResponse('No file provided', 400);
    }

    if (!sessionId && !tenantId) {
      return errorResponse('Either sessionId or tenantId is required', 400);
    }

    if (!categoryInput || !isValidCategory(categoryInput)) {
      return errorResponse('Invalid or missing category. Must be one of: address_proof, business_proof, logo, general', 400);
    }

    const category = categoryInput as DocumentCategory;

    // Detect or validate product
    const product = productInput && isValidProduct(productInput)
      ? productInput as ProductType
      : detectProduct(request);

    // Validate file type
    const allowedTypes = ALLOWED_MIME_TYPES[category];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse(
        `Invalid file type for ${category}. Allowed types: ${allowedTypes.join(', ')}`,
        400
      );
    }

    // Validate file size
    const maxSize = category === 'logo' ? MAX_LOGO_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return errorResponse(`File too large. Maximum size: ${maxSizeMB}MB`, 400);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes match claimed MIME type
    if (!validateMagicBytes(buffer, file.type)) {
      return errorResponse(
        `File content does not match claimed type (${file.type}). The file may be corrupted or disguised.`,
        400
      );
    }

    // Upload to GCS
    const result = await gcsClient.upload(buffer, {
      product,
      sessionId: sessionId || undefined,
      tenantId: tenantId || undefined,
      category,
      fileName: file.name,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        documentType: documentType || category,
        uploadedBy: 'onboarding-ui',
        requestId,
      },
    });

    if (!result.success) {
      return errorResponse(result.error || 'Upload failed', 500);
    }

    console.log(`[Documents] Uploaded ${category} document for ${sessionId || tenantId}: ${result.path}`);

    return successResponse({
      id: requestId,
      path: result.path,
      url: result.url,
      fileName: result.fileName,
      contentType: result.contentType,
      size: result.size,
      category,
      product,
      documentType: documentType || category,
    });
  } catch (error) {
    console.error('[Documents] Upload error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to upload document',
      500
    );
  }
}

// Get a signed URL for an existing file
export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const expiresInMinutes = parseInt(searchParams.get('expires') || '60', 10);

    if (!path) {
      return errorResponse('Path parameter is required', 400);
    }

    const url = await gcsClient.getSignedReadUrl(path, expiresInMinutes);

    if (!url) {
      return errorResponse('File not found', 404);
    }

    return successResponse({ url, path, expiresIn: expiresInMinutes * 60 });
  } catch (error) {
    console.error('[Documents] Get URL error:', error);
    return errorResponse('Failed to get document URL', 500);
  }
}

// Delete a file
export async function DELETE(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return errorResponse('Path parameter is required', 400);
    }

    // Security check: ensure the path matches expected patterns
    const pathRegex = /^(fanzone|marketplace|poker|onboarding)\/(onboarding|tenants)\/[\w-]+\/(address_proof|business_proof|logo|general)\/[\w.-]+$/;
    if (!pathRegex.test(path)) {
      return errorResponse('Invalid path format', 400);
    }

    const success = await gcsClient.delete(path);

    if (!success) {
      return errorResponse('Failed to delete document', 500);
    }

    console.log(`[Documents] Deleted document: ${path}`);

    return successResponse({ deleted: true, path });
  } catch (error) {
    console.error('[Documents] Delete error:', error);
    return errorResponse('Failed to delete document', 500);
  }
}
