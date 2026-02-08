import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { paymentPlans } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');

  try {
    const db = await getDb();
    const result = await db.query.paymentPlans.findMany({
      where: eq(paymentPlans.active, true),
      orderBy: [asc(paymentPlans.sortOrder)],
      with: {
        features: {
          orderBy: (features, { asc }) => [asc(features.sortOrder)],
        },
        regionalPricing: countryCode
          ? {
              where: (pricing, { eq }) => eq(pricing.countryCode, countryCode),
            }
          : undefined,
      },
    });

    return NextResponse.json({
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching payment plans:', error);

    // Fallback data
    const fallbackPlans = [
      {
        name: 'Free Trial',
        slug: 'free-trial',
        price: '0',
        currency: 'INR',
        billingCycle: 'monthly',
        trialDays: 365,
        tagline: '12 months free, then ₹499/mo',
        features: [
          { feature: 'Unlimited products' },
          { feature: 'Custom domain' },
          { feature: '24/7 support' },
        ],
      },
    ];

    return NextResponse.json({
      data: fallbackPlans,
      source: 'fallback',
    });
  }
}
