import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { faqs } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageContext = searchParams.get('page');

  try {
    const db = await getDb();
    const result = await db.query.faqs.findMany({
      where: pageContext ? eq(faqs.pageContext, pageContext) : eq(faqs.active, true),
      orderBy: [asc(faqs.sortOrder)],
      with: {
        category: true,
      },
    });

    return NextResponse.json({
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);

    // Fallback data
    const fallbackFaqs = [
      {
        question: "I'm not very technical. Can I still use this?",
        answer: "Absolutely. We built this for people who want to focus on their business, not on learning software.",
      },
      {
        question: 'What happens after the 12 months free?',
        answer: "After your free year, it's just ₹499/month. That's it—no hidden fees.",
      },
    ];

    return NextResponse.json({
      data: fallbackFaqs,
      source: 'fallback',
    });
  }
}
