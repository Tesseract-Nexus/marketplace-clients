import { NextResponse } from 'next/server';
import { db } from '@/db';
import { features } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageContext = searchParams.get('page');

  try {
    const conditions = [eq(features.active, true)];

    if (pageContext) {
      conditions.push(eq(features.pageContext, pageContext));
    }

    const result = await db.query.features.findMany({
      where: and(...conditions),
      orderBy: [asc(features.sortOrder)],
    });

    return NextResponse.json({
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching features:', error);

    // Fallback data
    const fallbackFeatures = [
      {
        title: 'Make It Yours',
        description: 'Beautiful themes you can customize to match your brand.',
        iconName: 'Package',
      },
      {
        title: 'Sell Everywhere',
        description: 'Accept payments from customers around the world.',
        iconName: 'CreditCard',
      },
    ];

    return NextResponse.json({
      data: fallbackFeatures,
      source: 'fallback',
    });
  }
}
