/**
 * Avatar Upload API Route
 *
 * Handles profile picture uploads for authenticated customers.
 * Follows the same pattern as admin product image uploads:
 * - Uploads to document-service (GCS public bucket)
 * - Constructs deterministic public URL from env-based bucket config
 * - Updates customer record with the public URL
 *
 * Env vars (same as admin):
 *   STORAGE_PUBLIC_BUCKET      - GCS bucket name (default: marketplace-devtest-public-au)
 *   STORAGE_PUBLIC_BUCKET_URL  - Public base URL (default: https://storage.googleapis.com/{bucket})
 */

import { NextRequest, NextResponse } from 'next/server';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8089/api/v1';
const CUSTOMERS_BASE_URL = CUSTOMERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:8082';

// Public bucket for marketplace assets — same env vars as admin product images
const PUBLIC_BUCKET = process.env.STORAGE_PUBLIC_BUCKET || 'marketplace-devtest-public-au';
const PUBLIC_BUCKET_URL = process.env.STORAGE_PUBLIC_BUCKET_URL || `https://storage.googleapis.com/${PUBLIC_BUCKET}`;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Get auth context from session cookie (same pattern as profile/route.ts).
 */
async function getAuthContext(request: NextRequest): Promise<{
  customerId?: string;
  tenantId?: string;
  token?: string;
} | null> {
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) return null;

    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      headers: {
        'Cookie': cookie,
        'X-Forwarded-Host': forwardedHost,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

    const tokenData = await response.json();
    if (tokenData.user_id) {
      return {
        customerId: tokenData.user_id,
        tenantId: tokenData.tenant_id,
        token: tokenData.access_token ? `Bearer ${tokenData.access_token}` : undefined,
      };
    }
  } catch (error) {
    console.error('[Avatar API] Failed to get session:', error);
  }

  return null;
}

// POST /api/auth/avatar - Upload avatar image
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Use tenant ID from storefront middleware (same pattern as profile/route.ts)
    // Do NOT use auth-bff's tenant_id — it may differ from customers-service tenant_id.
    // Let the customers-service middleware extract the correct tenant from the JWT.
    const tenantId = request.headers.get('X-Tenant-ID') || '';
    const customerId = auth.customerId;

    // For GCS storage path, use tenant from JWT (via auth-bff) as folder hint
    // This is only for organizing files in GCS, not for DB lookups
    const storageTenantId = auth.tenantId || tenantId || 'unknown';

    // Build storage path: marketplace/{tenantId}/customers/{customerId}/avatar/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${timestamp}_${sanitizedFilename}`;
    const storagePath = `marketplace/${storageTenantId}/customers/${customerId}/avatar/${uniqueFilename}`;

    // Build tags for metadata
    const tags = [
      `tenantId:${storageTenantId}`,
      `customerId:${customerId}`,
      `type:avatar`,
    ].join(',');

    // Create FormData for document-service (same pattern as admin product images)
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket', PUBLIC_BUCKET);
    uploadFormData.append('path', storagePath);
    uploadFormData.append('tags', tags);
    uploadFormData.append('isPublic', 'true');

    // Upload to document-service
    const uploadResponse = await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'x-jwt-claim-tenant-id': storageTenantId,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('[Avatar API] Upload error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Construct deterministic public URL (same as admin product images)
    // Format: https://storage.googleapis.com/{bucket}/{path}
    const avatarUrl = `${PUBLIC_BUCKET_URL}/${storagePath}`;

    // Update customer record with new avatarUrl (same header pattern as profile/route.ts)
    const patchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service': 'storefront',
      'X-User-Id': customerId,
    };
    // Only send X-Tenant-ID if storefront middleware provided it (custom domain flow)
    // For subdomain routing, let the customers-service extract tenant from the JWT
    if (tenantId) {
      patchHeaders['X-Tenant-ID'] = tenantId;
    }
    if (auth.token) {
      patchHeaders['Authorization'] = auth.token;
    }

    const patchResponse = await fetch(
      `${CUSTOMERS_BASE_URL}/api/v1/storefront/customers/${customerId}`,
      {
        method: 'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({ avatarUrl }),
      }
    );

    if (!patchResponse.ok) {
      console.error('[Avatar API] Failed to update customer record:', await patchResponse.text());
      // Still return the URL since the upload succeeded
    }

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
    });
  } catch (error) {
    console.error('[Avatar API] POST exception:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
