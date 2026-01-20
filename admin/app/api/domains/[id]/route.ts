import { NextRequest, NextResponse } from 'next/server';

const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.global.svc.cluster.local:8093';

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

// GET /api/domains/[id] - Get domain details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Check for sub-resource requests (dns, ssl, health, activities)
    const subResource = searchParams.get('resource');

    let endpoint = `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}`;
    if (subResource) {
      endpoint = `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}/${subResource}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getForwardHeaders(request),
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
    const body = await request.json();

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}`,
      {
        method: 'PATCH',
        headers: getForwardHeaders(request),
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

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}`,
      {
        method: 'DELETE',
        headers: getForwardHeaders(request),
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'verify') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains/${id}/verify`,
      {
        method: 'POST',
        headers: getForwardHeaders(request),
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
