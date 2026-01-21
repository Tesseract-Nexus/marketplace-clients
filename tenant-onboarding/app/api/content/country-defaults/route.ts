import { NextResponse } from 'next/server';
import { db } from '@/db';
import { countryDefaults } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.query.countryDefaults.findMany({
      where: eq(countryDefaults.active, true),
      orderBy: [asc(countryDefaults.countryName)],
    });

    return NextResponse.json({
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching country defaults:', error);

    // Fallback data - most common countries
    const fallbackCountries = [
      { countryCode: 'IN', countryName: 'India', defaultCurrency: 'INR', defaultTimezone: 'Asia/Kolkata' },
      { countryCode: 'US', countryName: 'United States', defaultCurrency: 'USD', defaultTimezone: 'America/New_York' },
      { countryCode: 'GB', countryName: 'United Kingdom', defaultCurrency: 'GBP', defaultTimezone: 'Europe/London' },
    ];

    return NextResponse.json({
      data: fallbackCountries,
      source: 'fallback',
    });
  }
}
