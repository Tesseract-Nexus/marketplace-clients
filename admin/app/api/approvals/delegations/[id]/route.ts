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
 * GET /api/approvals/delegations/:id
 * Get a single delegation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const { id } = await params;
    const response = await proxyToBackend(APPROVAL_SERVICE_URL, `delegations/${id}`, {
      method: 'GET',
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'GET delegation');
  }
}
