'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatsCard, StatsCardProps } from './StatsCard';
import { StatsRow, StatItem } from './StatsRow';

export interface StatsGridProps {
  /** Array of stats to display in cards */
  stats: Array<Omit<StatsCardProps, 'size' | 'className'>>;
  /** Number of columns on large screens (default: 4) */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Whether to show compact mobile row (default: true) */
  showMobileRow?: boolean;
  /** Additional className */
  className?: string;
}

const columnClasses: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

/**
 * StatsGrid - A responsive grid of stats cards with optional mobile compact view
 *
 * This component renders stats in a responsive grid that automatically adapts:
 * - Mobile: Shows a compact row of stats (if showMobileRow is true)
 * - Tablet: 2 columns
 * - Desktop: configurable columns (default 4)
 *
 * @example
 * <StatsGrid
 *   stats={[
 *     { label: 'Total Customers', value: 1234, icon: Users, color: 'primary' },
 *     { label: 'Active', value: 890, icon: TrendingUp, color: 'success' },
 *     { label: 'Revenue', value: '$12,345', icon: DollarSign, color: 'primary' },
 *     { label: 'Orders', value: 456, icon: ShoppingCart, color: 'warning' },
 *   ]}
 *   columns={4}
 *   showMobileRow
 * />
 */
export function StatsGrid({
  stats,
  columns = 4,
  showMobileRow = true,
  className,
}: StatsGridProps) {
  // Convert stats to compact format for mobile row
  const mobileStats: StatItem[] = stats.slice(0, 4).map((stat) => ({
    label: stat.label,
    value: stat.value,
    color: stat.color,
  }));

  return (
    <div className={className}>
      {/* Mobile Compact Row */}
      {showMobileRow && (
        <div className="sm:hidden mb-4">
          <StatsRow stats={mobileStats} />
        </div>
      )}

      {/* Desktop/Tablet Grid */}
      <div
        className={cn(
          'grid gap-3 sm:gap-6',
          showMobileRow ? 'hidden sm:grid' : 'grid',
          'grid-cols-1 sm:grid-cols-2',
          columnClasses[columns]
        )}
      >
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}

export default StatsGrid;
