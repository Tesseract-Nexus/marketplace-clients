'use client';

import { SkeletonShimmer, ProductCardSkeleton } from '@/components/ui/skeleton';

/**
 * Product detail page loading skeleton
 */
export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb skeleton */}
      <div className="container-tenant py-4 px-4">
        <div className="flex items-center gap-2">
          <SkeletonShimmer className="h-4 w-12 rounded" />
          <span className="text-muted-foreground">/</span>
          <SkeletonShimmer className="h-4 w-16 rounded" />
          <span className="text-muted-foreground">/</span>
          <SkeletonShimmer className="h-4 w-24 rounded" />
        </div>
      </div>

      <div className="container-tenant py-8 px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image gallery skeleton */}
          <div className="space-y-4">
            {/* Main image */}
            <SkeletonShimmer className="aspect-square w-full rounded-xl" />

            {/* Thumbnail strip */}
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonShimmer key={i} className="h-20 w-20 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-6">
            {/* Brand & title */}
            <div className="space-y-2">
              <SkeletonShimmer className="h-4 w-24 rounded" />
              <SkeletonShimmer className="h-8 w-full max-w-md rounded-lg" />
              <SkeletonShimmer className="h-8 w-3/4 rounded-lg" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonShimmer key={i} className="h-5 w-5 rounded" />
                ))}
              </div>
              <SkeletonShimmer className="h-4 w-20 rounded" />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <SkeletonShimmer className="h-10 w-28 rounded-lg" />
              <SkeletonShimmer className="h-6 w-20 rounded" />
            </div>

            {/* Short description */}
            <div className="space-y-2">
              <SkeletonShimmer className="h-4 w-full rounded" />
              <SkeletonShimmer className="h-4 w-5/6 rounded" />
              <SkeletonShimmer className="h-4 w-4/6 rounded" />
            </div>

            {/* Variant selectors */}
            <div className="space-y-4 pt-4 border-t">
              {/* Size */}
              <div className="space-y-2">
                <SkeletonShimmer className="h-4 w-12 rounded" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonShimmer key={i} className="h-10 w-12 rounded-md" />
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <SkeletonShimmer className="h-4 w-12 rounded" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonShimmer key={i} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity & Add to cart */}
            <div className="flex items-center gap-4 pt-4">
              <SkeletonShimmer className="h-12 w-32 rounded-lg" />
              <SkeletonShimmer className="h-12 flex-1 rounded-lg bg-tenant-primary/20" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <SkeletonShimmer className="h-10 w-10 rounded-md" />
              <SkeletonShimmer className="h-10 w-10 rounded-md" />
              <SkeletonShimmer className="h-10 flex-1 rounded-md" />
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <SkeletonShimmer className="h-8 w-8 rounded-full" />
                  <SkeletonShimmer className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product tabs skeleton */}
        <div className="mt-12 space-y-6">
          <div className="flex gap-6 border-b">
            {['Description', 'Specifications', 'Reviews'].map((tab) => (
              <SkeletonShimmer key={tab} className="h-10 w-24 rounded-t" />
            ))}
          </div>
          <div className="space-y-4">
            <SkeletonShimmer className="h-4 w-full rounded" />
            <SkeletonShimmer className="h-4 w-full rounded" />
            <SkeletonShimmer className="h-4 w-5/6 rounded" />
            <SkeletonShimmer className="h-4 w-4/6 rounded" />
          </div>
        </div>

        {/* Related products skeleton */}
        <div className="mt-16 space-y-6">
          <SkeletonShimmer className="h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
