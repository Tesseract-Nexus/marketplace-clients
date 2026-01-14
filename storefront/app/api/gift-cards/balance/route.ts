import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const GIFT_CARDS_SERVICE_URL = config.api.giftCardsService;

/**
 * GET /api/gift-cards/balance
 * Check gift card balance
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const code = request.nextUrl.searchParams.get('code');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Missing gift card code' }, { status: 400 });
    }

    // Gift cards service public endpoint for balance check
    const response = await fetch(
      `${GIFT_CARDS_SERVICE_URL}/gift-cards/balance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
        body: JSON.stringify({ code }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Gift Cards API] Failed to check balance:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Gift card not found' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response to match frontend expectations
    return NextResponse.json({
      success: true,
      balance: data.data?.balance || 0,
      currency: data.data?.currencyCode || 'USD',
      status: data.data?.status || 'UNKNOWN',
      expiresAt: data.data?.expiresAt,
    });
  } catch (error) {
    console.error('[Gift Cards API] Service unavailable:', error);
    return NextResponse.json(
      { error: 'Gift card service is currently unavailable. Please try again later.' },
      { status: 503 }
    );
  }
}
