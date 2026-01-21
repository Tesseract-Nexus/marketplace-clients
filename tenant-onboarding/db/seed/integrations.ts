import type { Database } from '../index';
import { integrations, integrationFeatures } from '../schema';

const integrationsData = [
  {
    name: 'Razorpay',
    category: 'payments',
    description: 'UPI, cards, netbanking, wallets - all payment modes Indians love',
    status: 'active',
    sortOrder: 0,
    features: ['UPI & QR payments', 'All major cards', 'EMI options', 'Instant settlements'],
  },
  {
    name: 'Stripe',
    category: 'payments',
    description: 'For international customers paying with global cards',
    status: 'active',
    sortOrder: 1,
    features: ['135+ currencies', 'Global cards', 'Apple Pay & Google Pay', 'Fraud protection'],
  },
  {
    name: 'Shiprocket',
    category: 'shipping',
    description: 'Access to 25+ courier partners through one integration',
    status: 'active',
    sortOrder: 0,
    features: ['Auto courier selection', 'Bulk shipping', 'NDR management', 'COD support'],
  },
  {
    name: 'Delhivery',
    category: 'shipping',
    description: 'Reliable delivery across 18,000+ pin codes',
    status: 'active',
    sortOrder: 1,
    features: ['Express delivery', 'Surface shipping', 'Warehousing', 'Returns management'],
  },
  {
    name: 'Instagram Shopping',
    category: 'social',
    description: 'Tag products in your posts and stories. Let customers buy without leaving Instagram.',
    status: 'coming_soon',
    sortOrder: 0,
    features: [],
  },
  {
    name: 'WhatsApp Commerce',
    category: 'social',
    description: 'Share your catalog on WhatsApp. Accept orders and payments in chat.',
    status: 'coming_soon',
    sortOrder: 1,
    features: [],
  },
];

export async function seedIntegrations(db: Database) {
  for (const integration of integrationsData) {
    const { features: integrationFeaturesList, ...integrationData } = integration;

    // Insert integration
    const [insertedIntegration] = await db
      .insert(integrations)
      .values(integrationData)
      .onConflictDoNothing()
      .returning();

    if (insertedIntegration && integrationFeaturesList.length > 0) {
      // Insert features
      const featureRecords = integrationFeaturesList.map((feature, index) => ({
        integrationId: insertedIntegration.id,
        feature,
        sortOrder: index,
      }));

      await db.insert(integrationFeatures).values(featureRecords).onConflictDoNothing();
    }
  }

  console.log(`  ✓ Seeded ${integrationsData.length} integrations`);
}
