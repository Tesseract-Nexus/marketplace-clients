import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { paymentPlans, planFeatures } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single payment plan with features
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.paymentPlans.findFirst({
      where: eq(paymentPlans.id, id),
      with: {
        features: {
          orderBy: [asc(planFeatures.sortOrder)],
        },
      },
    });

    if (!result) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching payment plan:', error);
    return NextResponse.json({ error: 'Failed to fetch payment plan' }, { status: 500 });
  }
}

// PUT - Update payment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const body = await request.json();
    const { name, slug, price, currency, billingCycle, trialDays, description, tagline, featured, sortOrder, active } = body;

    const [updated] = await db
      .update(paymentPlans)
      .set({
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(billingCycle !== undefined && { billingCycle }),
        ...(trialDays !== undefined && { trialDays }),
        ...(description !== undefined && { description }),
        ...(tagline !== undefined && { tagline }),
        ...(featured !== undefined && { featured }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
      })
      .where(eq(paymentPlans.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating payment plan:', error);
    return NextResponse.json({ error: 'Failed to update payment plan' }, { status: 500 });
  }
}

// DELETE - Delete payment plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const [deleted] = await db
      .delete(paymentPlans)
      .where(eq(paymentPlans.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting payment plan:', error);
    return NextResponse.json({ error: 'Failed to delete payment plan' }, { status: 500 });
  }
}
