import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { integrationFeatures } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// PUT - Update an integration feature
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
    const { feature, sortOrder } = body;

    const [updated] = await db
      .update(integrationFeatures)
      .set({
        ...(feature !== undefined && { feature }),
        ...(sortOrder !== undefined && { sortOrder }),
      })
      .where(eq(integrationFeatures.id, featureId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Integration feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating integration feature:', error);
    return NextResponse.json({ error: 'Failed to update integration feature' }, { status: 500 });
  }
}

// DELETE - Remove an integration feature
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
      .delete(integrationFeatures)
      .where(eq(integrationFeatures.id, featureId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Integration feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting integration feature:', error);
    return NextResponse.json({ error: 'Failed to delete integration feature' }, { status: 500 });
  }
}
