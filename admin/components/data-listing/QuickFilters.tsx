'use client';

import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface QuickFilter {
  /** Unique identifier for the filter */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Color variant */
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Whether this filter is currently active */
  active?: boolean;
  /** Count to show in badge (optional) */
  count?: number;
}

export interface QuickFiltersProps {
  /** Array of filter options */
  filters: QuickFilter[];
  /** Currently active filter IDs */
  activeFilters: string[];
  /** Callback when a filter is toggled */
  onFilterToggle: (filterId: string) => void;
  /** Callback to clear all filters */
  onClearAll?: () => void;
  /** Whether to show "Clear All" button */
  showClearAll?: boolean;
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: 'default' | 'sm';
}

const colorStyles = {
  default: {
    inactive: 'bg-muted hover:bg-muted/80 text-foreground',
    active: 'bg-primary text-primary-foreground',
  },
  success: {
    inactive: 'bg-success/10 hover:bg-success/20 text-success',
    active: 'bg-success text-white',
  },
  warning: {
    inactive: 'bg-warning/10 hover:bg-warning/20 text-warning',
    active: 'bg-warning text-white',
  },
  error: {
    inactive: 'bg-error/10 hover:bg-error/20 text-error',
    active: 'bg-error text-white',
  },
  info: {
    inactive: 'bg-info/10 hover:bg-info/20 text-info',
    active: 'bg-info text-white',
  },
};

/**
 * QuickFilters - A row of toggle-able filter chips
 *
 * Use for common quick filters like status, type, or flagged items.
 *
 * @example
 * <QuickFilters
 *   filters={[
 *     { id: 'active', label: 'Active', icon: CheckCircle, color: 'success' },
 *     { id: 'pending', label: 'Pending', icon: Clock, color: 'warning', count: 5 },
 *     { id: 'flagged', label: 'Flagged', icon: Flag, color: 'error' },
 *   ]}
 *   activeFilters={['pending']}
 *   onFilterToggle={(id) => toggleFilter(id)}
 *   onClearAll={() => clearFilters()}
 *   showClearAll
 * />
 */
export function QuickFilters({
  filters,
  activeFilters,
  onFilterToggle,
  onClearAll,
  showClearAll = true,
  className,
  size = 'default',
}: QuickFiltersProps) {
  const hasActiveFilters = activeFilters.length > 0;
  const isSmall = size === 'sm';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        const styles = colorStyles[filter.color || 'default'];
        const Icon = filter.icon;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterToggle(filter.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
              isSmall ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              isActive ? styles.active : styles.inactive
            )}
          >
            {Icon && <Icon className={cn(isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
            {filter.label}
            {filter.count !== undefined && filter.count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs font-bold',
                  isActive
                    ? 'bg-white/20 text-inherit'
                    : 'bg-current/10 text-current'
                )}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}

      {showClearAll && hasActiveFilters && onClearAll && (
        <button
          onClick={onClearAll}
          className={cn(
            'inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors',
            isSmall ? 'text-xs' : 'text-sm'
          )}
        >
          <X className={cn(isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          Clear
        </button>
      )}
    </div>
  );
}

export default QuickFilters;
