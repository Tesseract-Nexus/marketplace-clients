import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  getAuthorizedHeaders,
  createAuthorizationErrorResponse,
} from '@/lib/security/authorization';
import { secureLog } from '@/lib/security/pii-masking';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(TICKETS_SERVICE_URL, `/tickets/${id}`, request);
}

// PUT /api/tickets/[id] - Update ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Require admin portal access for updating tickets
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

    const response = await fetch(`${TICKETS_SERVICE_URL}/tickets/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { code: 'UPDATE_FAILED', message: 'Failed to update ticket' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    secureLog.error('Update error', { ticketId: (await params).id });
    return handleApiError(error, 'PUT ticket');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Require admin portal access for deleting tickets
  const authResult = requireAdminPortalAccess(request);
  if (!authResult.authorized) {
    return createAuthorizationErrorResponse(authResult.error!);
  }

  try {
    const { id } = await params;

    // Get properly authorized headers - uses actual user role
    const headers = getAuthorizedHeaders(request);
    headers['Content-Type'] = 'application/json';

    const response = await fetch(`${TICKETS_SERVICE_URL}/tickets/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: data.error || { code: 'DELETE_FAILED', message: 'Failed to delete ticket' } },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    secureLog.error('Delete error', { ticketId: (await params).id });
    return handleApiError(error, 'DELETE ticket');
  }
}
