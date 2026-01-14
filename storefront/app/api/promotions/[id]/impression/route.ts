import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MARKETING_SERVICE_URL = config.api.marketingService;

/**
 * POST /api/promotions/[id]/impression
 * Track promotion impression
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    await fetch(
      `${MARKETING_SERVICE_URL}/storefront/promotions/${id}/impression`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail - tracking is non-critical
    console.error('[Promotions API] Error tracking impression:', error);
    return NextResponse.json({ success: true });
  }
}
