import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { trustBadges } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageContext = searchParams.get('page');

  try {
    const db = await getDb();
    const conditions = [eq(trustBadges.active, true)];

    if (pageContext) {
      conditions.push(eq(trustBadges.pageContext, pageContext));
    }

    const result = await db.query.trustBadges.findMany({
      where: and(...conditions),
      orderBy: [asc(trustBadges.sortOrder)],
    });

    return NextResponse.json({
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching trust badges:', error);

    // Fallback data
    const fallbackBadges = [
      { label: 'No Developer Needed', iconName: 'Users' },
      { label: 'SSL Secured', iconName: 'Shield' },
      { label: '99.9% Uptime', iconName: 'Zap' },
      { label: '24/7 Support', iconName: 'Clock' },
    ];

    return NextResponse.json({
      data: fallbackBadges,
      source: 'fallback',
    });
  }
}
