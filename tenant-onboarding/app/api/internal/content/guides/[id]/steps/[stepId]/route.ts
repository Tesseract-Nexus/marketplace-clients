import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { guideSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// PUT - Update a guide step
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { stepId } = await params;

  try {
    const db = await getDb();
    const body = await request.json();
    const { title, description, content, duration, sortOrder } = body;

    const [updated] = await db
      .update(guideSteps)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(duration !== undefined && { duration }),
        ...(sortOrder !== undefined && { sortOrder }),
      })
      .where(eq(guideSteps.id, stepId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Guide step not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating guide step:', error);
    return NextResponse.json({ error: 'Failed to update guide step' }, { status: 500 });
  }
}

// DELETE - Delete a guide step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { stepId } = await params;

  try {
    const db = await getDb();
    const [deleted] = await db
      .delete(guideSteps)
      .where(eq(guideSteps.id, stepId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Guide step not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting guide step:', error);
    return NextResponse.json({ error: 'Failed to delete guide step' }, { status: 500 });
  }
}
