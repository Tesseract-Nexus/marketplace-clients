import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const GIFT_CARDS_SERVICE_URL = config.api.giftCardsService;

/**
 * POST /api/gift-cards/redeem
 * Redeem a gift card (deduct balance)
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.code || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: code, amount' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${GIFT_CARDS_SERVICE_URL}/gift-cards/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          code: body.code.trim().toUpperCase(),
          amount: body.amount,
          orderId: body.orderId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Gift Cards API] Failed to redeem:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to redeem gift card' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      newBalance: data.data?.currentBalance || 0,
      message: data.message || 'Gift card redeemed successfully',
    });
  } catch (error) {
    console.error('[Gift Cards API] Service unavailable:', error);
    return NextResponse.json(
      { error: 'Gift card service is currently unavailable. Please try again later.' },
      { status: 503 }
    );
  }
}
