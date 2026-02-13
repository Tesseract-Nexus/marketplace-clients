import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

// Helper to forward trusted headers
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

// GET /api/domains/[id] - Get domain details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid domain ID' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);

    // Check for sub-resource requests (dns, ssl, health, activities)
    const subResource = searchParams.get('resource');

    let endpoint = `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}`;
    if (subResource) {
      endpoint = `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}/${subResource}`;
    }

    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: forwardHeaders,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch domain' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/domains/[id] - Update domain
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid domain ID' }, { status: 400 });
    }
    const body = await request.json();
    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}`,
      {
        method: 'PATCH',
        headers: forwardHeaders,
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update domain' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/domains/[id] - Delete domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {

      return NextResponse.json({ success: false, message: 'Invalid domain ID' }, { status: 400 });

    }
    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}`,
      {
        method: 'DELETE',
        headers: forwardHeaders,
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.error || 'Failed to delete domain' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/domains/[id] - Verify domain (POST with action)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid domain ID' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'verify') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    const forwardHeaders = await getForwardHeaders(request);
    if (!forwardHeaders) {
      return NextResponse.json({ success: false, message: 'Missing tenant context' }, { status: 401 });
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}/verify`,
      {
        method: 'POST',
        headers: forwardHeaders,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to verify domain' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
