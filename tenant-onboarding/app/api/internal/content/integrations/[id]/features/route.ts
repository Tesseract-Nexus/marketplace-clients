import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { integrationFeatures, integrations } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdminAuth } from '@/lib/admin-auth';

// GET - List features for an integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();

    const integration = await db.query.integrations.findFirst({
      where: eq(integrations.id, id),
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const result = await db.query.integrationFeatures.findMany({
      where: eq(integrationFeatures.integrationId, id),
      orderBy: [asc(integrationFeatures.sortOrder)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching integration features:', error);
    return NextResponse.json({ error: 'Failed to fetch integration features' }, { status: 500 });
  }
}

// POST - Add a feature to an integration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await validateAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const db = await getDb();

    const integration = await db.query.integrations.findFirst({
      where: eq(integrations.id, id),
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const body = await request.json();
    const { feature, sortOrder } = body;

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature text is required' },
        { status: 400 }
      );
    }

    const [newFeature] = await db
      .insert(integrationFeatures)
      .values({
        integrationId: id,
        feature,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json({ data: newFeature }, { status: 201 });
  } catch (error) {
    console.error('Error creating integration feature:', error);
    return NextResponse.json({ error: 'Failed to create integration feature' }, { status: 500 });
  }
}
