import { NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  try {
    const result = await db.query.integrations.findMany({
      where: eq(integrations.active, true),
      orderBy: [asc(integrations.category), asc(integrations.sortOrder)],
      with: {
        features: {
          orderBy: (features, { asc }) => [asc(features.sortOrder)],
        },
      },
    });

    // Filter by category or status if provided
    let filtered = result;
    if (category) {
      filtered = filtered.filter((i) => i.category === category);
    }
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Group by category
    const grouped = filtered.reduce(
      (acc, integration) => {
        const cat = integration.category;
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(integration);
        return acc;
      },
      {} as Record<string, typeof filtered>
    );

    return NextResponse.json({
      data: {
        all: filtered,
        byCategory: grouped,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);

    // Fallback data
    const fallbackIntegrations = {
      all: [
        {
          name: 'Razorpay',
          category: 'payments',
          description: 'UPI, cards, netbanking, wallets',
          status: 'active',
          features: [{ feature: 'UPI & QR payments' }],
        },
      ],
      byCategory: {
        payments: [
          {
            name: 'Razorpay',
            category: 'payments',
            description: 'UPI, cards, netbanking, wallets',
            status: 'active',
          },
        ],
      },
    };

    return NextResponse.json({
      data: fallbackIntegrations,
      source: 'fallback',
    });
  }
}
