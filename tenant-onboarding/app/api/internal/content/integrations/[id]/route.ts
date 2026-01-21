import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { integrations, integrationFeatures } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single integration with features
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.integrations.findFirst({
      where: eq(integrations.id, id),
      with: {
        features: {
          orderBy: [asc(integrationFeatures.sortOrder)],
        },
      },
    });

    if (!result) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 });
  }
}

// PUT - Update integration
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
    const { name, category, description, logoUrl, status, sortOrder, active } = body;

    const [updated] = await db
      .update(integrations)
      .set({
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      })
      .where(eq(integrations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}

// DELETE - Delete integration
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
      .delete(integrations)
      .where(eq(integrations.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
  }
}
