import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const QR_SERVICE_URL = getServiceUrl('QR');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = new URL(`${QR_SERVICE_URL}/qr/image`);
    url.search = searchParams.toString();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await getProxyHeaders(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: response.statusText },
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    // Return the image blob directly
    const imageBuffer = await response.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /qr/image');
  }
}
