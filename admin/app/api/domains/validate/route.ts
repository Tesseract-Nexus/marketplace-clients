import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

// Helper to forward trusted headers from JWT claims/BFF context
async function getForwardHeaders(request: NextRequest): Promise<Record<string, string> | null> {
  const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
  const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
  if (!tenantId) {
    return null;
  }

  const userId = proxyHeaders['x-jwt-claim-sub'];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
  };
  if (userId) headers['x-user-id'] = userId;

  const authorization = proxyHeaders['Authorization'];
  if (authorization) headers['Authorization'] = authorization;

  return headers;
}

// POST /api/domains/validate - Validate domain before creating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    if (!body.domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/validate`,
      {
        method: 'POST',
        headers: forwardHeaders,
        body: JSON.stringify({
          domain: body.domain,
          check_dns: body.check_dns || false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to validate domain' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error validating domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
