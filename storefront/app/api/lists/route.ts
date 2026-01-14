import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// Helper to decode JWT payload (base64url decode)
function decodeJwtPayload(token: string): { sub?: string; customer_id?: string } | null {
  try {
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// GET /api/lists - Get all lists for a customer
// SECURITY: Customer ID must come from authenticated token, not query params
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const authHeader = request.headers.get('authorization');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    // SECURITY: Require Authorization header - customer ID from query params is vulnerable to IDOR attacks
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Extract customer ID from JWT token to prevent IDOR attacks
    const tokenPayload = decodeJwtPayload(authHeader);
    const customerId = tokenPayload?.sub || tokenPayload?.customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${customerId}/lists`,
      {
        headers: {
          'X-Tenant-ID': tenantId,
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

// POST /api/lists - Create a new list
// SECURITY: Customer ID must come from authenticated token, not query params
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    // SECURITY: Require Authorization header - customer ID from query params is vulnerable to IDOR attacks
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Extract customer ID from JWT token to prevent IDOR attacks
    const tokenPayload = decodeJwtPayload(authHeader);
    const customerId = tokenPayload?.sub || tokenPayload?.customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${customerId}/lists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    );
  }
}
