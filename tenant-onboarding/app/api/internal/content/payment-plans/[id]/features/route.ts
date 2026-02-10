import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { planFeatures, paymentPlans } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List features for a payment plan
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

    const result = await db.query.planFeatures.findMany({
      where: eq(planFeatures.planId, id),
      orderBy: [asc(planFeatures.sortOrder)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    return NextResponse.json({ error: 'Failed to fetch plan features' }, { status: 500 });
  }
}

// POST - Add a feature to a payment plan
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
    const { feature, sortOrder, highlighted } = body;

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature text is required' },
        { status: 400 }
      );
    }

    const [newFeature] = await db
      .insert(planFeatures)
      .values({
        planId: id,
        feature,
        sortOrder: sortOrder || 0,
        highlighted: highlighted || false,
      })
      .returning();

    return NextResponse.json({ data: newFeature }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan feature:', error);
    return NextResponse.json({ error: 'Failed to create plan feature' }, { status: 500 });
  }
}
