import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { guides, guideSteps } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all guides with steps
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.guides.findMany({
      orderBy: [asc(guides.sortOrder)],
      with: {
        steps: {
          orderBy: [asc(guideSteps.sortOrder)],
        },
      },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}

// POST - Create new guide
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { title, slug, description, iconName, duration, featured, content, sortOrder } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const [newGuide] = await db
      .insert(guides)
      .values({
        title,
        slug,
        description,
        iconName,
        duration,
        featured: featured || false,
        content,
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newGuide }, { status: 201 });
  } catch (error) {
    console.error('Error creating guide:', error);
    return NextResponse.json({ error: 'Failed to create guide' }, { status: 500 });
  }
}
