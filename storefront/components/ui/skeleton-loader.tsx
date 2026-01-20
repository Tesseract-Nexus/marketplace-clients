'use client';

import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  count?: number;
}

export function SkeletonLoader({
  className,
  variant = 'default',
  count = 1,
}: SkeletonLoaderProps) {
  const baseClass = 'animate-pulse bg-muted rounded';

  const variantClasses = {
    default: 'h-4 w-full',
    card: 'h-48 w-full rounded-xl',
    text: 'h-4 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClass, variantClasses[variant], className)}
        />
      ))}
    </>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-md overflow-hidden bg-white border border-stone-200">
      <div className="aspect-square bg-stone-50 animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-stone-100 rounded animate-pulse w-16" />
        <div className="h-4 bg-stone-100 rounded animate-pulse w-full" />
        <div className="h-4 bg-stone-100 rounded animate-pulse w-3/4" />
        <div className="h-5 bg-stone-100 rounded animate-pulse w-20 mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CheckoutStepSkeleton() {
  return (
    <div className="space-y-4 p-6 border rounded-xl">
      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      <div className="space-y-3">
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
