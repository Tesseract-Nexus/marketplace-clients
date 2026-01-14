import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedHeaders } from '@/lib/security/authorization';
import { getBFFSession } from '@/app/api/lib/auth-helper';

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:8082';

export async function POST(request: NextRequest) {
  try {
    // Get authorized headers from request (may include JWT-decoded email)
    const headers = getAuthorizedHeaders(request);
    const tenantId = headers['X-Tenant-ID'] || request.headers.get('X-Vendor-ID') || request.headers.get('x-vendor-id') || '';

    // Get user info from BFF session if email not available from headers
    // This is needed when the client uses session cookies instead of JWT
    let userEmail = headers['X-User-Email'] || '';
    let userId = headers['X-User-ID'] || '';

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

    const targetUrl = `${PRODUCTS_SERVICE_URL}/products/import`;
    console.log(`[Import] Forwarding to: ${targetUrl}`);
    console.log(`[Import] TenantID: ${tenantId}, UserID: ${userId}, Email: ${userEmail}`);

    // Forward to the products service with all user context headers
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-Vendor-ID': tenantId,
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
        'X-User-Email': userEmail,
        ...(headers['Authorization'] ? { 'Authorization': headers['Authorization'] } : {}),
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
