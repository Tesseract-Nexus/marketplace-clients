'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  /** Label shown above the value */
  label: string;
  /** The main value to display */
  value: string | number;
  /** Icon to display */
  icon?: LucideIcon;
  /** Color theme for the value and icon */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted';
  /** Optional change percentage (positive or negative) */
  change?: number;
  /** Optional change label (e.g., "vs last month") */
  changeLabel?: string;
  /** Size variant */
  size?: 'default' | 'compact';
  /** Additional className */
  className?: string;
}

const colorStyles = {
  primary: {
    value: 'text-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    value: 'text-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    value: 'text-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  error: {
    value: 'text-error',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
  },
  info: {
    value: 'text-info',
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
  },
  muted: {
    value: 'text-foreground',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
};

/**
 * StatsCard - A reusable statistics card component
 *
 * Use for displaying summary metrics at the top of data listing pages.
 *
 * @example
 * <StatsCard
 *   label="Total Customers"
 *   value={1234}
 *   icon={Users}
 *   color="primary"
 *   change={12.5}
 *   changeLabel="vs last month"
 * />
 */
export function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'primary',
  change,
  changeLabel,
  size = 'default',
  className,
}: StatsCardProps) {
  const styles = colorStyles[color];
  const isCompact = size === 'compact';

  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border shadow-sm',
        isCompact ? 'p-3' : 'p-4 sm:p-6',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-muted-foreground font-medium truncate',
              isCompact ? 'text-[10px]' : 'text-xs sm:text-sm'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'font-bold mt-1',
              styles.value,
              isCompact ? 'text-lg' : 'text-xl sm:text-3xl sm:mt-2'
            )}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-error" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  change >= 0 ? 'text-success' : 'text-error'
                )}
              >
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'rounded-lg flex items-center justify-center flex-shrink-0',
              styles.iconBg,
              isCompact ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'
            )}
          >
            <Icon
              className={cn(
                styles.iconColor,
                isCompact ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
