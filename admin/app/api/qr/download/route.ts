import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const QR_SERVICE_URL = getServiceUrl('QR');

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'qrcode.png';

    const body = await request.json().catch(() => undefined);
    const url = new URL(`${QR_SERVICE_URL}/qr/download`);
    if (filename) {
      url.searchParams.set('filename', filename);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: getProxyHeaders(request),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: response.statusText },
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    // Return the image blob with download headers
    const imageBuffer = await response.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error, 'POST /qr/download');
  }
}
