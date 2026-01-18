import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

/**
 * POST /api/products/import
 * Import products from a file (CSV/Excel)
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest) {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'] || '';
    const userId = headers['x-jwt-claim-sub'] || '';
    const userEmail = headers['x-jwt-claim-email'] || '';
    const authorization = headers['Authorization'] || '';

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

    // Forward to the products service with Istio JWT claim headers
    // Products-service expects x-jwt-claim-* headers for authentication
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        // Forward Istio JWT claim headers (required by products-service)
        'x-jwt-claim-tenant-id': tenantId,
        'x-jwt-claim-sub': userId,
        'x-jwt-claim-email': userEmail,
        ...(authorization ? { 'Authorization': authorization } : {}),
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
