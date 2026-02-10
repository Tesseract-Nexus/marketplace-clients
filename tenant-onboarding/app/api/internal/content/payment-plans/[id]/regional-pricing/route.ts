import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { regionalPricing, paymentPlans } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List regional pricing for a payment plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();

    const plan = await db.query.paymentPlans.findFirst({
      where: eq(paymentPlans.id, id),
    });

    if (!plan) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    const result = await db.query.regionalPricing.findMany({
      where: eq(regionalPricing.planId, id),
      orderBy: [asc(regionalPricing.countryCode)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching regional pricing:', error);
    return NextResponse.json({ error: 'Failed to fetch regional pricing' }, { status: 500 });
  }
}

// POST - Add regional pricing to a payment plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();

    const plan = await db.query.paymentPlans.findFirst({
      where: eq(paymentPlans.id, id),
    });

    if (!plan) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    const body = await request.json();
    const { countryCode, price, currency } = body;

    if (!countryCode || !price || !currency) {
      return NextResponse.json(
        { error: 'countryCode, price, and currency are required' },
        { status: 400 }
      );
    }

    const [newPricing] = await db
      .insert(regionalPricing)
      .values({
        planId: id,
        countryCode,
        price,
        currency,
      })
      .returning();

    return NextResponse.json({ data: newPricing }, { status: 201 });
  } catch (error) {
    console.error('Error creating regional pricing:', error);
    return NextResponse.json({ error: 'Failed to create regional pricing' }, { status: 500 });
  }
}
