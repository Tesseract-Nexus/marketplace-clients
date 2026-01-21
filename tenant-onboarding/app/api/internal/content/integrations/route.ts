import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { integrations, integrationFeatures } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List all integrations with features
export async function GET(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const result = await db.query.integrations.findMany({
      orderBy: [asc(integrations.sortOrder)],
      with: {
        features: {
          orderBy: [asc(integrationFeatures.sortOrder)],
        },
      },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST - Create new integration
export async function POST(request: NextRequest) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const body = await request.json();
    const { name, category, description, logoUrl, status, sortOrder } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const [newIntegration] = await db
      .insert(integrations)
      .values({
        name,
        category,
        description,
        logoUrl,
        status: status || 'active',
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json({ data: newIntegration }, { status: 201 });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
  }
}
