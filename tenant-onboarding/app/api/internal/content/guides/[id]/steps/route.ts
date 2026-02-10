import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { guideSteps, guides } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List steps for a guide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();

    // Verify guide exists
    const guide = await db.query.guides.findFirst({
      where: eq(guides.id, id),
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const result = await db.query.guideSteps.findMany({
      where: eq(guideSteps.guideId, id),
      orderBy: [asc(guideSteps.sortOrder)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching guide steps:', error);
    return NextResponse.json({ error: 'Failed to fetch guide steps' }, { status: 500 });
  }
}

// POST - Create a new step for a guide
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();

    // Verify guide exists
    const guide = await db.query.guides.findFirst({
      where: eq(guides.id, id),
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, content, duration, sortOrder } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const [newStep] = await db
      .insert(guideSteps)
      .values({
        guideId: id,
        title,
        description,
        content,
        duration,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json({ data: newStep }, { status: 201 });
  } catch (error) {
    console.error('Error creating guide step:', error);
    return NextResponse.json({ error: 'Failed to create guide step' }, { status: 500 });
  }
}
