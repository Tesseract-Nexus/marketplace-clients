import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const ANALYTICS_SERVICE_URL = getServiceUrl('ANALYTICS');

export async function GET(request: NextRequest) {
  const headers = await getProxyHeaders(request);
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const dateQuery = queryString ? `?${queryString}` : '?preset=last30days';

  try {
    // Fetch all analytics in parallel for overview
    const [salesRes, inventoryRes, customersRes, financialRes] = await Promise.all([
      fetch(`${ANALYTICS_SERVICE_URL}/analytics/sales${dateQuery}`, { headers }),
      fetch(`${ANALYTICS_SERVICE_URL}/analytics/inventory`, { headers }),
      fetch(`${ANALYTICS_SERVICE_URL}/analytics/customers${dateQuery}`, { headers }),
      fetch(`${ANALYTICS_SERVICE_URL}/analytics/financial${dateQuery}`, { headers }),
    ]);

    const sales = salesRes.ok ? await salesRes.json() : null;
    const inventory = inventoryRes.ok ? await inventoryRes.json() : null;
    const customers = customersRes.ok ? await customersRes.json() : null;
    const financial = financialRes.ok ? await financialRes.json() : null;

    return NextResponse.json({
      success: true,
      data: {
        sales,
        inventory,
        customers,
        financial,
      },
    });
  } catch (error) {
    console.error('[Analytics Overview] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
