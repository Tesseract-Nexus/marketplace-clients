import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

/**
 * Activate staff account
 *
 * This is a PUBLIC endpoint - users access it before login (no JWT).
 * Staff-service handles this without requiring tenant context because
 * the activation token itself contains the tenant association.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const url = `${STAFF_SERVICE_URL}/auth/activate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Activate] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to activate account' },
      { status: 500 }
    );
  }
}
