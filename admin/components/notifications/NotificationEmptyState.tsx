'use client';

import { Bell, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationEmptyStateProps {
  variant?: 'default' | 'compact';
  filtered?: boolean;
  className?: string;
}

/**
 * Shared empty state component for notifications
 * Uses semantic theme tokens for consistent styling
 */
export function NotificationEmptyState({
  variant = 'default',
  filtered = false,
  className,
}: NotificationEmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8 px-4' : 'py-12 px-6',
        className
      )}
    >
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center bg-muted',
          isCompact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'
        )}
      >
        {filtered ? (
          <Inbox className={cn('text-muted-foreground', isCompact ? 'w-6 h-6' : 'w-8 h-8')} />
        ) : (
          <Bell className={cn('text-muted-foreground', isCompact ? 'w-6 h-6' : 'w-8 h-8')} />
        )}
      </div>

      <h3 className={cn('font-semibold text-foreground', isCompact ? 'text-sm' : 'text-base')}>
        {filtered ? 'No matches' : 'All caught up!'}
      </h3>

      <p className={cn('text-muted-foreground mt-1', isCompact ? 'text-xs' : 'text-sm', !isCompact && 'max-w-[280px]')}>
        {filtered
          ? 'Try adjusting your filters'
          : isCompact
          ? "You're all set!"
          : "We'll notify you when something important happens."}
      </p>
    </div>
  );
}
