/**
 * Avatar Upload API Route
 *
 * Handles profile picture uploads for authenticated customers.
 * Uploads to document-service (GCS) and updates the customer record.
 */

import { NextRequest, NextResponse } from 'next/server';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8089/api/v1';
const CUSTOMERS_BASE_URL = CUSTOMERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:8082';

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

    const tenantId = auth.tenantId || request.headers.get('X-Tenant-ID') || '';
    const customerId = auth.customerId;
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const sanitizedFilename = `${timestamp}_avatar.${ext}`;
    const gcsPath = `marketplace/${tenantId}/customers/${customerId}/avatar/${sanitizedFilename}`;

    // Upload to document-service
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('path', gcsPath);
    uploadForm.append('bucket', 'marketplace-devtest-public-au');
    uploadForm.append('public', 'true');

    const uploadResponse = await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      body: uploadForm,
      headers: {
        'X-Tenant-ID': tenantId,
        ...(auth.token && { 'Authorization': auth.token }),
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Avatar API] Upload error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    const uploadData = await uploadResponse.json();
    const avatarUrl = uploadData.url || uploadData.data?.url ||
      `https://storage.googleapis.com/marketplace-devtest-public-au/${gcsPath}`;

    // Update customer record with new avatarUrl
    const patchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service': 'storefront',
      'X-User-Id': customerId,
      'X-Tenant-ID': tenantId,
    };
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
