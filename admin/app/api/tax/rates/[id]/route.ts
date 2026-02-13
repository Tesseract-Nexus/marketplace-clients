import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl, getAuthHeaders } from '@/lib/config/api';

const TAX_SERVICE_URL = getServiceUrl('TAX');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidId(id)) {

    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

  }

  try {
    const body = await request.json();
    const response = await fetch(`${TAX_SERVICE_URL}/rates/${id}`, {
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
    console.error('Error updating tax rate:', error);
    return NextResponse.json(
      { error: 'Failed to update tax rate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidId(id)) {

    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

  }

  try {
    const response = await fetch(`${TAX_SERVICE_URL}/rates/${id}`, {
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
    console.error('Error deleting tax rate:', error);
    return NextResponse.json(
      { error: 'Failed to delete tax rate' },
      { status: 500 }
    );
  }
}
