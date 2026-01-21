import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-warm-200/50',
        className
      )}
    />
  );
}

// FAQ Skeleton
export function FaqSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl bg-white border border-warm-200 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Feature Card Skeleton
export function FeatureCardSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white border border-warm-200">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function FeaturesSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <FeatureCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Testimonial Skeleton
export function TestimonialCardSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white border border-warm-200">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-4 h-4 rounded" />
        ))}
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <TestimonialCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Trust Badge Skeleton
export function TrustBadgesSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// Pricing Skeleton
export function PricingSkeleton() {
  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-8 sm:p-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-1/2">
          <Skeleton className="h-16 w-32 mb-2" />
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-20 w-full rounded-lg mb-8" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <div className="lg:w-1/2 lg:border-l lg:border-warm-200 lg:pl-10">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Integration Card Skeleton
export function IntegrationCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white border border-warm-200">
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegrationsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <IntegrationCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Contact Card Skeleton
export function ContactCardSkeleton() {
  return (
    <div className="p-6 bg-white border border-warm-200 rounded-xl">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function ContactsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <ContactCardSkeleton key={i} />
      ))}
    </div>
  );
}
