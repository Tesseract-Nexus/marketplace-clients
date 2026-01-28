import { NextRequest, NextResponse } from 'next/server';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// GET /api/cancellation/settings - Get cancellation settings for storefront
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId') || request.headers.get('X-Tenant-ID');
    const storefrontId = request.nextUrl.searchParams.get('storefrontId') || request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }

    const queryParams = new URLSearchParams();
    queryParams.set('tenantId', tenantId);
    if (storefrontId) {
      queryParams.set('storefrontId', storefrontId);
    }

    console.log('[BFF] Fetching cancellation settings for tenant:', tenantId, 'storefront:', storefrontId);

    const response = await fetch(
      `${ORDERS_SERVICE_URL}/api/v1/public/settings/cancellation?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Internal-Service': 'storefront',
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF] Cancellation settings error:', response.status, errorText);

      // Return default settings instead of failing completely
      if (response.status === 404) {
        console.log('[BFF] No cancellation settings found, returning defaults');
        return NextResponse.json({
          success: true,
          data: {
            enabled: true,
            requireReason: true,
            allowPartialCancellation: false,
            defaultFeeType: 'percentage',
            defaultFeeValue: 15,
            refundMethod: 'original_payment',
            autoRefundEnabled: true,
            nonCancellableStatuses: ['SHIPPED', 'DELIVERED'],
            windows: [
              { id: 'w1', name: 'Free cancellation', maxHoursAfterOrder: 6, feeType: 'percentage', feeValue: 0, description: 'Cancel within 6 hours at no charge.' },
              { id: 'w2', name: 'Low fee', maxHoursAfterOrder: 24, feeType: 'percentage', feeValue: 3, description: 'A small processing fee applies within 24 hours.' },
              { id: 'w3', name: 'Pre-delivery', maxHoursAfterOrder: 72, feeType: 'percentage', feeValue: 10, description: '10% fee for cancellations before delivery.' },
            ],
            cancellationReasons: [
              'I changed my mind',
              'Found a better price elsewhere',
              'Ordered by mistake',
              'Shipping is taking too long',
              'Payment issue',
              'Other reason',
            ],
            requireApprovalForPolicyChanges: false,
            policyText: '',
          },
        });
      }

      return NextResponse.json(
        { success: false, error: 'Failed to fetch cancellation settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[BFF] Cancellation settings fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] Failed to fetch cancellation settings:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
