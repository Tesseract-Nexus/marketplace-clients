import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { countryDefaults } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all country defaults
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.countryDefaults.findMany({
      orderBy: [asc(countryDefaults.countryName)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching country defaults:', error);
    return NextResponse.json({ error: 'Failed to fetch country defaults' }, { status: 500 });
  }
}

// POST - Create new country default
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { countryCode, countryName, defaultCurrency, defaultTimezone, defaultLanguage, callingCode, flagEmoji } = body;

    if (!countryCode || !countryName || !defaultCurrency || !defaultTimezone) {
      return NextResponse.json(
        { error: 'Country code, name, currency, and timezone are required' },
        { status: 400 }
      );
    }

    const [newCountry] = await db
      .insert(countryDefaults)
      .values({
        countryCode,
        countryName,
        defaultCurrency,
        defaultTimezone,
        defaultLanguage: defaultLanguage || 'en',
        callingCode,
        flagEmoji,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newCountry }, { status: 201 });
  } catch (error) {
    console.error('Error creating country default:', error);
    return NextResponse.json({ error: 'Failed to create country default' }, { status: 500 });
  }
}
