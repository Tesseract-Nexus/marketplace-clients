import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { testimonials } from '@/db/schema';
import { asc, eq, desc, sql } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all testimonials with optional status filter
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, revision_needed

    const db = await getDb();

    // Build query with optional status filter
    let query = db.query.testimonials.findMany({
      orderBy: [
        // Show pending first, then by sort order
        desc(sql`CASE WHEN ${testimonials.status} = 'pending' THEN 1 ELSE 0 END`),
        asc(testimonials.sortOrder),
      ],
    });

    if (status) {
      query = db.query.testimonials.findMany({
        where: eq(testimonials.status, status),
        orderBy: [asc(testimonials.sortOrder)],
      });
    }

    const result = await query;

    // Get counts for status badges
    const allTestimonials = await db.query.testimonials.findMany();
    const counts = {
      total: allTestimonials.length,
      pending: allTestimonials.filter(t => t.status === 'pending').length,
      approved: allTestimonials.filter(t => t.status === 'approved').length,
      rejected: allTestimonials.filter(t => t.status === 'rejected').length,
      revision_needed: allTestimonials.filter(t => t.status === 'revision_needed').length,
    };

    return NextResponse.json({ data: result, counts });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST - Create new testimonial (admin-created are auto-approved)
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
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
        status: 'approved', // Admin-created testimonials are auto-approved
      })
      .returning();

    return NextResponse.json({ data: newTestimonial }, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
