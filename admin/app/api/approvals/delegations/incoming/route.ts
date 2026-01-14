import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  createAuthorizationErrorResponse,
  getAuthorizedHeaders,
} from '@/lib/security/authorization';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

/**
 * GET /api/approvals/delegations/incoming
 * List delegations granted to the current user
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const { searchParams } = new URL(request.url);

    const response = await proxyToBackend(APPROVAL_SERVICE_URL, 'delegations/incoming', {
      method: 'GET',
      params: searchParams,
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'GET incoming delegations');
  }
}
