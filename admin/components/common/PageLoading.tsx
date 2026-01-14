'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoadingProps {
  /** Loading message to display */
  message?: string;
  /** Use full screen height */
  fullScreen?: boolean;
  /** Custom className for container */
  className?: string;
  /** Variant: 'spinner' (default) or 'refresh' */
  variant?: 'spinner' | 'refresh';
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * PageLoading - Consistent loading state component
 *
 * Usage:
 * ```tsx
 * // Full page loading
 * if (loading) return <PageLoading message="Loading orders..." fullScreen />;
 *
 * // Section loading
 * {loading && <PageLoading message="Loading..." />}
 *
 * // With refresh icon variant
 * <PageLoading variant="refresh" message="Refreshing data..." />
 * ```
 */
export function PageLoading({
  message = 'Loading...',
  fullScreen = false,
  className,
  variant = 'spinner',
  size = 'md',
}: PageLoadingProps) {
  const Icon = variant === 'refresh' ? RefreshCw : Loader2;

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
 * Shows a centered spinner within a container
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="mt-4 text-muted-foreground text-sm">{message}</p>
      )}
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
