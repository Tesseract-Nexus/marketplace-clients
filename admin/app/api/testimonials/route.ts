import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeadersAsync } from '@/lib/utils/api-route-handler';

const TENANT_ONBOARDING_URL = getServiceUrl('TENANT_ONBOARDING');

/**
 * GET - Get tenant's own testimonial
 */
export async function GET(request: NextRequest) {
  try {
    const headers = await getProxyHeadersAsync(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      console.error('[Testimonials API] Missing tenant ID - headers:', Object.keys(headers));
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const response = await fetch(`${TENANT_ONBOARDING_URL}/testimonials/submit`, {
      method: 'GET',
      headers: {
        ...headers,
        'X-Tenant-ID': tenantId,
      } as HeadersInit,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 });
  }
}

/**
 * POST - Submit new testimonial
 */
export async function POST(request: NextRequest) {
  try {
    const headers = await getProxyHeadersAsync(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const tenantName = request.headers.get('x-tenant-name');
    const tenantCompany = request.headers.get('x-tenant-company');

    if (!tenantId) {
      console.error('[Testimonials API] POST - Missing tenant ID - headers:', Object.keys(headers));
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${TENANT_ONBOARDING_URL}/testimonials/submit`, {
      method: 'POST',
      headers: {
        ...headers,
        'X-Tenant-ID': tenantId,
        ...(tenantName && { 'X-Tenant-Name': tenantName }),
        ...(tenantCompany && { 'X-Tenant-Company': tenantCompany }),
      } as HeadersInit,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }
}

/**
 * PUT - Update existing testimonial
 */
export async function PUT(request: NextRequest) {
  try {
    const headers = await getProxyHeadersAsync(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      console.error('[Testimonials API] PUT - Missing tenant ID - headers:', Object.keys(headers));
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${TENANT_ONBOARDING_URL}/testimonials/submit`, {
      method: 'PUT',
      headers: {
        ...headers,
        'X-Tenant-ID': tenantId,
      } as HeadersInit,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}
