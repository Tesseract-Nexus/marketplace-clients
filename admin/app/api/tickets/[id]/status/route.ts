import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import {
  requireAdminPortalAccess,
  getAuthorizedHeaders,
  createAuthorizationErrorResponse,
} from '@/lib/security/authorization';
import { secureLog } from '@/lib/security/pii-masking';
import { handleApiError } from '@/lib/utils/api-route-handler';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

// PUT /api/tickets/[id]/status - Update ticket status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Require admin portal access for updating ticket status
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

    const response = await fetch(`${TICKETS_SERVICE_URL}/tickets/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: 'UPDATE_FAILED',
            message: 'Failed to update ticket status',
          },
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    secureLog.error('Status update error', { ticketId: (await params).id });
    return handleApiError(error, 'PUT ticket status');
  }
}
