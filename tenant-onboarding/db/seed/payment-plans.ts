import type { Database } from '../index';
import { paymentPlans, planFeatures } from '../schema';

const plans = [
  {
    name: 'Free Trial',
    slug: 'free-trial',
    price: '0',
    currency: 'INR',
    billingCycle: 'monthly',
    trialDays: 365,
    description: 'Everything you need to start selling online',
    tagline: '12 months free, then ₹299/mo',
    featured: true,
    sortOrder: 0,
    features: [
      'Sell as many products as you want',
      'Use your own domain name',
      'Looks great on phones',
      'Help customers find you on Google',
      'Accept cards, UPI, and wallets',
      'Track orders from one place',
      'Let customers save their info',
      'Automatic emails when orders ship',
      "See what's selling (and what's not)",
      'No developer needed—do it yourself',
      'Real humans ready to help, 24/7',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '299',
    currency: 'INR',
    billingCycle: 'monthly',
    trialDays: 0,
    description: 'After your free year, continue with all features',
    tagline: 'No transaction fees. No hidden costs.',
    featured: false,
    sortOrder: 1,
    features: [
      'Everything in Free Trial',
      'Priority support',
      'Advanced analytics',
      'Custom reports',
    ],
  },
];

export async function seedPaymentPlans(db: Database) {
  for (const plan of plans) {
    const { features: planFeaturesList, ...planData } = plan;

    // Insert plan
    const [insertedPlan] = await db
      .insert(paymentPlans)
      .values(planData)
      .onConflictDoNothing()
      .returning();

    if (insertedPlan) {
      // Insert features
      const featureRecords = planFeaturesList.map((feature, index) => ({
        planId: insertedPlan.id,
        feature,
        sortOrder: index,
        highlighted: index < 3,
      }));

      await db.insert(planFeatures).values(featureRecords).onConflictDoNothing();
    }
  }

  console.log(`  ✓ Seeded ${plans.length} payment plans`);
}
