'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LastUpdatedStatusProps {
  /** Last updated date */
  lastUpdated: Date | null;
  /** Whether data is currently being fetched */
  isFetching?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
}

/**
 * Formats a date to a human-readable "time ago" string
 */
function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} mins ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * A prominent status indicator showing when data was last updated.
 * Displays a pulsing green dot when data is fresh, or shows loading state when fetching.
 */
export function LastUpdatedStatus({
  lastUpdated,
  isFetching = false,
  size = 'sm',
  className,
}: LastUpdatedStatusProps) {
  if (!lastUpdated && !isFetching) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
  };

  const dotSizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
  };

  if (isFetching) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', sizeClasses[size], className)}>
        <span className="relative flex">
          <span className={cn('relative inline-flex rounded-full bg-blue-500 animate-pulse', dotSizeClasses[size])}></span>
        </span>
        <span>Updating...</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', sizeClasses[size], className)}>
      <span className="relative flex">
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75', dotSizeClasses[size])}></span>
        <span className={cn('relative inline-flex rounded-full bg-green-500', dotSizeClasses[size])}></span>
      </span>
      <span>Updated {formatLastUpdated(lastUpdated)}</span>
    </div>
  );
}

export default LastUpdatedStatus;
