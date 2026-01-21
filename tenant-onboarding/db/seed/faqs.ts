import type { Database } from '../index';
import { faqs, faqCategories } from '../schema';

const categories = [
  { name: 'General', slug: 'general', description: 'Common questions about Tesserix', sortOrder: 0 },
  { name: 'Pricing', slug: 'pricing', description: 'Questions about pricing and billing', sortOrder: 1 },
  { name: 'Features', slug: 'features', description: 'Questions about platform features', sortOrder: 2 },
];

const faqsData = [
  {
    question: "I'm not very technical. Can I still use this?",
    answer: "Absolutely. We built this for people who want to focus on their business, not on learning software. If you can use email, you can use Tesserix. And if you get stuck, we're here to help—no judgment, just friendly guidance.",
    categorySlug: 'general',
    pageContext: 'home',
    sortOrder: 0,
  },
  {
    question: 'What happens after the 12 months free?',
    answer: "After your free year, it's just ₹299/month. That's it—no hidden fees, no transaction costs from us, no surprises. And you can cancel anytime.",
    categorySlug: 'pricing',
    pageContext: 'home',
    sortOrder: 1,
  },
  {
    question: 'Are there transaction fees or payment processing fees?',
    answer: "You'll pay standard payment processing fees (around 2% for UPI, 2-3% for cards). But unlike other platforms, we don't take an extra cut. Your money is your money.",
    categorySlug: 'pricing',
    pageContext: 'home',
    sortOrder: 2,
  },
  {
    question: "What if I decide this isn't for me?",
    answer: "Cancel anytime, no questions asked. You can even export all your data—products, customers, orders—and take it with you. No hard feelings.",
    categorySlug: 'general',
    pageContext: 'home',
    sortOrder: 3,
  },
  {
    question: 'How many products can I add?',
    answer: "As many as you want. Unlimited products, unlimited photos, unlimited everything. We're not in the business of nickel-and-diming you.",
    categorySlug: 'features',
    pageContext: 'home',
    sortOrder: 4,
  },
  {
    question: 'I already have a store on Shopify. Can I switch?',
    answer: "Yes, and it's easier than you might think. We can import your products and customer data automatically. Most stores are fully migrated within a day.",
    categorySlug: 'general',
    pageContext: 'home',
    sortOrder: 5,
  },
  {
    question: 'What if I get stuck or need help?',
    answer: 'Just reach out. Our support team is made up of real people who actually want to help you succeed. Average response time is under 4 hours.',
    categorySlug: 'general',
    pageContext: 'home',
    sortOrder: 6,
  },
  {
    question: 'Do I need to hire a developer to set this up?',
    answer: "Not at all. That's the whole point. You can set up your entire store yourself—customize the design, add products, configure payments—all without writing a single line of code. Save the ₹50,000+ you'd spend on a developer and put it back into your business.",
    categorySlug: 'general',
    pageContext: 'home',
    sortOrder: 7,
  },
];

export async function seedFaqs(db: Database) {
  // Insert categories first
  const insertedCategories = await db
    .insert(faqCategories)
    .values(categories)
    .onConflictDoNothing()
    .returning();

  // Create a map of slug to id
  const categoryMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // Insert FAQs with category references
  const faqRecords = faqsData.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
    categoryId: categoryMap.get(faq.categorySlug) || null,
    pageContext: faq.pageContext,
    sortOrder: faq.sortOrder,
  }));

  await db.insert(faqs).values(faqRecords).onConflictDoNothing();

  console.log(`  ✓ Seeded ${categories.length} FAQ categories`);
  console.log(`  ✓ Seeded ${faqsData.length} FAQs`);
}
