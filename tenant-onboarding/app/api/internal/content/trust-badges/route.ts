import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { trustBadges } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all trust badges
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.trustBadges.findMany({
      orderBy: [asc(trustBadges.sortOrder)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching trust badges:', error);
    return NextResponse.json({ error: 'Failed to fetch trust badges' }, { status: 500 });
  }
}

// POST - Create new trust badge
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { label, iconName, description, pageContext, sortOrder } = body;

    if (!label) {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 }
      );
    }

    const [newBadge] = await db
      .insert(trustBadges)
      .values({
        label,
        iconName,
        description,
        pageContext: pageContext || 'home',
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newBadge }, { status: 201 });
  } catch (error) {
    console.error('Error creating trust badge:', error);
    return NextResponse.json({ error: 'Failed to create trust badge' }, { status: 500 });
  }
}
