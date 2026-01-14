import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl, getAuthHeaders } from '@/lib/config/api';

const TAX_SERVICE_URL = getServiceUrl('TAX');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`${TAX_SERVICE_URL}/jurisdictions/${id}/rates`, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax rates' },
      { status: 500 }
    );
  }
}
