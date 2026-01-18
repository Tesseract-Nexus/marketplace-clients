import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedHeaders } from '@/lib/security/authorization';
import { getBFFSession } from '@/app/api/lib/auth-helper';

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:8082';

/**
 * Extract and forward Istio JWT claim headers for service-to-service calls
 * Products-service requires x-jwt-claim-* headers (not legacy X-User-ID headers)
 */
function getIstioHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};

  // Forward all x-jwt-claim-* headers from Istio
  const istioHeaderPrefixes = ['x-jwt-claim-'];
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (istioHeaderPrefixes.some(prefix => lowerKey.startsWith(prefix))) {
      headers[key] = value;
    }
  });

  // Also forward Authorization header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  return headers;
}

export async function POST(request: NextRequest) {
  try {
    // Get Istio JWT claim headers for forwarding to products-service
    const istioHeaders = getIstioHeaders(request);

    // Get authorized headers for fallback context
    const legacyHeaders = getAuthorizedHeaders(request);
    const tenantId = legacyHeaders['X-Tenant-ID'] || request.headers.get('X-Vendor-ID') || request.headers.get('x-vendor-id') || '';

    // Get user info from BFF session if not available from Istio headers
    let userEmail = istioHeaders['x-jwt-claim-email'] || legacyHeaders['X-User-Email'] || '';
    let userId = istioHeaders['x-jwt-claim-sub'] || legacyHeaders['X-User-ID'] || '';

    if (!userEmail || !userId) {
      const session = await getBFFSession();
      if (session?.authenticated && session.user) {
        if (!userEmail) userEmail = session.user.email;
        if (!userId) userId = session.user.id;
      }
    }

    // Get the form data from the request
    const incomingFormData = await request.formData();

    // Reconstruct FormData to ensure proper Content-Type boundary
    const outgoingFormData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      if (value instanceof File) {
        // For files, we need to preserve the filename
        outgoingFormData.append(key, value, value.name);
        console.log(`[Import] File: ${value.name}, size: ${value.size}`);
      } else {
        outgoingFormData.append(key, value);
      }
    }

    // PRODUCTS_SERVICE_URL already includes /api/v1 (e.g., http://....:8080/api/v1)
    const targetUrl = `${PRODUCTS_SERVICE_URL}/products/import`;
    console.log(`[Import] Forwarding to: ${targetUrl}`);
    console.log(`[Import] TenantID: ${tenantId}, UserID: ${userId}, Email: ${userEmail}`);
    console.log(`[Import] Istio headers:`, Object.keys(istioHeaders));

    // Forward to the products service with Istio JWT claim headers
    // Products-service expects x-jwt-claim-* headers for authentication
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        // Forward Istio JWT claim headers (required by products-service)
        ...istioHeaders,
        // Ensure all required Istio claim headers are present
        // Products-service auth middleware requires: tenant-id, sub (userId), email
        'x-jwt-claim-tenant-id': istioHeaders['x-jwt-claim-tenant-id'] || tenantId,
        'x-jwt-claim-sub': istioHeaders['x-jwt-claim-sub'] || userId,
        'x-jwt-claim-email': istioHeaders['x-jwt-claim-email'] || userEmail,
      },
      body: outgoingFormData,
    });

    console.log(`[Import] Response status: ${response.status}`);

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    console.log(`[Import] Response content-type: ${contentType}`);

    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('[Import] Non-JSON response:', response.status, text);
      return NextResponse.json(
        { success: false, error: { message: `Import failed: ${text || 'Unknown error'}` } },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    console.log(`[Import] Response data:`, JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { message: 'Import failed' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to import products' } },
      { status: 500 }
    );
  }
}
