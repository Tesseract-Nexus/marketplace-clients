import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts, socialLinks, companyLocations } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const [contactsResult, socialLinksResult, locationsResult] = await Promise.all([
      db.query.contacts.findMany({
        where: eq(contacts.active, true),
        orderBy: [asc(contacts.sortOrder)],
      }),
      db.query.socialLinks.findMany({
        where: eq(socialLinks.active, true),
        orderBy: [asc(socialLinks.sortOrder)],
      }),
      db.query.companyLocations.findMany({
        where: eq(companyLocations.active, true),
      }),
    ]);

    return NextResponse.json({
      data: {
        contacts: contactsResult,
        socialLinks: socialLinksResult,
        locations: locationsResult,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);

    // Fallback data
    const fallbackData = {
      contacts: [
        { type: 'support', label: 'Email Support', email: 'support@tesserix.app' },
        { type: 'sales', label: 'Sales', email: 'sales@tesserix.app' },
      ],
      socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com/tesserix' },
        { platform: 'instagram', url: 'https://instagram.com/tesserix' },
      ],
      locations: [
        { name: 'Tesserix HQ', city: 'Mumbai', country: 'India' },
      ],
    };

    return NextResponse.json({
      data: fallbackData,
      source: 'fallback',
    });
  }
}
