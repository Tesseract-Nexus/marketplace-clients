import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { faqs, faqCategories, features, testimonials, trustBadges, paymentPlans, planFeatures } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';

// GET - Get all content for home page (public, no auth required)
export async function GET() {
  try {
    const db = await getDb();

    // Fetch all content in parallel
    const [faqsData, featuresData, testimonialsData, trustBadgesData, paymentPlansData] = await Promise.all([
      // FAQs for home page
      db.query.faqs.findMany({
        where: and(eq(faqs.active, true), eq(faqs.pageContext, 'home')),
        orderBy: [asc(faqs.sortOrder)],
        with: {
          category: true,
        },
      }),
      // Features for home page
      db.query.features.findMany({
        where: and(eq(features.active, true), eq(features.pageContext, 'home')),
        orderBy: [asc(features.sortOrder)],
      }),
      // Testimonials for home page
      db.query.testimonials.findMany({
        where: and(eq(testimonials.active, true), eq(testimonials.pageContext, 'home')),
        orderBy: [asc(testimonials.sortOrder)],
      }),
      // Trust badges for home page
      db.query.trustBadges.findMany({
        where: and(eq(trustBadges.active, true), eq(trustBadges.pageContext, 'home')),
        orderBy: [asc(trustBadges.sortOrder)],
      }),
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
    ]);

    return NextResponse.json({
      data: {
        faqs: faqsData,
        features: featuresData,
        testimonials: testimonialsData,
        trustBadges: trustBadgesData,
        paymentPlans: paymentPlansData,
      },
    });
  } catch (error) {
    console.error('Error fetching home content:', error);
    // Return empty data on error so page can fall back to hardcoded content
    return NextResponse.json({
      data: {
        faqs: [],
        features: [],
        testimonials: [],
        trustBadges: [],
        paymentPlans: [],
      },
    });
  }
}
