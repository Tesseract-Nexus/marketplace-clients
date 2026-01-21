import { db } from '../index';
import { seedPaymentPlans } from './payment-plans';
import { seedTestimonials } from './testimonials';
import { seedFaqs } from './faqs';
import { seedFeatures } from './features';
import { seedTrustBadges } from './trust-badges';
import { seedContacts } from './contacts';
import { seedIntegrations } from './integrations';
import { seedCountryDefaults } from './country-defaults';

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Seed in order of dependencies
    console.log('📦 Seeding payment plans...');
    await seedPaymentPlans(db);

    console.log('💬 Seeding testimonials...');
    await seedTestimonials(db);

    console.log('❓ Seeding FAQs...');
    await seedFaqs(db);

    console.log('✨ Seeding features...');
    await seedFeatures(db);

    console.log('🛡️ Seeding trust badges...');
    await seedTrustBadges(db);

    console.log('📧 Seeding contacts...');
    await seedContacts(db);

    console.log('🔌 Seeding integrations...');
    await seedIntegrations(db);

    console.log('🌍 Seeding country defaults...');
    await seedCountryDefaults(db);

    console.log('\n✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
