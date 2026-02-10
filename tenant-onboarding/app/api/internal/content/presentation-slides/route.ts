import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { presentationSlides } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all presentation slides
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.presentationSlides.findMany({
      orderBy: [asc(presentationSlides.slideNumber)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching presentation slides:', error);
    return NextResponse.json({ error: 'Failed to fetch presentation slides' }, { status: 500 });
  }
}

// POST - Create new presentation slide
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { slideNumber, type, label, title, titleGradient, titleHighlight, subtitle, content } = body;

    if (slideNumber === undefined || !type) {
      return NextResponse.json(
        { error: 'Slide number and type are required' },
        { status: 400 }
      );
    }

    const [newSlide] = await db
      .insert(presentationSlides)
      .values({
        slideNumber,
        type,
        label,
        title,
        titleGradient,
        titleHighlight,
        subtitle,
        content,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newSlide }, { status: 201 });
  } catch (error) {
    console.error('Error creating presentation slide:', error);
    return NextResponse.json({ error: 'Failed to create presentation slide' }, { status: 500 });
  }
}
