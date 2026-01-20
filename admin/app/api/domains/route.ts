import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.global.svc.cluster.local:8093';

// Helper to forward headers
function getForwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward tenant and user headers
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');

  if (tenantId) headers['x-tenant-id'] = tenantId;
  if (userId) headers['x-user-id'] = userId;

  // Forward authorization if present
  const authorization = request.headers.get('authorization');
  if (authorization) headers['Authorization'] = authorization;

  return headers;
}

// GET /api/domains - List domains
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: getForwardHeaders(request),
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

    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains`,
      {
        method: 'POST',
        headers: getForwardHeaders(request),
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
