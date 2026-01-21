import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { contacts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.contacts.findFirst({
      where: eq(contacts.id, id),
    });

    if (!result) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}

// PUT - Update contact
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
    const { type, label, email, phone, description, responseTime, sortOrder, active } = body;

    const [updated] = await db
      .update(contacts)
      .set({
        ...(type !== undefined && { type }),
        ...(label !== undefined && { label }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(responseTime !== undefined && { responseTime }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE - Delete contact
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
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
