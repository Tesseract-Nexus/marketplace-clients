import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// GET /api/shipping/settings - Get shipping settings including warehouse address
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || '';
  const storefrontId = request.headers.get('X-Storefront-ID') || '';

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  try {
    // Note: shippingService URL ends with /api/v1, but the actual endpoint is /api/shipping-settings
    // Strip /v1 and call /shipping-settings to get /api/shipping-settings
    const baseUrl = config.api.shippingService.replace(/\/api\/v1$/, '');
    const url = `${baseUrl}/api/shipping-settings`;
    console.log('[BFF Shipping] Fetching settings for tenant:', tenantId, 'URL:', url);

    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[BFF Shipping] Settings error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.error || 'Failed to fetch shipping settings',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[BFF Shipping] Got settings:', JSON.stringify(data, null, 2));

    // The response is ShippingSettingsResponse with a nested warehouse object
    const settings = data.data || data;
    const warehouse = settings.warehouse?.postalCode ? settings.warehouse : null;

    return NextResponse.json({
      success: true,
      data: {
        warehouse,
        freeShippingEnabled: settings.freeShippingEnabled,
        freeShippingMinimum: settings.freeShippingMinimum,
        handlingFee: settings.handlingFee,
      },
    });
  } catch (error) {
    console.error('[BFF Shipping] Failed to fetch settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shipping settings',
      },
      { status: 500 }
    );
  }
}
