'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatItem {
  /** Label for the stat */
  label: string;
  /** Value to display */
  value: string | number;
  /** Color for the value */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted';
}

export interface StatsRowProps {
  /** Array of stats to display */
  stats: StatItem[];
  /** Additional className */
  className?: string;
  /** Whether to show on all screen sizes or only mobile */
  mobileOnly?: boolean;
}

const colorStyles: Record<string, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  muted: 'text-foreground',
};

/**
 * StatsRow - A compact horizontal row of stats for mobile or space-constrained areas
 *
 * Use this for displaying quick stats in a compact format, especially on mobile.
 *
 * @example
 * <StatsRow
 *   stats={[
 *     { label: 'Total', value: 1234, color: 'primary' },
 *     { label: 'Active', value: 890, color: 'success' },
 *     { label: 'Pending', value: 45, color: 'warning' },
 *   ]}
 *   mobileOnly
 * />
 */
export function StatsRow({ stats, className, mobileOnly = false }: StatsRowProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        mobileOnly && 'lg:hidden',
        className
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex-1 bg-card rounded-lg border border-border p-2 text-center"
        >
          <p
            className={cn(
              'text-lg font-bold',
              colorStyles[stat.color || 'muted']
            )}
          >
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export default StatsRow;
