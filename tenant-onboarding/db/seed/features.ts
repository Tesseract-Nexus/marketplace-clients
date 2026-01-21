import type { Database } from '../index';
import { features } from '../schema';

const featuresData = [
  {
    title: 'Make It Yours',
    description: 'Beautiful themes you can customize to match your brand. No design skills needed.',
    iconName: 'Package',
    category: 'customization',
    pageContext: 'home',
    sortOrder: 0,
  },
  {
    title: 'Sell Everywhere',
    description: 'Accept payments from customers around the world in their preferred currency.',
    iconName: 'CreditCard',
    category: 'payments',
    pageContext: 'home',
    sortOrder: 1,
  },
  {
    title: 'Know Your Numbers',
    description: "Simple analytics that help you understand what's working and what's not.",
    iconName: 'BarChart3',
    category: 'analytics',
    pageContext: 'home',
    sortOrder: 2,
  },
  {
    title: "We've Got Your Back",
    description: 'Real humans ready to help when you need it. No chatbots, just friendly support.',
    iconName: 'Headphones',
    category: 'support',
    pageContext: 'home',
    sortOrder: 3,
  },
  // About page features
  {
    title: 'No Transaction Fees',
    description: "We don't take a cut of your sales. Ever. You keep what you earn.",
    iconName: 'Zap',
    category: 'value',
    pageContext: 'about',
    sortOrder: 0,
  },
  {
    title: 'Free for 12 Months',
    description: 'Start selling today, completely free. Then just ₹299/month.',
    iconName: 'Gift',
    category: 'value',
    pageContext: 'about',
    sortOrder: 1,
  },
  {
    title: 'No Developer Needed',
    description: "Our platform is designed for real people, not tech experts.",
    iconName: 'Users',
    category: 'value',
    pageContext: 'about',
    sortOrder: 2,
  },
  {
    title: '24/7 Human Support',
    description: "Got a question at midnight? We're here. Real people, real help.",
    iconName: 'HeadphonesIcon',
    category: 'value',
    pageContext: 'about',
    sortOrder: 3,
  },
  {
    title: 'Global Reach',
    description: 'Based in India, built for the world. Sell to customers anywhere.',
    iconName: 'Globe',
    category: 'value',
    pageContext: 'about',
    sortOrder: 4,
  },
  {
    title: 'Enterprise-Grade Security',
    description: 'GDPR and PCI DSS compliant. Your data is safe with us.',
    iconName: 'Shield',
    category: 'value',
    pageContext: 'about',
    sortOrder: 5,
  },
];

export async function seedFeatures(db: Database) {
  await db.insert(features).values(featuresData).onConflictDoNothing();
  console.log(`  ✓ Seeded ${featuresData.length} features`);
}
