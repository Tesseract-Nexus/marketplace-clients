'use client';

import { Suspense, lazy, type ComponentType } from 'react';
import { type BlockConfig } from '@/types/blocks';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// BLOCK COMPONENT TYPES
// =============================================================================

export type BlockComponentProps<T extends BlockConfig = BlockConfig> = {
  config: T;
};

// =============================================================================
// LAZY LOAD BLOCK COMPONENTS
// =============================================================================

// Hero blocks
const HeroBlock = lazy(() => import('./hero/HeroBlock'));

// Product blocks
const FeaturedProductsBlock = lazy(() => import('./products/FeaturedProductsBlock'));
const DealsCarouselBlock = lazy(() => import('./products/DealsCarouselBlock'));

// Collection blocks
const CollectionStoriesBlock = lazy(() => import('./collections/CollectionStoriesBlock'));
const EditorialCardsBlock = lazy(() => import('./collections/EditorialCardsBlock'));

// Navigation blocks
const CategoryGridBlock = lazy(() => import('./navigation/CategoryGridBlock'));
const ActivityHubBlock = lazy(() => import('./navigation/ActivityHubBlock'));

// Content blocks
const UGCGalleryBlock = lazy(() => import('./content/UGCGalleryBlock'));
const ServicePromosBlock = lazy(() => import('./content/ServicePromosBlock'));
const NewsletterBlock = lazy(() => import('./content/NewsletterBlock'));
const TestimonialsBlock = lazy(() => import('./content/TestimonialsBlock'));
const BrandShowcaseBlock = lazy(() => import('./content/BrandShowcaseBlock'));
const ContentCardsBlock = lazy(() => import('./content/ContentCardsBlock'));

// Campaign blocks
const CampaignRailBlock = lazy(() => import('./campaign/CampaignRailBlock'));
const BannerStripBlock = lazy(() => import('./campaign/BannerStripBlock'));
const CountdownBannerBlock = lazy(() => import('./campaign/CountdownBannerBlock'));
const LoyaltyBannerBlock = lazy(() => import('./campaign/LoyaltyBannerBlock'));

// Special blocks
const VideoHeroBlock = lazy(() => import('./hero/VideoHeroBlock'));
const CustomHtmlBlock = lazy(() => import('./special/CustomHtmlBlock'));

// =============================================================================
// BLOCK REGISTRY
// =============================================================================

const BLOCK_COMPONENTS: Record<string, ComponentType<BlockComponentProps<any>>> = {
  hero: HeroBlock,
  'featured-products': FeaturedProductsBlock,
  'deals-carousel': DealsCarouselBlock,
  'collection-stories': CollectionStoriesBlock,
  'editorial-cards': EditorialCardsBlock,
  'category-grid': CategoryGridBlock,
  'activity-hub': ActivityHubBlock,
  'ugc-gallery': UGCGalleryBlock,
  'service-promos': ServicePromosBlock,
  newsletter: NewsletterBlock,
  'campaign-rail': CampaignRailBlock,
  'banner-strip': BannerStripBlock,
  testimonials: TestimonialsBlock,
  'brand-showcase': BrandShowcaseBlock,
  'content-cards': ContentCardsBlock,
  'video-hero': VideoHeroBlock,
  'countdown-banner': CountdownBannerBlock,
  'loyalty-banner': LoyaltyBannerBlock,
  'custom-html': CustomHtmlBlock,
};

// =============================================================================
// LOADING FALLBACKS
// =============================================================================

function HeroSkeleton() {
  return (
    <div className="min-h-[60vh] bg-muted/30 animate-pulse flex items-center">
      <div className="container-tenant py-16">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-96 max-w-full mb-4" />
        <Skeleton className="h-6 w-72 max-w-full mb-8" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="py-12">
      <div className="container-tenant">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="py-12">
      <div className="container-tenant">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="flex-none w-48 h-64 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="py-12">
      <div className="container-tenant">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="py-12">
      <div className="container-tenant">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}

function BannerSkeleton() {
  return <Skeleton className="h-12 w-full" />;
}

// Map block types to their loading skeletons
const BLOCK_SKELETONS: Record<string, React.ReactNode> = {
  hero: <HeroSkeleton />,
  'video-hero': <HeroSkeleton />,
  'featured-products': <ProductGridSkeleton />,
  'deals-carousel': <CarouselSkeleton />,
  'collection-stories': <GridSkeleton />,
  'editorial-cards': <GridSkeleton />,
  'category-grid': <GridSkeleton />,
  'activity-hub': <GridSkeleton />,
  'ugc-gallery': <GridSkeleton />,
  'service-promos': <GridSkeleton />,
  newsletter: <ContentSkeleton />,
  'campaign-rail': <CarouselSkeleton />,
  'banner-strip': <BannerSkeleton />,
  testimonials: <CarouselSkeleton />,
  'brand-showcase': <GridSkeleton />,
  'content-cards': <GridSkeleton />,
  'countdown-banner': <ContentSkeleton />,
  'loyalty-banner': <ContentSkeleton />,
  'custom-html': <ContentSkeleton />,
};

// =============================================================================
// BLOCK RENDERER
// =============================================================================

interface BlockRendererProps {
  block: BlockConfig;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const Component = BLOCK_COMPONENTS[block.type];
  const skeleton = BLOCK_SKELETONS[block.type] || <ContentSkeleton />;

  if (!Component) {
    // Fallback for unknown block types
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="py-8 px-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-700 font-medium">Unknown block type: {block.type}</p>
          <p className="text-yellow-600 text-sm mt-1">Block ID: {block.id}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <Suspense fallback={skeleton}>
      <Component config={block} />
    </Suspense>
  );
}

export default BlockRenderer;
