import { NextRequest, NextResponse } from 'next/server';
import { getLayoutTemplate } from '@/lib/layouts';
import type { PageLayout, LayoutTemplate } from '@/types/blocks';

/**
 * GET /api/layouts
 *
 * Fetch page layout by slug. Falls back to template if no custom layout exists.
 *
 * Query params:
 * - slug: Page slug (e.g., 'home', 'landing-summer')
 * - template: Template ID to use as fallback
 * - preview: If 'true', return draft layouts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'home';
    const templateId = searchParams.get('template') as LayoutTemplate | null;
    const preview = searchParams.get('preview') === 'true';

    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    // In a full implementation, you would:
    // 1. Check tenant's custom layouts in the database
    // 2. Check tenant's homepage config for block-based sections
    // 3. Fall back to template

    // For now, try to fetch from tenant's homepage config
    let customLayout: PageLayout | null = null;

    if (tenantId && storefrontId && slug === 'home') {
      customLayout = await fetchTenantHomepageLayout(tenantId, storefrontId, preview);
    }

    if (customLayout) {
      return NextResponse.json({
        layout: customLayout,
        source: 'custom',
      });
    }

    // Fall back to template
    const fallbackTemplate = templateId || detectBestTemplate(tenantId);
    const template = getLayoutTemplate(fallbackTemplate);

    // Clone and customize the template layout
    const layout: PageLayout = {
      ...template.defaultLayout,
      id: `${fallbackTemplate}-${tenantId || 'default'}`,
    };

    return NextResponse.json({
      layout,
      source: 'template',
      templateId: fallbackTemplate,
    });
  } catch (error) {
    console.error('Error fetching layout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}

/**
 * Fetch tenant's custom homepage layout from their config
 */
async function fetchTenantHomepageLayout(
  tenantId: string,
  storefrontId: string,
  preview: boolean
): Promise<PageLayout | null> {
  try {
    // In a full implementation, this would fetch from:
    // 1. A layouts table in the database
    // 2. The tenant's storefront settings
    // 3. A CMS or content service

    // For now, return null to use template fallback
    // This is where you would integrate with your backend

    // Example implementation:
    // const layoutData = await db.pageLayout.findFirst({
    //   where: {
    //     tenantId,
    //     storefrontId,
    //     slug: 'home',
    //     status: preview ? { in: ['draft', 'published'] } : 'published',
    //   },
    //   orderBy: { version: 'desc' },
    // });
    //
    // if (layoutData) {
    //   return layoutData.config as PageLayout;
    // }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect the best template for a tenant based on their industry/category
 */
function detectBestTemplate(tenantId: string | null): LayoutTemplate {
  // In a full implementation, you would:
  // 1. Look up tenant's industry/category
  // 2. Check their existing content types
  // 3. Return the most appropriate template

  // For now, return the editorial template as default
  return 'myntra-editorial';
}

/**
 * POST /api/layouts
 *
 * Save a custom page layout for the tenant.
 * Requires authentication and admin permissions.
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId || !storefrontId) {
      return NextResponse.json(
        { error: 'Missing tenant context' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { layout, publish = false } = body;

    if (!layout || !layout.sections) {
      return NextResponse.json(
        { error: 'Invalid layout data' },
        { status: 400 }
      );
    }

    // Validate layout structure
    const validationResult = validateLayout(layout);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: 'Invalid layout', details: validationResult.errors },
        { status: 400 }
      );
    }

    // In a full implementation, you would:
    // 1. Authenticate the user
    // 2. Check admin permissions
    // 3. Save to database with versioning
    // 4. Optionally publish immediately

    // Example implementation:
    // const savedLayout = await db.pageLayout.create({
    //   data: {
    //     tenantId,
    //     storefrontId,
    //     slug: layout.slug,
    //     name: layout.name,
    //     type: layout.type,
    //     config: layout,
    //     status: publish ? 'published' : 'draft',
    //     version: 1,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: publish ? 'Layout published' : 'Layout saved as draft',
      layout,
    });
  } catch (error) {
    console.error('Error saving layout:', error);
    return NextResponse.json(
      { error: 'Failed to save layout' },
      { status: 500 }
    );
  }
}

/**
 * Validate a layout configuration
 */
function validateLayout(layout: PageLayout): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!layout.id) errors.push('Layout ID is required');
  if (!layout.slug) errors.push('Layout slug is required');
  if (!layout.name) errors.push('Layout name is required');
  if (!Array.isArray(layout.sections)) errors.push('Layout sections must be an array');

  // Validate each section
  if (layout.sections) {
    layout.sections.forEach((section, sectionIndex) => {
      if (!section.id) {
        errors.push(`Section ${sectionIndex} is missing ID`);
      }
      if (!Array.isArray(section.blocks)) {
        errors.push(`Section ${sectionIndex} blocks must be an array`);
      }

      // Validate each block
      section.blocks?.forEach((block, blockIndex) => {
        if (!block.id) {
          errors.push(`Section ${sectionIndex}, Block ${blockIndex} is missing ID`);
        }
        if (!block.type) {
          errors.push(`Section ${sectionIndex}, Block ${blockIndex} is missing type`);
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
