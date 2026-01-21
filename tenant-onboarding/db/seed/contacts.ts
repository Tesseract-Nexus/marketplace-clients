import type { Database } from '../index';
import { contacts, socialLinks, companyLocations } from '../schema';

const contactsData = [
  {
    type: 'support',
    label: 'Email Support',
    email: 'support@tesserix.app',
    description: 'For general questions, technical help, or account assistance.',
    responseTime: 'Under 2 hours',
    sortOrder: 0,
  },
  {
    type: 'sales',
    label: 'Sales Inquiries',
    email: 'sales@tesserix.app',
    description: 'Questions about pricing, features, or whether Tesserix is right for you.',
    responseTime: 'Under 1 hour',
    sortOrder: 1,
  },
  {
    type: 'partnerships',
    label: 'Partnership Opportunities',
    email: 'partners@tesserix.app',
    description: "Interested in partnering with us? We'd love to explore how we can work together.",
    responseTime: null,
    sortOrder: 2,
  },
  {
    type: 'feedback',
    label: 'Feedback',
    email: 'feedback@tesserix.app',
    description: 'Your input directly shapes what we build next.',
    responseTime: null,
    sortOrder: 3,
  },
  {
    type: 'general',
    label: 'General Inquiries',
    email: 'hello@tesserix.app',
    description: 'For anything else, drop us a line.',
    responseTime: null,
    sortOrder: 4,
  },
];

const socialLinksData = [
  {
    platform: 'twitter',
    url: 'https://twitter.com/tesserix',
    iconName: 'Twitter',
    sortOrder: 0,
  },
  {
    platform: 'instagram',
    url: 'https://instagram.com/tesserix',
    iconName: 'Instagram',
    sortOrder: 1,
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/company/tesserix',
    iconName: 'Linkedin',
    sortOrder: 2,
  },
];

const locationsData = [
  {
    name: 'Tesserix HQ',
    address: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    country: 'India',
    isPrimary: true,
  },
];

export async function seedContacts(db: Database) {
  await db.insert(contacts).values(contactsData).onConflictDoNothing();
  await db.insert(socialLinks).values(socialLinksData).onConflictDoNothing();
  await db.insert(companyLocations).values(locationsData).onConflictDoNothing();

  console.log(`  ✓ Seeded ${contactsData.length} contacts`);
  console.log(`  ✓ Seeded ${socialLinksData.length} social links`);
  console.log(`  ✓ Seeded ${locationsData.length} company locations`);
}
