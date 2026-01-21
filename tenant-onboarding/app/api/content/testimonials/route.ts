import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { testimonials } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageContext = searchParams.get('page');
  const featured = searchParams.get('featured') === 'true';

  try {
    const db = await getDb();
    const conditions = [eq(testimonials.active, true)];

    if (pageContext) {
      conditions.push(eq(testimonials.pageContext, pageContext));
    }

    if (featured) {
      conditions.push(eq(testimonials.featured, true));
    }

    const result = await db.query.testimonials.findMany({
      where: and(...conditions),
      orderBy: [asc(testimonials.sortOrder)],
    });

    return NextResponse.json({
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);

    // Fallback data
    const fallbackTestimonials = [
      {
        quote: "I spent months trying to figure out Shopify. With Tesserix, I had my store up in an afternoon.",
        name: 'Sarah Chen',
        role: 'Founder',
        company: 'BloomBox',
        initials: 'SC',
        rating: 5,
      },
    ];

    return NextResponse.json({
      data: fallbackTestimonials,
      source: 'fallback',
    });
  }
}
