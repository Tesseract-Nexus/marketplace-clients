import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedHeaders } from '@/lib/security/authorization';
import { getBFFSession } from '@/app/api/lib/auth-helper';

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8084';

export async function POST(request: NextRequest) {
  try {
    // Get authorized headers including user context for RBAC
    const headers = getAuthorizedHeaders(request);
    const tenantId = headers['X-Tenant-ID'] || request.headers.get('X-Vendor-ID') || request.headers.get('x-vendor-id') || '';

    // Get user info from BFF session if not available from headers
    let userEmail = headers['X-User-Email'] || '';
    let userId = headers['X-User-ID'] || '';

    if (!userEmail || !userId) {
      const session = await getBFFSession();
      if (session?.authenticated && session.user) {
        if (!userEmail) userEmail = session.user.email;
        if (!userId) userId = session.user.id;
      }
    }

    const formData = await request.formData();

    // Forward to the inventory service with all user context headers
    const response = await fetch(`${INVENTORY_SERVICE_URL}/warehouses/import`, {
      method: 'POST',
      headers: {
        'X-Vendor-ID': tenantId,
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
        'X-User-Email': userEmail,
        ...(headers['Authorization'] ? { 'Authorization': headers['Authorization'] } : {}),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { message: 'Import failed' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error importing warehouses:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to import warehouses' } },
      { status: 500 }
    );
  }
}
