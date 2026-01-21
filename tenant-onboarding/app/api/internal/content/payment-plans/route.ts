import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { paymentPlans, planFeatures } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all payment plans with features
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.paymentPlans.findMany({
      orderBy: [asc(paymentPlans.sortOrder)],
      with: {
        features: {
          orderBy: [asc(planFeatures.sortOrder)],
        },
      },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching payment plans:', error);
    return NextResponse.json({ error: 'Failed to fetch payment plans' }, { status: 500 });
  }
}

// POST - Create new payment plan
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { name, slug, price, currency, billingCycle, trialDays, description, tagline, featured, sortOrder } = body;

    if (!name || !slug || price === undefined || !billingCycle) {
      return NextResponse.json(
        { error: 'Name, slug, price, and billingCycle are required' },
        { status: 400 }
      );
    }

    const [newPlan] = await db
      .insert(paymentPlans)
      .values({
        name,
        slug,
        price,
        currency: currency || 'INR',
        billingCycle,
        trialDays: trialDays || 0,
        description,
        tagline,
        featured: featured || false,
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newPlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment plan:', error);
    return NextResponse.json({ error: 'Failed to create payment plan' }, { status: 500 });
  }
}
