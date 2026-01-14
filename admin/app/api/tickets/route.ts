import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost, proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  getAuthorizedHeaders,
  createAuthorizationErrorResponse,
} from '@/lib/security/authorization';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

export async function GET(request: NextRequest) {
  // SECURITY: Require admin portal access for viewing all tickets
  const authResult = requireAdminPortalAccess(request);
  if (!authResult.authorized) {
    return createAuthorizationErrorResponse(authResult.error!);
  }

  try {
    const { searchParams } = new URL(request.url);

    // Get properly authorized headers - uses actual user role
    const headers = getAuthorizedHeaders(request);

    const response = await proxyToBackend(TICKETS_SERVICE_URL, 'tickets', {
      method: 'GET',
      params: searchParams,
      headers: headers,
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'GET tickets');
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: Require admin portal access for creating tickets
  const authResult = requireAdminPortalAccess(request);
  if (!authResult.authorized) {
    return createAuthorizationErrorResponse(authResult.error!);
  }

  return proxyPost(TICKETS_SERVICE_URL, 'tickets', request);
}
