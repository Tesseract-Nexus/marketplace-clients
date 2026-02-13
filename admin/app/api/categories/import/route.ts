import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * POST /api/categories/import
 * Import categories from a file (CSV/Excel)
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest) {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }
    const userId = headers['x-jwt-claim-sub'] || '';
    const userEmail = headers['x-jwt-claim-email'] || '';
    const authorization = headers['Authorization'] || '';

    const formData = await request.formData();

    // Forward to the categories service with Istio JWT claim headers
    const response = await fetch(`${CATEGORIES_SERVICE_URL}/categories/import`, {
      method: 'POST',
      headers: {
        // Forward Istio JWT claim headers for service authentication
        'x-jwt-claim-tenant-id': tenantId,
        'x-jwt-claim-sub': userId,
        'x-jwt-claim-email': userEmail,
        ...(authorization ? { 'Authorization': authorization } : {}),
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
    console.error('Error importing categories:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to import categories' } },
      { status: 500 }
    );
  }
}
