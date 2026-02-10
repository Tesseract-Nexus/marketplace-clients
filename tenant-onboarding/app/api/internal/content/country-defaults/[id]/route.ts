import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { countryDefaults } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - Get single country default
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();
    const result = await db.query.countryDefaults.findFirst({
      where: eq(countryDefaults.id, id),
    });

    if (!result) {
      return NextResponse.json({ error: 'Country default not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching country default:', error);
    return NextResponse.json({ error: 'Failed to fetch country default' }, { status: 500 });
  }
}

// PUT - Update country default
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
    const { countryCode, countryName, defaultCurrency, defaultTimezone, defaultLanguage, callingCode, flagEmoji, active } = body;

    const [updated] = await db
      .update(countryDefaults)
      .set({
        ...(countryCode !== undefined && { countryCode }),
        ...(countryName !== undefined && { countryName }),
        ...(defaultCurrency !== undefined && { defaultCurrency }),
        ...(defaultTimezone !== undefined && { defaultTimezone }),
        ...(defaultLanguage !== undefined && { defaultLanguage }),
        ...(callingCode !== undefined && { callingCode }),
        ...(flagEmoji !== undefined && { flagEmoji }),
        ...(active !== undefined && { active }),
      })
      .where(eq(countryDefaults.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Country default not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating country default:', error);
    return NextResponse.json({ error: 'Failed to update country default' }, { status: 500 });
  }
}

// DELETE - Delete country default
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
      .delete(countryDefaults)
      .where(eq(countryDefaults.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Country default not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting country default:', error);
    return NextResponse.json({ error: 'Failed to delete country default' }, { status: 500 });
  }
}
