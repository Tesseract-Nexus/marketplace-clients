'use client';

import { Suspense } from 'react';
import { SectionComposer } from './SectionComposer';
import { usePageLayout, useLayoutVisibility } from '@/hooks/usePageLayout';
import { usePersonalization } from '@/hooks/usePersonalization';
import type { LayoutTemplate } from '@/types/blocks';

// =============================================================================
// HOME PAGE LAYOUT COMPONENT
// =============================================================================

interface HomePageLayoutProps {
  /** Initial layout data from server (if any) */
  initialLayout?: any;
  /** Template to use as fallback */
  fallbackTemplate?: LayoutTemplate;
  /** Enable preview mode (shows draft content) */
  preview?: boolean;
  /** Enable edit mode for admin */
  editMode?: boolean;
  /** Callback when a block is clicked in edit mode */
  onBlockClick?: (blockId: string, sectionId: string) => void;
}

export function HomePageLayout({
  initialLayout,
  fallbackTemplate = 'myntra-editorial',
  preview = false,
  editMode = false,
  onBlockClick,
}: HomePageLayoutProps) {
  const { layout, isLoading, error, refresh } = usePageLayout({
    slug: 'home',
    fallbackTemplate,
    preview,
  });

  const { userCohorts } = usePersonalization();
  const { visibleSections, device } = useLayoutVisibility(layout, { userCohorts });

  // Loading state
  if (isLoading && !initialLayout) {
    return <HomePageSkeleton />;
  }

  // Use fetched layout or initial layout
  const activeLayout = layout || initialLayout;

  if (!activeLayout) {
    return (
      <div className="container-tenant py-12 text-center">
        <p className="text-muted-foreground">Unable to load page layout</p>
        <button
          onClick={refresh}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="home-page-layout" data-device={device}>
      {editMode && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
          <span className="text-xs text-muted-foreground">
            {visibleSections.length} sections visible on {device}
          </span>
          <button
            onClick={refresh}
            className="text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
      )}
      <Suspense fallback={<HomePageSkeleton />}>
        <SectionComposer
          layout={activeLayout}
          previewMode={editMode}
          onBlockClick={onBlockClick}
        />
      </Suspense>
    </div>
  );
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

      {/* Newsletter skeleton */}
      <div className="bg-muted/50 py-16">
        <div className="container-tenant flex flex-col items-center">
          <div className="h-8 w-64 bg-muted rounded mb-4" />
          <div className="h-4 w-96 bg-muted rounded mb-8" />
          <div className="h-12 w-full max-w-md bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LAYOUT PREVIEW COMPONENT (for admin)
// =============================================================================

interface LayoutPreviewProps {
  templateId: LayoutTemplate;
  scale?: number;
}

export function LayoutPreview({ templateId, scale = 0.3 }: LayoutPreviewProps) {
  const { layout, isLoading } = usePageLayout({
    fallbackTemplate: templateId,
  });

  if (isLoading || !layout) {
    return (
      <div
        className="bg-muted rounded-lg animate-pulse"
        style={{
          height: `${300 * scale}px`,
          aspectRatio: '16/9',
        }}
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg border shadow-sm"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${100 / scale}%`,
        height: 'auto',
      }}
    >
      <div className="pointer-events-none">
        <SectionComposer layout={layout} />
      </div>
    </div>
  );
}

export default HomePageLayout;
