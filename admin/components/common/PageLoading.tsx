'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandedLoader } from '@/components/ui/branded-loader';

interface PageLoadingProps {
  /** Loading message to display */
  message?: string;
  /** Use full screen height - automatically uses branded loader */
  fullScreen?: boolean;
  /** Custom className for container */
  className?: string;
  /** Variant: 'spinner', 'refresh', or 'branded'. Defaults to 'branded' for fullScreen, 'spinner' otherwise */
  variant?: 'spinner' | 'refresh' | 'branded';
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Progress percentage for long operations (only with 'branded' variant) */
  progress?: number;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * PageLoading - Consistent loading state component
 *
 * Uses branded loader automatically for fullScreen loading.
 * Uses simple spinner for inline/section loading.
 *
 * Usage:
 * ```tsx
 * // Full page loading - automatically uses branded logo
 * if (loading) return <PageLoading message="Loading orders..." fullScreen />;
 *
 * // Section loading - uses simple spinner
 * {loading && <PageLoading message="Loading..." />}
 *
 * // With refresh icon variant
 * <PageLoading variant="refresh" message="Refreshing data..." />
 *
 * // Long operation with progress
 * <PageLoading variant="branded" progress={45} message="Exporting data..." />
 * ```
 */
export function PageLoading({
  message = 'Loading...',
  fullScreen = false,
  className,
  variant,
  size = 'md',
  progress,
}: PageLoadingProps) {
  // Auto-select variant: branded for fullScreen, spinner for inline
  const effectiveVariant = variant ?? (fullScreen ? 'branded' : 'spinner');

  // Use branded loader for 'branded' variant
  if (effectiveVariant === 'branded') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          fullScreen ? 'min-h-screen' : 'py-12',
          className
        )}
      >
        <BrandedLoader
          variant={fullScreen ? 'full' : 'icon'}
          size={size}
          message={message}
          progress={progress}
        />
      </div>
    );
  }

  const Icon = effectiveVariant === 'refresh' ? RefreshCw : Loader2;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullScreen ? 'min-h-screen' : 'py-12',
        className
      )}
    >
      <Icon
        className={cn(
          'text-primary animate-spin',
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="mt-4 text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
}

/**
 * TableLoading - Loading state for tables/lists
 * Uses branded icon loader for consistent branding
 *
 * Note: For better UX, consider using TableSkeleton from '@/components/ui/table-skeleton'
 * which shows content structure and reduces perceived wait time.
 */
export function TableLoading({
  message = 'Loading data...',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <BrandedLoader variant="icon" size="md" message={message} />
    </div>
  );
}

/**
 * InlineLoading - Small inline loading indicator
 * Use within buttons or inline text
 */
export function InlineLoading({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
        className
      )}
    />
  );
}

export default PageLoading;
