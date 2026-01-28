'use client';

import { ProductCardSkeleton, SkeletonShimmer } from '@/components/ui/skeleton';

/**
 * Homepage loading skeleton - shown during client-side navigation
 */
export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero section skeleton */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden">
        {/* Background gradient using tenant colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-tenant-primary/10 via-tenant-secondary/10 to-tenant-accent/5" />

        {/* Content skeleton */}
        <div className="container-tenant relative z-10 py-12 sm:py-16 md:py-20 px-4">
          <div className="max-w-2xl space-y-6">
            {/* Badge skeleton */}
            <SkeletonShimmer className="h-8 w-48 rounded-full" />

            {/* Title skeleton */}
            <div className="space-y-3">
              <SkeletonShimmer className="h-10 sm:h-12 md:h-14 w-full max-w-xl rounded-lg" />
              <SkeletonShimmer className="h-10 sm:h-12 md:h-14 w-3/4 rounded-lg" />
            </div>

            {/* Subtitle skeleton */}
            <SkeletonShimmer className="h-6 w-full max-w-md rounded" />

            {/* CTA buttons skeleton */}
            <div className="flex flex-wrap gap-4 pt-4">
              <SkeletonShimmer className="h-12 w-36 rounded-lg bg-tenant-primary/20" />
              <SkeletonShimmer className="h-12 w-36 rounded-lg" />
            </div>

            {/* Stats skeleton */}
            <div className="flex flex-wrap gap-8 pt-8 mt-8 border-t border-border/30">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonShimmer className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <SkeletonShimmer className="h-6 w-16 rounded" />
                    <SkeletonShimmer className="h-3 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured products section skeleton */}
      <section className="py-12 md:py-16 px-4">
        <div className="container-tenant">
          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <SkeletonShimmer className="h-8 w-48 rounded-lg" />
            <SkeletonShimmer className="h-4 w-24 rounded" />
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories section skeleton */}
      <section className="py-12 md:py-16 px-4 bg-muted/30">
        <div className="container-tenant">
          <div className="flex items-center justify-between mb-8">
            <SkeletonShimmer className="h-8 w-40 rounded-lg" />
            <SkeletonShimmer className="h-4 w-20 rounded" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonShimmer key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
