import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import {
  requireAdminPortalAccess,
  createAuthorizationErrorResponse,
} from '@/lib/security/authorization';
import { secureLog } from '@/lib/security/pii-masking';
import { handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

// POST /api/tickets/[id]/comments - Add comment to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Require admin portal access for adding comments
  const authResult = requireAdminPortalAccess(request);
  if (!authResult.authorized) {
    return createAuthorizationErrorResponse(authResult.error!);
  }

  try {
    const { id } = await params;

    // Get properly authorized headers with BFF session token support
    const headers = await getProxyHeaders(request) as Record<string, string>;
    headers['Content-Type'] = 'application/json';

    const body = await request.json();

    const response = await fetch(`${TICKETS_SERVICE_URL}/tickets/${id}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { code: 'ADD_COMMENT_FAILED', message: 'Failed to add comment' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    secureLog.error('Add comment error', { ticketId: (await params).id });
    return handleApiError(error, 'POST ticket comment');
  }
}
