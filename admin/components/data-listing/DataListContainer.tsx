'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export interface DataListContainerProps {
  /** Loading state */
  loading?: boolean;
  /** Loading message (deprecated - skeleton doesn't use text) */
  loadingMessage?: string;
  /** Number of skeleton rows to show */
  skeletonRows?: number;
  /** Number of skeleton columns to show */
  skeletonColumns?: number;
  /** Whether the list is empty */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Empty state action */
  emptyAction?: React.ReactNode;
  /** Children to render (the actual list/table) */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * DataListContainer - Wrapper for data tables/lists with loading and empty states
 *
 * @example
 * <DataListContainer
 *   loading={loading}
 *   isEmpty={items.length === 0}
 *   emptyMessage="No customers found"
 *   emptyIcon={<Users className="h-12 w-12" />}
 *   emptyAction={<Button onClick={openCreate}>Add Customer</Button>}
 * >
 *   <table>...</table>
 * </DataListContainer>
 */
export function DataListContainer({
  loading = false,
  loadingMessage: _loadingMessage,
  skeletonRows = 5,
  skeletonColumns = 5,
  isEmpty = false,
  emptyMessage = 'No items found',
  emptyIcon,
  emptyAction,
  children,
  className,
}: DataListContainerProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-card rounded-lg border border-border shadow-sm overflow-hidden',
          className
        )}
      >
        <TableSkeleton rows={skeletonRows} columns={skeletonColumns} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'bg-card rounded-lg border border-border shadow-sm p-12 text-center',
          className
        )}
      >
        {emptyIcon && (
          <div className="text-muted-foreground mb-4 flex justify-center">
            {emptyIcon}
          </div>
        )}
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border shadow-sm overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

export default DataListContainer;
