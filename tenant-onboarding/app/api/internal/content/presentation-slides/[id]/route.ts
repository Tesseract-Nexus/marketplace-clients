import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { presentationSlides } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single presentation slide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.presentationSlides.findFirst({
      where: eq(presentationSlides.id, id),
    });

    if (!result) {
      return NextResponse.json({ error: 'Presentation slide not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching presentation slide:', error);
    return NextResponse.json({ error: 'Failed to fetch presentation slide' }, { status: 500 });
  }
}

// PUT - Update presentation slide
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
    const { slideNumber, type, label, title, titleGradient, titleHighlight, subtitle, content, active } = body;

    const [updated] = await db
      .update(presentationSlides)
      .set({
        ...(slideNumber !== undefined && { slideNumber }),
        ...(type !== undefined && { type }),
        ...(label !== undefined && { label }),
        ...(title !== undefined && { title }),
        ...(titleGradient !== undefined && { titleGradient }),
        ...(titleHighlight !== undefined && { titleHighlight }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content !== undefined && { content }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
      })
      .where(eq(presentationSlides.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Presentation slide not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating presentation slide:', error);
    return NextResponse.json({ error: 'Failed to update presentation slide' }, { status: 500 });
  }
}

// DELETE - Delete presentation slide
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
      .delete(presentationSlides)
      .where(eq(presentationSlides.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Presentation slide not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting presentation slide:', error);
    return NextResponse.json({ error: 'Failed to delete presentation slide' }, { status: 500 });
  }
}
