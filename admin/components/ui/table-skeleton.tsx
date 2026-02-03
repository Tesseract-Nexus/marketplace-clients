'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show checkbox column */
  hasCheckbox?: boolean;
  /** Show actions column */
  hasActions?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * TableSkeleton - Skeleton loader for data tables
 *
 * Shows the structure of incoming table data to reduce perceived wait time.
 *
 * Usage:
 * ```tsx
 * // Basic table skeleton
 * <TableSkeleton rows={5} columns={4} />
 *
 * // With checkbox and actions
 * <TableSkeleton rows={10} columns={3} hasCheckbox hasActions />
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasCheckbox = false,
  hasActions = false,
  className,
}: TableSkeletonProps) {
  const totalColumns = columns + (hasCheckbox ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={cn('w-full', className)} role="status" aria-label="Loading table data">
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          {hasCheckbox && (
            <Skeleton className="h-4 w-4 rounded" />
          )}
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className="h-4 flex-1"
              style={{ maxWidth: i === 0 ? '200px' : '150px' }}
            />
          ))}
          {hasActions && (
            <Skeleton className="h-4 w-16" />
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex items-center gap-4 px-4 py-4"
            style={{
              animationDelay: `${rowIndex * 50}ms`,
            }}
          >
            {hasCheckbox && (
              <Skeleton className="h-4 w-4 rounded" />
            )}
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn(
                  'h-4 flex-1',
                  colIndex === 0 && 'max-w-[200px]'
                )}
                style={{
                  width: `${60 + Math.random() * 40}%`,
                  maxWidth: colIndex === 0 ? '200px' : '150px',
                }}
              />
            ))}
            {hasActions && (
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            )}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading table data, please wait...</span>
    </div>
  );
}

/**
 * CardGridSkeleton - Skeleton loader for card grids (products, categories, etc.)
 */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div
      className={cn('grid gap-4', gridCols[columns], className)}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg overflow-hidden"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Image placeholder */}
          <Skeleton className="w-full aspect-square" />
          {/* Content */}
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}

/**
 * ListSkeleton - Skeleton for simple lists
 */
export function ListSkeleton({
  count = 5,
  hasAvatar = false,
  className,
}: {
  count?: number;
  hasAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {hasAvatar && (
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
      <span className="sr-only">Loading list, please wait...</span>
    </div>
  );
}

/**
 * DashboardSkeleton - Skeleton for dashboard stats and widgets
 */
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading dashboard">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Recent items */}
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <ListSkeleton count={5} />
      </div>

      <span className="sr-only">Loading dashboard, please wait...</span>
    </div>
  );
}

/**
 * FormSkeleton - Skeleton for form pages
 */
export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2" style={{ animationDelay: `${i * 50}ms` }}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
      <span className="sr-only">Loading form, please wait...</span>
    </div>
  );
}
