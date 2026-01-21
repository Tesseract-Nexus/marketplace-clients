import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { features } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// PUT - Update feature
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
    const { title, description, iconName, category, pageContext, sortOrder, active } = body;

    const [updated] = await db
      .update(features)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(iconName !== undefined && { iconName }),
        ...(category !== undefined && { category }),
        ...(pageContext !== undefined && { pageContext }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      })
      .where(eq(features.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}

// DELETE - Delete feature
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
      .delete(features)
      .where(eq(features.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 });
  }
}
