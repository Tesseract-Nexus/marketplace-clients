import type { Database } from '../index';
import { testimonials } from '../schema';

const testimonialsData = [
  {
    quote: "I spent months trying to figure out Shopify. With Tesserix, I had my store up in an afternoon. It just... works.",
    name: 'Sarah Chen',
    role: 'Founder',
    company: 'BloomBox',
    initials: 'SC',
    rating: 5,
    featured: true,
    pageContext: 'home',
    sortOrder: 0,
  },
  {
    quote: "The onboarding was so smooth I thought I must be missing something. Nope—it really is that simple. My store was live the same day.",
    name: 'Marcus Rivera',
    role: 'Owner',
    company: 'Craft & Co',
    initials: 'MR',
    rating: 5,
    featured: true,
    pageContext: 'home',
    sortOrder: 1,
  },
  {
    quote: "Finally, an e-commerce platform that doesn't make me feel stupid. Clean, fast, and the support team actually responds.",
    name: 'Emily Tran',
    role: 'Founder',
    company: 'Luna Candles',
    initials: 'ET',
    rating: 5,
    featured: true,
    pageContext: 'home',
    sortOrder: 2,
  },
  {
    quote: "We switched from WooCommerce and saved 10+ hours a week on maintenance alone. The platform just works.",
    name: 'Sarah Kim',
    role: 'CEO',
    company: 'Artisan Goods Co.',
    initials: 'SK',
    rating: 5,
    featured: true,
    pageContext: 'presentation',
    sortOrder: 0,
  },
  {
    quote: "The multi-tenant architecture means we can manage all our brand storefronts from one dashboard. Game changer.",
    name: 'Michael Rodriguez',
    role: 'CTO',
    company: 'Brand Collective',
    initials: 'MR',
    rating: 5,
    featured: true,
    pageContext: 'presentation',
    sortOrder: 1,
  },
  {
    quote: "From India to the world - Tesserix helped us scale internationally without the usual payment headaches.",
    name: 'Aisha Patel',
    role: 'Founder',
    company: 'Spice Route',
    initials: 'AP',
    rating: 5,
    featured: true,
    pageContext: 'presentation',
    sortOrder: 2,
  },
];

export async function seedTestimonials(db: Database) {
  await db.insert(testimonials).values(testimonialsData).onConflictDoNothing();
  console.log(`  ✓ Seeded ${testimonialsData.length} testimonials`);
}
