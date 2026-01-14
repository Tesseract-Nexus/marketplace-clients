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
 * POST /api/approvals/delegations
 * Create a new delegation
 */
export async function POST(request: NextRequest) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const body = await request.json();

    const response = await proxyToBackend(APPROVAL_SERVICE_URL, 'delegations', {
      method: 'POST',
      body,
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST delegation');
  }
}
