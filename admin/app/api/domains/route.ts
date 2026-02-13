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

  // Forward authorization if present
  const authorization = proxyHeaders['Authorization'];
  if (authorization) headers['Authorization'] = authorization;

  return headers;
}

// GET /api/domains - List domains
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: forwardHeaders,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch domains' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/domains - Create domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains`,
      {
        method: 'POST',
        headers: forwardHeaders,
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create domain' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
