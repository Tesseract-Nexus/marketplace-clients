import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl, getAuthHeaders } from '@/lib/config/api';

const TAX_SERVICE_URL = getServiceUrl('TAX');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`${TAX_SERVICE_URL}/exemptions/${id}`, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching exemption certificate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exemption certificate' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const response = await fetch(`${TAX_SERVICE_URL}/exemptions/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating exemption certificate:', error);
    return NextResponse.json(
      { error: 'Failed to update exemption certificate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`${TAX_SERVICE_URL}/exemptions/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting exemption certificate:', error);
    return NextResponse.json(
      { error: 'Failed to delete exemption certificate' },
      { status: 500 }
    );
  }
}
