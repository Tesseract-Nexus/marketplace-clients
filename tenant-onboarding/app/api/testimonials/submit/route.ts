import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { testimonials } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || '';

// Validate that the request comes from a trusted internal service
function validateInternalAuth(request: NextRequest): boolean {
  if (!INTERNAL_SERVICE_KEY) return true; // Skip if not configured (dev)
  const key = request.headers.get('X-Internal-Service-Key');
  return key === INTERNAL_SERVICE_KEY;
}

// Helper to extract tenant info from request headers (set by admin portal BFF)
function getTenantFromRequest(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');
  const tenantName = request.headers.get('X-Tenant-Name');
  const tenantCompany = request.headers.get('X-Tenant-Company');

  return { tenantId, tenantName, tenantCompany };
}

// GET - Get tenant's own testimonial
export async function GET(request: NextRequest) {
  if (!validateInternalAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { tenantId } = getTenantFromRequest(request);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const db = await getDb();
    const result = await db.query.testimonials.findFirst({
      where: eq(testimonials.tenantId, tenantId),
    });

    return NextResponse.json({ data: result || null });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 });
  }
}

// POST - Submit new testimonial (one per tenant)
export async function POST(request: NextRequest) {
  if (!validateInternalAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { tenantId, tenantName, tenantCompany } = getTenantFromRequest(request);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const db = await getDb();

    // Check if tenant already has a testimonial
    const existing = await db.query.testimonials.findFirst({
      where: eq(testimonials.tenantId, tenantId),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a testimonial. Please edit your existing one.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { quote, role, rating } = body;

    // Validation
    if (!quote || quote.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide a testimonial with at least 20 characters' },
        { status: 400 }
      );
    }

    if (quote.length > 500) {
      return NextResponse.json(
        { error: 'Testimonial must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Generate initials from name
    const initials = (tenantName || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const [newTestimonial] = await db
      .insert(testimonials)
      .values({
        quote: quote.trim(),
        name: tenantName || 'Anonymous',
        role: role || 'Founder',
        company: tenantCompany || '',
        initials,
        rating: Math.min(5, Math.max(1, rating || 5)),
        tenantId,
        status: 'pending',
        submittedAt: new Date(),
        active: false, // Will be activated upon approval
        pageContext: null, // Will be set upon approval
        sortOrder: 999, // Will be adjusted upon approval
      })
      .returning();

    return NextResponse.json(
      {
        data: newTestimonial,
        message: 'Thank you! Your testimonial has been submitted and is pending review.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }
}

// PUT - Update existing testimonial
export async function PUT(request: NextRequest) {
  if (!validateInternalAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { tenantId } = getTenantFromRequest(request);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const db = await getDb();

    // Find tenant's testimonial
    const existing = await db.query.testimonials.findFirst({
      where: eq(testimonials.tenantId, tenantId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No testimonial found. Please submit a new one.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { quote, role, rating } = body;

    // Validation
    if (!quote || quote.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide a testimonial with at least 20 characters' },
        { status: 400 }
      );
    }

    if (quote.length > 500) {
      return NextResponse.json(
        { error: 'Testimonial must be 500 characters or less' },
        { status: 400 }
      );
    }

    // If editing after approval, set back to pending for re-review
    const newStatus = existing.status === 'approved' ? 'pending' : existing.status;

    const [updated] = await db
      .update(testimonials)
      .set({
        quote: quote.trim(),
        role: role || existing.role,
        rating: Math.min(5, Math.max(1, rating || existing.rating || 5)),
        status: newStatus,
        submittedAt: new Date(),
        // Clear review notes if resubmitting after revision
        revisionNotes: newStatus === 'pending' ? null : existing.revisionNotes,
      })
      .where(eq(testimonials.id, existing.id))
      .returning();

    const message = newStatus === 'pending' && existing.status === 'approved'
      ? 'Your testimonial has been updated and is pending re-review.'
      : 'Your testimonial has been updated.';

    return NextResponse.json({ data: updated, message });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}
