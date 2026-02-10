import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { planFeatures } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// PUT - Update a plan feature
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { featureId } = await params;

  try {
    const db = await getDb();
    const body = await request.json();
    const { feature, sortOrder, highlighted } = body;

    const [updated] = await db
      .update(planFeatures)
      .set({
        ...(feature !== undefined && { feature }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(highlighted !== undefined && { highlighted }),
      })
      .where(eq(planFeatures.id, featureId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Plan feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating plan feature:', error);
    return NextResponse.json({ error: 'Failed to update plan feature' }, { status: 500 });
  }
}

// DELETE - Remove a plan feature
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { featureId } = await params;

  try {
    const db = await getDb();
    const [deleted] = await db
      .delete(planFeatures)
      .where(eq(planFeatures.id, featureId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Plan feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting plan feature:', error);
    return NextResponse.json({ error: 'Failed to delete plan feature' }, { status: 500 });
  }
}
