/**
 * Page Layout Service
 *
 * Manages JSON-driven page layouts for the storefront.
 * Layouts can be fetched from API, stored in tenant config, or use preset templates.
 */

import type {
  PageLayout,
  PageSection,
  BlockConfig,
  LayoutTemplate,
  LayoutTemplateConfig,
} from '@/types/blocks';

// =============================================================================
// LAYOUT FETCHING
// =============================================================================

export interface FetchLayoutOptions {
  tenantId: string;
  storefrontId: string;
  slug: string;
  locale?: string;
  preview?: boolean;
}

/**
 * Fetch a page layout by slug
 */
export async function fetchPageLayout(
  options: FetchLayoutOptions
): Promise<PageLayout | null> {
  const { tenantId, storefrontId, slug, locale, preview } = options;

  try {
    const params = new URLSearchParams({
      slug,
      ...(locale && { locale }),
      ...(preview && { preview: 'true' }),
    });

    const response = await fetch(`/api/layouts?${params.toString()}`, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      next: {
        revalidate: preview ? 0 : 60, // Cache for 1 minute in production
        tags: [`layout-${slug}`, `tenant-${tenantId}`],
      },
    });

    if (!response.ok) {
      console.warn(`Layout not found for slug: ${slug}`);
      return null;
    }

    const data = await response.json();
    return data.layout as PageLayout;
  } catch (error) {
    console.error('Failed to fetch page layout:', error);
    return null;
  }
}

/**
 * Fetch layout from tenant homepage config (legacy support)
 */
export async function fetchHomepageLayout(
  tenantId: string,
  storefrontId: string
): Promise<PageLayout | null> {
  try {
    const response = await fetch('/api/storefront/homepage-config', {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      next: {
        revalidate: 60,
        tags: [`homepage-${tenantId}`],
      },
    });

    if (!response.ok) return null;

    const config = await response.json();

    // Check if tenant has block-based layout in homepageConfig
    if (config.sections && Array.isArray(config.sections)) {
      return {
        id: `homepage-${tenantId}`,
        name: 'Homepage',
        slug: 'home',
        type: 'home',
        sections: config.sections,
        status: 'published',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// LAYOUT TEMPLATES
// =============================================================================

export { getLayoutTemplate, getLayoutTemplates, LAYOUT_TEMPLATES } from './templates';

// =============================================================================
// LAYOUT UTILITIES
// =============================================================================

/**
 * Merge layout with overrides (for personalization, A/B testing, etc.)
 */
export function mergeLayoutOverrides(
  baseLayout: PageLayout,
  overrides: Partial<PageLayout>
): PageLayout {
  return {
    ...baseLayout,
    ...overrides,
    sections: overrides.sections || baseLayout.sections,
  };
}

/**
 * Filter sections based on visibility rules
 */
export function filterVisibleSections(
  sections: PageSection[],
  context: {
    device: 'mobile' | 'tablet' | 'desktop';
    userCohorts?: string[];
    currentTime?: Date;
  }
): PageSection[] {
  const { device, userCohorts = [], currentTime = new Date() } = context;

  return sections.filter((section) => {
    // Check enabled
    if (!section.enabled) return false;

    // Check device visibility
    if (device === 'mobile' && section.showOnMobile === false) return false;
    if (device === 'tablet' && section.showOnTablet === false) return false;
    if (device === 'desktop' && section.showOnDesktop === false) return false;

    // Check schedule
    if (section.schedule?.enabled) {
      const { startDate, endDate } = section.schedule;
      if (startDate && currentTime < new Date(startDate)) return false;
      if (endDate && currentTime > new Date(endDate)) return false;
    }

    // Check personalization
    if (section.personalization?.enabled && section.personalization.targetCohorts) {
      const hasMatchingCohort = section.personalization.targetCohorts.some(
        (cohort) => userCohorts.includes(cohort)
      );
      if (!hasMatchingCohort) return false;
    }

    return true;
  });
}

/**
 * Extract all product IDs referenced in a layout (for prefetching)
 */
export function extractProductIds(layout: PageLayout): string[] {
  const productIds: Set<string> = new Set();

  for (const section of layout.sections) {
    for (const block of section.blocks) {
      if ('source' in block) {
        const source = (block as any).source;
        if (source?.productIds) {
          source.productIds.forEach((id: string) => productIds.add(id));
        }
      }
      if ('productId' in block) {
        productIds.add((block as any).productId);
      }
    }
  }

  return Array.from(productIds);
}

/**
 * Extract all category IDs referenced in a layout (for prefetching)
 */
export function extractCategoryIds(layout: PageLayout): string[] {
  const categoryIds: Set<string> = new Set();

  for (const section of layout.sections) {
    for (const block of section.blocks) {
      if ('source' in block) {
        const source = (block as any).source;
        if (source?.categoryId) {
          categoryIds.add(source.categoryId);
        }
        if (source?.categories) {
          source.categories.forEach((cat: any) => {
            if (cat.categoryId) categoryIds.add(cat.categoryId);
          });
        }
      }
    }
  }

  return Array.from(categoryIds);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { PageLayout, PageSection, BlockConfig, LayoutTemplate, LayoutTemplateConfig };
