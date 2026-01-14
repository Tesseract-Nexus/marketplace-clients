import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/gift-cards/templates
 * Get available gift card templates
 *
 * Note: Templates are currently hardcoded as the gift cards service
 * doesn't have a templates endpoint. This provides default templates
 * that can be customized per tenant in the future.
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  // Return default templates - in the future these could come from the gift-cards-service
  const templates = [
    {
      id: 'default-1',
      name: 'Classic Gift Card',
      description: 'A timeless gift for any occasion',
      amounts: [25, 50, 100, 150, 200],
      allowCustomAmount: true,
      minAmount: 10,
      maxAmount: 500,
    },
  ];

  return NextResponse.json(templates);
}
