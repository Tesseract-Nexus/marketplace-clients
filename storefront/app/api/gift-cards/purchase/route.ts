import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const GIFT_CARDS_SERVICE_URL = config.api.giftCardsService;

/**
 * POST /api/gift-cards/purchase
 * Purchase a gift card
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

    // Transform storefront purchase request to gift-cards-service format
    const createRequest = {
      initialBalance: body.amount,
      currencyCode: 'USD',
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      senderName: body.senderName,
      message: body.message,
    };

    const response = await fetch(
      `${GIFT_CARDS_SERVICE_URL}/gift-cards/purchase`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(createRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Gift Cards API] Failed to purchase:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to purchase gift card' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response to match frontend expectations
    return NextResponse.json({
      success: true,
      giftCard: data.data,
      message: data.message || 'Gift card purchased successfully',
    });
  } catch (error) {
    console.error('[Gift Cards API] Service unavailable:', error);
    return NextResponse.json(
      { error: 'Gift card service is currently unavailable. Please try again later.' },
      { status: 503 }
    );
  }
}
