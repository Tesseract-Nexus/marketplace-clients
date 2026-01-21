import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { trustBadges } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single trust badge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.trustBadges.findFirst({
      where: eq(trustBadges.id, id),
    });

    if (!result) {
      return NextResponse.json({ error: 'Trust badge not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching trust badge:', error);
    return NextResponse.json({ error: 'Failed to fetch trust badge' }, { status: 500 });
  }
}

// PUT - Update trust badge
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
    const { label, iconName, description, pageContext, sortOrder, active } = body;

    const [updated] = await db
      .update(trustBadges)
      .set({
        ...(label !== undefined && { label }),
        ...(iconName !== undefined && { iconName }),
        ...(description !== undefined && { description }),
        ...(pageContext !== undefined && { pageContext }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      })
      .where(eq(trustBadges.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Trust badge not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating trust badge:', error);
    return NextResponse.json({ error: 'Failed to update trust badge' }, { status: 500 });
  }
}

// DELETE - Delete trust badge
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
      .delete(trustBadges)
      .where(eq(trustBadges.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Trust badge not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting trust badge:', error);
    return NextResponse.json({ error: 'Failed to delete trust badge' }, { status: 500 });
  }
}
