'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FilterPanelProps {
  /** Search value */
  searchValue?: string;
  /** Callback when search changes */
  onSearchChange?: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Whether filters are expanded */
  expanded?: boolean;
  /** Callback when expansion changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Number of active filters (shown as badge) */
  activeFilterCount?: number;
  /** Callback to clear all filters */
  onClearAll?: () => void;
  /** Children (filter controls) to render in expandable section */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to start expanded (controlled by parent if expanded prop is provided) */
  defaultExpanded?: boolean;
  /** Whether to show the filter toggle button */
  showFilterToggle?: boolean;
  /** Quick filter chips to show (optional) */
  quickFilters?: React.ReactNode;
  /** data-tour attribute for search input (for page tours) */
  searchDataTour?: string;
  /** data-tour attribute for filter button (for page tours) */
  filterDataTour?: string;
}

/**
 * FilterPanel - A card-based filter section with search and expandable filters
 *
 * @example
 * <FilterPanel
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Search customers..."
 *   activeFilterCount={2}
 *   onClearAll={clearFilters}
 *   quickFilters={
 *     <QuickFilters filters={[...]} activeFilters={[...]} onFilterToggle={...} />
 *   }
 * >
 *   <Select value={status} onChange={setStatus} options={statusOptions} />
 *   <Select value={type} onChange={setType} options={typeOptions} />
 * </FilterPanel>
 */
export function FilterPanel({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  expanded: controlledExpanded,
  onExpandedChange,
  activeFilterCount = 0,
  onClearAll,
  children,
  className,
  defaultExpanded = false,
  showFilterToggle = true,
  quickFilters,
  searchDataTour,
  filterDataTour,
}: FilterPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled or uncontrolled expansion
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setExpanded = (value: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(value);
    } else {
      setInternalExpanded(value);
    }
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border shadow-sm',
        className
      )}
    >
      {/* Main Row */}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          {onSearchChange && (
            <div className="relative flex-1" data-tour={searchDataTour}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showFilterToggle && children && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!isExpanded)}
                className={cn(
                  'h-9 gap-2',
                  isExpanded && 'bg-muted'
                )}
                data-tour={filterDataTour}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {activeFilterCount}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}

            {hasActiveFilters && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        {quickFilters && (
          <div className="mt-3 pt-3 border-t border-border">
            {quickFilters}
          </div>
        )}
      </div>

      {/* Expandable Filter Section */}
      {children && isExpanded && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
