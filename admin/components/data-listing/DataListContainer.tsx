'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataListContainerProps {
  /** Loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
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
  loadingMessage = 'Loading...',
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
          'bg-card rounded-lg border border-border shadow-sm p-12 text-center',
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">{loadingMessage}</p>
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
