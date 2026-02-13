import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/orders/[orderId]/status - Update order status
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    return NextResponse.json(
      {
        error: `Order status updates are not supported from storefront for order ${orderId}. Use payment/cancel flows.`,
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('[BFF] Failed to update order status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
