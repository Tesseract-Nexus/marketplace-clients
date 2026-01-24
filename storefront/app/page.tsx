import { headers } from 'next/headers';
import { Suspense } from 'react';
import { HomePageLayout } from '@/components/blocks/HomePageLayout';
import { HeroSection } from '@/components/storefront/HeroSection';
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { NewsletterSection } from '@/components/storefront/NewsletterSection';
import { PersonalizedOffers } from '@/components/marketing/PersonalizedOffers';
import { DynamicHomeSections } from '@/components/storefront/DynamicHomeSections';
import { getFeaturedProducts, getCategories } from '@/lib/api/storefront';
import { resolveTenantId } from '@/lib/tenant';
import type { LayoutTemplate, PageLayout } from '@/types/blocks';

// =============================================================================
// HOME PAGE
// =============================================================================

interface HomePageProps {
  searchParams?: Promise<{
    layout?: string;
    preview?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';
  const params = await searchParams;

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    return (
      <div className="container-tenant py-12 text-center">
        <p className="text-muted-foreground">Unable to load store data</p>
      </div>
    );
  }

  // Check if using new block-based layout system
  const useBlockLayout = params?.layout !== 'legacy';
  const previewMode = params?.preview === 'true';
  const templateId = (params?.layout as LayoutTemplate) || 'myntra-editorial';

  // Fetch tenant's layout configuration
  const layoutConfig = await fetchTenantLayoutConfig(tenantId, slug);

  if (useBlockLayout && layoutConfig?.useBlockLayout !== false) {
    // Use new block-based layout system
    return (
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageLayout
          fallbackTemplate={layoutConfig?.defaultTemplate || templateId}
          preview={previewMode}
        />
      </Suspense>
    );
  }

  // Legacy layout: Use traditional components with dynamic section rendering
  const [products, categories] = await Promise.all([
    getFeaturedProducts(tenantId, tenantId, 8).catch(() => []),
    getCategories(tenantId, tenantId).catch(() => []),
  ]);

  return (
    <>
      {/* Hero Section - handles its own visibility based on homepageConfig.heroEnabled */}
      <HeroSection />

      {/* Dynamic sections from homepageConfig.sections */}
      <DynamicHomeSections products={products || []} categories={categories || []} />

      {/* Personalized offers - always shown if available */}
      <section className="py-12 bg-muted/30">
        <div className="container-tenant">
          <PersonalizedOffers limit={4} />
        </div>
      </section>
    </>
  );
}

// =============================================================================
// LAYOUT CONFIG FETCHER
// =============================================================================

interface TenantLayoutConfig {
  useBlockLayout?: boolean;
  defaultTemplate?: LayoutTemplate;
  customLayout?: PageLayout;
}

async function fetchTenantLayoutConfig(
  tenantId: string,
  slug: string
): Promise<TenantLayoutConfig | null> {
  try {
    // In production, this would fetch from tenant's settings
    // For now, use legacy layout until block system is fully ready
    // To test block layout, add ?layout=myntra-editorial to URL
    return {
      useBlockLayout: false,
      defaultTemplate: 'myntra-editorial',
    };
  } catch {
    return null;
  }
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[70vh] bg-muted" />

      {/* Featured products skeleton */}
      <div className="container-tenant py-12">
        <div className="h-8 w-48 bg-muted rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="container-tenant py-12">
        <div className="h-8 w-48 bg-muted rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';

  return {
    title: 'Home | Your Store',
    description: 'Discover amazing products at great prices.',
    openGraph: {
      title: 'Home | Your Store',
      description: 'Discover amazing products at great prices.',
      type: 'website',
    },
  };
}
