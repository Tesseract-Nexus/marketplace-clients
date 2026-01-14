import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const ANALYTICS_SERVICE_URL = getServiceUrl('ANALYTICS');
const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

export async function GET(request: NextRequest) {
  const headers = getProxyHeaders(request);
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const dateQuery = queryString ? `?${queryString}` : '?preset=last30days';

  try {
    // Try to get analytics from the analytics service first
    const analyticsRes = await fetch(
      `${ANALYTICS_SERVICE_URL}/analytics/sales${dateQuery}`,
      {
        headers,
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (analyticsRes.ok) {
      const salesData = await analyticsRes.json();

      // Transform sales analytics into order analytics format
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalOrders: salesData.totalOrders || 0,
            pendingOrders: salesData.pendingOrders || 0,
            processingOrders: salesData.processingOrders || 0,
            shippedOrders: salesData.shippedOrders || 0,
            deliveredOrders: salesData.deliveredOrders || 0,
            cancelledOrders: salesData.cancelledOrders || 0,
            totalRevenue: salesData.totalRevenue || 0,
            averageOrderValue: salesData.averageOrderValue || 0,
          },
        },
      });
    }

    // Fallback: Calculate from orders if analytics service is unavailable
    const ordersRes = await fetch(
      `${ORDERS_SERVICE_URL}/orders?limit=1000`,
      { headers }
    );

    if (!ordersRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order data' },
        { status: ordersRes.status }
      );
    }

    const ordersData = await ordersRes.json();
    const orders = ordersData.data || [];

    // Calculate analytics from orders
    const totalOrders = ordersData.pagination?.total || orders.length;
    const totalRevenue = orders
      .filter((o: { paymentStatus?: string }) => o.paymentStatus === 'PAID')
      .reduce((sum: number, o: { total?: string | number }) => sum + (parseFloat(String(o.total)) || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = {
      pendingOrders: orders.filter((o: { status?: string }) =>
        o.status === 'PLACED' || o.status === 'PENDING'
      ).length,
      processingOrders: orders.filter((o: { status?: string }) =>
        o.status === 'PROCESSING' || o.status === 'CONFIRMED'
      ).length,
      shippedOrders: orders.filter((o: { fulfillmentStatus?: string }) =>
        o.fulfillmentStatus === 'DISPATCHED' ||
        o.fulfillmentStatus === 'IN_TRANSIT' ||
        o.fulfillmentStatus === 'OUT_FOR_DELIVERY' ||
        o.fulfillmentStatus === 'SHIPPED'
      ).length,
      deliveredOrders: orders.filter((o: { fulfillmentStatus?: string; status?: string }) =>
        o.fulfillmentStatus === 'DELIVERED' || o.status === 'COMPLETED'
      ).length,
      cancelledOrders: orders.filter((o: { status?: string }) =>
        o.status === 'CANCELLED'
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          ...statusCounts,
          totalRevenue,
          averageOrderValue,
        },
      },
    });
  } catch (error) {
    console.error('[Orders Analytics] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order analytics' },
      { status: 500 }
    );
  }
}
