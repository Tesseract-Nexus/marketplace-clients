import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testimonials } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all testimonials
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const result = await db.query.testimonials.findMany({
      orderBy: [asc(testimonials.sortOrder)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST - Create new testimonial
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { quote, name, role, company, initials, rating, featured, pageContext, sortOrder } = body;

    if (!quote || !name) {
      return NextResponse.json(
        { error: 'Quote and name are required' },
        { status: 400 }
      );
    }

    const [newTestimonial] = await db
      .insert(testimonials)
      .values({
        quote,
        name,
        role,
        company,
        initials: initials || name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        rating: rating || 5,
        featured: featured || false,
        pageContext: pageContext || 'home',
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newTestimonial }, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
