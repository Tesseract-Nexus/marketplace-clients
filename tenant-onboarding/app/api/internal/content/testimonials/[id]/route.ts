import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { testimonials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single testimonial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.testimonials.findFirst({
      where: eq(testimonials.id, id),
    });

    if (!result) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 });
  }
}

// PUT - Update testimonial
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
    const { quote, name, role, company, initials, rating, featured, pageContext, sortOrder, active, status } = body;

    const [updated] = await db
      .update(testimonials)
      .set({
        ...(quote !== undefined && { quote }),
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(company !== undefined && { company }),
        ...(initials !== undefined && { initials }),
        ...(rating !== undefined && { rating }),
        ...(featured !== undefined && { featured }),
        ...(pageContext !== undefined && { pageContext }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
        ...(status !== undefined && { status }),
      })
      .where(eq(testimonials.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

// PATCH - Approve, reject, or request revision for testimonial
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const body = await request.json();
    const { action, revisionNotes, pageContext, reviewedBy } = body;

    // Validate action
    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, reject, or request_revision' },
        { status: 400 }
      );
    }

    // Get current testimonial
    const existing = await db.query.testimonials.findFirst({
      where: eq(testimonials.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {
      reviewedAt: new Date(),
      reviewedBy: reviewedBy || 'Admin',
    };

    if (action === 'approve') {
      updateData = {
        ...updateData,
        status: 'approved',
        active: true,
        pageContext: pageContext || 'home', // Default to home page
        revisionNotes: null,
      };
    } else if (action === 'reject') {
      updateData = {
        ...updateData,
        status: 'rejected',
        active: false,
        revisionNotes: revisionNotes || null,
      };
    } else if (action === 'request_revision') {
      if (!revisionNotes) {
        return NextResponse.json(
          { error: 'Revision notes are required when requesting revision' },
          { status: 400 }
        );
      }
      updateData = {
        ...updateData,
        status: 'revision_needed',
        active: false,
        revisionNotes,
      };
    }

    const [updated] = await db
      .update(testimonials)
      .set(updateData)
      .where(eq(testimonials.id, id))
      .returning();

    return NextResponse.json({
      data: updated,
      message: `Testimonial ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent for revision'} successfully`,
    });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    return NextResponse.json({ error: 'Failed to update testimonial status' }, { status: 500 });
  }
}

// DELETE - Delete testimonial
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
      .delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
