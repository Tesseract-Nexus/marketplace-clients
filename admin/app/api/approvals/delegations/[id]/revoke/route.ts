import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  createAuthorizationErrorResponse,
  getAuthorizedHeaders,
} from '@/lib/security/authorization';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/approvals/delegations/:id/revoke
 * Revoke a delegation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const response = await proxyToBackend(APPROVAL_SERVICE_URL, `delegations/${id}/revoke`, {
      method: 'POST',
      body,
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST revoke delegation');
  }
}
