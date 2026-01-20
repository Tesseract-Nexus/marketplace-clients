import { cn } from "@/lib/utils"

// Basic pulsing skeleton
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Shimmer skeleton with animated gradient
function SkeletonShimmer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-shimmer"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

// Product card skeleton with shimmer - clean editorial style
function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-md overflow-hidden bg-white border border-stone-200", className)}>
      <div className="aspect-square w-full bg-stone-50">
        <SkeletonShimmer className="h-full w-full" />
      </div>
      <div className="p-4 space-y-2.5">
        <SkeletonShimmer className="h-3 w-16 rounded" />
        <SkeletonShimmer className="h-4 w-full rounded" />
        <SkeletonShimmer className="h-4 w-3/4 rounded" />
        <div className="flex items-center gap-1 pt-1">
          {[...Array(5)].map((_, i) => (
            <SkeletonShimmer key={i} className="h-3.5 w-3.5 rounded-sm" />
          ))}
        </div>
        <SkeletonShimmer className="h-5 w-20 rounded mt-1" />
      </div>
    </div>
  )
}

// Category card skeleton
function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonShimmer className={cn("aspect-[4/3] rounded-2xl", className)} />
  )
}

// Text line skeleton
function TextSkeleton({
  lines = 1,
  className,
  lastLineWidth = "75%"
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(lines)].map((_, i) => (
        <SkeletonShimmer
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  )
}

// Avatar skeleton
function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14"
  }
  return <SkeletonShimmer className={cn("rounded-full", sizeClasses[size])} />
}

// Button skeleton
function ButtonSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-28",
    lg: "h-12 w-36"
  }
  return <SkeletonShimmer className={cn("rounded-md", sizeClasses[size])} />
}

// Table row skeleton
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {[...Array(columns)].map((_, i) => (
        <SkeletonShimmer
          key={i}
          className="h-4 flex-1"
          style={{ maxWidth: i === 0 ? '200px' : undefined }}
        />
      ))}
    </div>
  )
}

// Order card skeleton
function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonShimmer className="h-5 w-32" />
          <SkeletonShimmer className="h-4 w-24" />
        </div>
        <SkeletonShimmer className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <SkeletonShimmer key={i} className="h-16 w-16 rounded-md" />
        ))}
      </div>
      <div className="flex justify-between items-center pt-2">
        <SkeletonShimmer className="h-5 w-20" />
        <SkeletonShimmer className="h-9 w-28 rounded-md" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonShimmer,
  ProductCardSkeleton,
  CategoryCardSkeleton,
  TextSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  TableRowSkeleton,
  OrderCardSkeleton
}
