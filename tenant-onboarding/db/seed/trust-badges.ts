import type { Database } from '../index';
import { trustBadges } from '../schema';

const trustBadgesData = [
  {
    label: 'No Developer Needed',
    iconName: 'Users',
    description: 'Set up your store yourself without any coding',
    pageContext: 'home',
    sortOrder: 0,
  },
  {
    label: 'SSL Secured',
    iconName: 'Shield',
    description: 'Bank-grade encryption for all transactions',
    pageContext: 'home',
    sortOrder: 1,
  },
  {
    label: '99.9% Uptime',
    iconName: 'Zap',
    description: 'Your store is always online and ready for customers',
    pageContext: 'home',
    sortOrder: 2,
  },
  {
    label: '24/7 Support',
    iconName: 'Clock',
    description: 'Real humans available around the clock',
    pageContext: 'home',
    sortOrder: 3,
  },
  // Integrations page badges
  {
    label: '5-minute setup',
    iconName: 'Clock',
    description: 'Not 5 hours',
    pageContext: 'integrations',
    sortOrder: 0,
  },
  {
    label: 'PCI compliant',
    iconName: 'Shield',
    description: 'Bank-grade security',
    pageContext: 'integrations',
    sortOrder: 1,
  },
  {
    label: 'No extra fees',
    iconName: 'CreditCard',
    description: 'Just gateway charges',
    pageContext: 'integrations',
    sortOrder: 2,
  },
];

export async function seedTrustBadges(db: Database) {
  await db.insert(trustBadges).values(trustBadgesData).onConflictDoNothing();
  console.log(`  ✓ Seeded ${trustBadgesData.length} trust badges`);
}
