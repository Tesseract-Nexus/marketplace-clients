import { NextRequest, NextResponse } from 'next/server';

const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

// Helper to forward headers
function getForwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');

  if (tenantId) headers['x-tenant-id'] = tenantId;
  if (userId) headers['x-user-id'] = userId;

  const authorization = request.headers.get('authorization');
  if (authorization) headers['Authorization'] = authorization;

  return headers;
}

// POST /api/domains/validate - Validate domain before creating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
        headers: getForwardHeaders(request),
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
