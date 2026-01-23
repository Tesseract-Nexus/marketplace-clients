'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  Settings2,
  Download,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Select } from '@/components/Select';
import { useDashboardLayoutContext } from '@/contexts/DashboardLayoutContext';
import { useRefreshDashboard } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

interface DashboardToolbarProps {
  isFetching?: boolean;
  lastUpdated?: Date | null;
}

export function DashboardToolbar({ isFetching, lastUpdated }: DashboardToolbarProps) {
  const [dateRange, setDateRange] = useState('last7days');
  const {
    isEditMode,
    setEditMode,
    resetLayout,
    allWidgets,
    widgets,
    toggleWidget,
    isSaving,
  } = useDashboardLayoutContext();
  const refreshDashboard = useRefreshDashboard();

  const handleRefresh = () => {
    refreshDashboard();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const visibleWidgetIds = widgets.map(w => w.id);

  return (
    <PageHeader
      title="Dashboard"
      description="Real-time overview of your store performance"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard' },
      ]}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Edit Mode Indicator */}
          {isEditMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-sm">
              <GripVertical className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium hidden sm:inline">Drag widgets to reorder</span>
              <span className="text-primary font-medium sm:hidden">Edit Mode</span>
            </div>
          )}

          {/* Last Updated */}
          {lastUpdated && !isEditMode && (
            <span className="text-xs text-muted-foreground hidden lg:inline">
              Updated {formatLastUpdated()}
            </span>
          )}

          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-border rounded-lg p-1.5 shadow-sm">
            {/* Date Range Selector */}
            {!isEditMode && (
              <>
                <Select
                  value={dateRange}
                  onChange={setDateRange}
                  options={dateRangeOptions}
                  variant="filter"
                  className="min-w-[120px] sm:min-w-[140px] border-0 shadow-none hover:bg-muted rounded-lg text-sm"
                />
                <div className="w-px h-6 bg-border hidden sm:block" />
              </>
            )}

            {/* Refresh Button */}
            {!isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-2 sm:px-3"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                <span className="ml-1.5 hidden sm:inline">Refresh</span>
              </Button>
            )}

            {/* Widget Settings Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-2 sm:px-3"
                  aria-label="Manage dashboard widgets"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="ml-1.5 hidden sm:inline">Widgets</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Dashboard Widgets</SheetTitle>
                  <SheetDescription>
                    Show or hide widgets on your dashboard. Changes are saved automatically.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {allWidgets.map((widget) => {
                    const isVisible = visibleWidgetIds.includes(widget.id);
                    return (
                      <button
                        key={widget.id}
                        onClick={() => toggleWidget(widget.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg border transition-all',
                          isVisible
                            ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                            : 'bg-muted/50 border-border hover:bg-muted'
                        )}
                        aria-label={`${isVisible ? 'Hide' : 'Show'} ${widget.type} widget`}
                      >
                        <div className="flex items-center gap-3">
                          {isVisible ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={cn(
                            'text-sm font-medium capitalize',
                            isVisible ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {widget.type.replace(/-/g, ' ')}
                          </span>
                        </div>
                        {isVisible && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetLayout}
                    className="w-full"
                    aria-label="Reset dashboard to default layout"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default Layout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="w-px h-6 bg-border" />

            {/* Edit Mode Toggle */}
            <Button
              variant={isEditMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setEditMode(!isEditMode)}
              disabled={isSaving}
              className={cn(
                'rounded-lg px-2 sm:px-3',
                !isEditMode && 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode to reorder widgets'}
            >
              {isEditMode ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="ml-1.5 hidden sm:inline">Done</span>
                </>
              ) : (
                <>
                  <GripVertical className="h-4 w-4" />
                  <span className="ml-1.5 hidden sm:inline">Customize</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
    />
  );
}
