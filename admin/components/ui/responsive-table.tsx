'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// RESPONSIVE TABLE COMPONENT
// Displays as traditional table on desktop, card layout on mobile
// =============================================================================

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  // Mobile-specific options
  hideOnMobile?: boolean;
  isPrimary?: boolean; // Shows as card title on mobile
  isSecondary?: boolean; // Shows as card subtitle on mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  // Mobile card options
  mobileCardClassName?: string;
  onRowClick?: (item: T, index: number) => void;
  // Actions column for mobile
  renderMobileActions?: (item: T, index: number) => React.ReactNode;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = 'No data available',
  isLoading = false,
  mobileCardClassName,
  onRowClick,
  renderMobileActions,
}: ResponsiveTableProps<T>) {
  // Find primary and secondary columns for mobile card header
  const primaryColumn = columns.find(col => col.isPrimary);
  const secondaryColumn = columns.find(col => col.isSecondary);

  // Get value from item using column key
  const getValue = (item: T, col: Column<T>, index: number): React.ReactNode => {
    if (col.render) {
      return col.render(item, index);
    }
    const value = item[col.key as keyof T];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Desktop loading skeleton */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile loading skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                className={cn(
                  'hover:bg-muted/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'px-4 py-3 text-sm',
                      col.className
                    )}
                  >
                    {getValue(item, col, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            className={cn(
              'bg-card border border-border rounded-lg p-4',
              onRowClick && 'cursor-pointer active:bg-muted/50',
              mobileCardClassName
            )}
            onClick={() => onRowClick?.(item, index)}
          >
            {/* Card Header - Primary and Secondary columns */}
            {(primaryColumn || secondaryColumn) && (
              <div className="mb-3 pb-3 border-b border-border">
                {primaryColumn && (
                  <div className="font-semibold text-foreground">
                    {getValue(item, primaryColumn, index)}
                  </div>
                )}
                {secondaryColumn && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {getValue(item, secondaryColumn, index)}
                  </div>
                )}
              </div>
            )}

            {/* Card Body - Other columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns
                .filter(col => !col.hideOnMobile && !col.isPrimary && !col.isSecondary)
                .map((col, colIndex) => (
                  <div key={colIndex} className="min-w-0">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      {col.header}
                    </div>
                    <div className="text-sm text-foreground truncate">
                      {getValue(item, col, index)}
                    </div>
                  </div>
                ))}
            </div>

            {/* Mobile Actions */}
            {renderMobileActions && (
              <div className="mt-4 pt-3 border-t border-border flex gap-2">
                {renderMobileActions(item, index)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SIMPLE TABLE WRAPPER
// For cases where you want automatic mobile card behavior without custom config
// =============================================================================

interface SimpleTableProps {
  children: React.ReactNode;
  className?: string;
}

export function SimpleTableWrapper({ children, className }: SimpleTableProps) {
  return (
    <div className={cn('overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0', className)}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  );
}
