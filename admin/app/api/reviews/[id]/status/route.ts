import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import {
  requireAdminPortalAccess,
  getAuthorizedHeaders,
  createAuthorizationErrorResponse,
} from '@/lib/security/authorization';
import { secureLog } from '@/lib/security/pii-masking';
import { handleApiError } from '@/lib/utils/api-route-handler';

const REVIEWS_SERVICE_URL = getServiceUrl('REVIEWS');

// PUT /api/reviews/[id]/status - Update review status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Require admin portal access for updating review status
  const authResult = requireAdminPortalAccess(request);
  if (!authResult.authorized) {
    return createAuthorizationErrorResponse(authResult.error!);
  }

  try {
    const { id } = await params;

    // Get properly authorized headers - uses actual user role
    const headers = getAuthorizedHeaders(request);
    headers['Content-Type'] = 'application/json';

    const body = await request.json();

    const response = await fetch(`${REVIEWS_SERVICE_URL}/reviews/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { code: 'UPDATE_FAILED', message: 'Failed to update review status' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    secureLog.error('Update status error', { reviewId: (await params).id });
    return handleApiError(error, 'PUT review status');
  }
}
