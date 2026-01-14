import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config/api';

// GET /api/audit-logs/retention - Get retention settings
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const response = await fetch(`${API_CONFIG.SERVICES.AUDIT}/audit-logs/retention`, {
      headers: {
        'X-Tenant-ID': tenantId,
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching retention settings:', error);
    return NextResponse.json({ error: 'Failed to fetch retention settings' }, { status: 500 });
  }
}

// PUT /api/audit-logs/retention - Update retention settings
export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(`${API_CONFIG.SERVICES.AUDIT}/audit-logs/retention`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating retention settings:', error);
    return NextResponse.json({ error: 'Failed to update retention settings' }, { status: 500 });
  }
}
