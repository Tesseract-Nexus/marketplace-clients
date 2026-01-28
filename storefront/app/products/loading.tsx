'use client';

import { ProductCardSkeleton, SkeletonShimmer } from '@/components/ui/skeleton';

/**
 * Products page loading skeleton
 */
export default function ProductsLoading() {
  return (
    <div className="min-h-screen">
      {/* Page header skeleton */}
      <div className="bg-gradient-to-b from-muted/50 to-background py-8 md:py-12 px-4">
        <div className="container-tenant">
          <SkeletonShimmer className="h-10 w-48 rounded-lg mb-2" />
          <SkeletonShimmer className="h-5 w-64 rounded" />
        </div>
      </div>

      <div className="container-tenant py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters skeleton */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="space-y-6">
              {/* Filter sections */}
              {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-3">
                  <SkeletonShimmer className="h-5 w-24 rounded" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <SkeletonShimmer className="h-4 w-4 rounded" />
                        <SkeletonShimmer className="h-4 w-20 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Price range */}
              <div className="space-y-3">
                <SkeletonShimmer className="h-5 w-24 rounded" />
                <SkeletonShimmer className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <SkeletonShimmer className="h-4 w-12 rounded" />
                  <SkeletonShimmer className="h-4 w-12 rounded" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Toolbar skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <SkeletonShimmer className="h-5 w-32 rounded" />
              <div className="flex items-center gap-3">
                <SkeletonShimmer className="h-9 w-32 rounded-md" />
                <SkeletonShimmer className="h-9 w-9 rounded-md" />
                <SkeletonShimmer className="h-9 w-9 rounded-md" />
              </div>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonShimmer key={i} className="h-10 w-10 rounded-md" />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
