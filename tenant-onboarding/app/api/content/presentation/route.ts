import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { paymentPlans, planFeatures, testimonials, features } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';

// GET - Get all content for presentation page (public, no auth required)
export async function GET() {
  try {
    const db = await getDb();

    // Fetch all content in parallel
    const [paymentPlansData, testimonialsData, featuresData] = await Promise.all([
      // Payment plans with features
      db.query.paymentPlans.findMany({
        where: eq(paymentPlans.active, true),
        orderBy: [asc(paymentPlans.sortOrder)],
        with: {
          features: {
            orderBy: [asc(planFeatures.sortOrder)],
          },
        },
      }),
      // Testimonials for presentation
      db.query.testimonials.findMany({
        where: and(
          eq(testimonials.active, true),
          eq(testimonials.pageContext, 'presentation')
        ),
        orderBy: [asc(testimonials.sortOrder)],
      }),
      // Features for presentation
      db.query.features.findMany({
        where: and(
          eq(features.active, true),
          eq(features.pageContext, 'presentation')
        ),
        orderBy: [asc(features.sortOrder)],
      }),
    ]);

    return NextResponse.json({
      data: {
        paymentPlans: paymentPlansData,
        testimonials: testimonialsData,
        features: featuresData,
      },
    });
  } catch (error) {
    console.error('Error fetching presentation content:', error);
    // Return empty data on error so page can fall back to hardcoded content
    return NextResponse.json({
      data: {
        paymentPlans: [],
        testimonials: [],
        features: [],
      },
    });
  }
}
