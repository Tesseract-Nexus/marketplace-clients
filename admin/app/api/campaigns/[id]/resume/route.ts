import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const MARKETING_SERVICE_URL = getServiceUrl('MARKETING');

// Resume a paused campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await getProxyHeaders(request) as Record<string, string>;

    const response = await fetch(`${MARKETING_SERVICE_URL}/campaigns/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'SENDING' }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'POST campaigns/resume');
  }
}
