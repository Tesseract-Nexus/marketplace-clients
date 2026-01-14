import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const GIFT_CARDS_SERVICE_URL = config.api.giftCardsService;

/**
 * POST /api/gift-cards/apply
 * Validate and apply a gift card at checkout
 * This validates the gift card without deducting the balance
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { error: 'Missing gift card code' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${GIFT_CARDS_SERVICE_URL}/gift-cards/apply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
        body: JSON.stringify({
          code: body.code.replace(/-/g, ''),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Gift Cards API] Failed to apply:', error);

      // Map error codes to user-friendly messages
      let errorMessage = 'Failed to apply gift card';
      if (error.error?.code === 'NOT_FOUND') {
        errorMessage = 'Gift card not found';
      } else if (error.error?.code === 'CARD_NOT_ACTIVE') {
        errorMessage = 'This gift card is not active';
      } else if (error.error?.code === 'CARD_EXPIRED') {
        errorMessage = 'This gift card has expired';
      } else if (error.error?.code === 'INSUFFICIENT_BALANCE') {
        errorMessage = 'This gift card has no remaining balance';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: errorMessage
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const giftCard = data.data;

    // Return validated gift card info
    return NextResponse.json({
      success: true,
      valid: true,
      giftCard: {
        code: giftCard.code,
        balance: giftCard.currentBalance,
        currency: giftCard.currencyCode || 'USD',
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
      },
      message: data.message || 'Gift card is valid',
    });
  } catch (error) {
    console.error('[Gift Cards API] Service unavailable:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: 'Gift card service is currently unavailable. Please try again later.'
      },
      { status: 503 }
    );
  }
}
