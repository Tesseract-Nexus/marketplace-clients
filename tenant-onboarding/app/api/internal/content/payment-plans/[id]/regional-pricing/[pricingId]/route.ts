import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { regionalPricing } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// PUT - Update a regional pricing entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pricingId: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { pricingId } = await params;

  try {
    const db = await getDb();
    const body = await request.json();
    const { countryCode, price, currency } = body;

    const updateData: Record<string, unknown> = {};
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const [updated] = await db
      .update(regionalPricing)
      .set(updateData)
      .where(eq(regionalPricing.id, pricingId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Regional pricing not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating regional pricing:', error);
    return NextResponse.json({ error: 'Failed to update regional pricing' }, { status: 500 });
  }
}

// DELETE - Remove a regional pricing entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pricingId: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { pricingId } = await params;

  try {
    const db = await getDb();

    const [deleted] = await db
      .delete(regionalPricing)
      .where(eq(regionalPricing.id, pricingId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Regional pricing not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting regional pricing:', error);
    return NextResponse.json({ error: 'Failed to delete regional pricing' }, { status: 500 });
  }
}
