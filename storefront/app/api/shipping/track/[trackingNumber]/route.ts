import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const { trackingNumber } = await params;
  const tenantId = request.headers.get('X-Tenant-ID') || '';
  const storefrontId = request.headers.get('X-Storefront-ID') || '';

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, error: 'Tracking number is required' },
      { status: 400 }
    );
  }

  try {
    // Strip /v1 from base URL - shipping service routes are at /api/* not /api/v1/*
    const baseUrl = config.api.shippingService.replace(/\/api\/v1$/, '');
    const response = await fetch(
      `${baseUrl}/api/track/${encodeURIComponent(trackingNumber)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: error.error || 'Failed to track shipment',
          message: error.message,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error('Failed to track shipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track shipment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
