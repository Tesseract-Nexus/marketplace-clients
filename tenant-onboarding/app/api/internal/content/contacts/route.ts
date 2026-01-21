import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { contacts } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all contacts
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.contacts.findMany({
      orderBy: [asc(contacts.sortOrder)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST - Create new contact
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { type, label, email, phone, description, responseTime, sortOrder } = body;

    if (!type || !label) {
      return NextResponse.json(
        { error: 'Type and label are required' },
        { status: 400 }
      );
    }

    const [newContact] = await db
      .insert(contacts)
      .values({
        type,
        label,
        email,
        phone,
        description,
        responseTime,
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newContact }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
