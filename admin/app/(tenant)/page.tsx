"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { useOnRefresh } from '@/contexts/RefreshContext';
import { DashboardLayoutProvider, useDashboardLayoutContext } from '@/contexts/DashboardLayoutContext';
import { DraggableWidget, DashboardToolbar, RenderWidget } from '@/components/dashboard';
import { TestimonialPromptBanner } from '@/components/dashboard/TestimonialPromptBanner';
import { useDashboardData, useRefreshDashboard } from '@/hooks/useDashboardData';
import { DashboardData } from '@/lib/types/dashboard';

interface DashboardContentProps {
  data: DashboardData;
  loading: boolean;
  isFetching: boolean;
  dataUpdatedAt: number | undefined;
}

function DashboardContent({ data, loading, isFetching, dataUpdatedAt }: DashboardContentProps) {
  const { widgets, isLoaded } = useDashboardLayoutContext();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track when data was last updated
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  if (loading || !isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Testimonial Prompt Banner - shows for eligible tenants */}
      <TestimonialPromptBanner />

      <DashboardToolbar isFetching={isFetching} lastUpdated={lastUpdated} />

      {/* Responsive Grid Container for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {widgets.map((widget) => (
          <DraggableWidget
            key={widget.id}
            id={widget.id}
            gridSpan={widget.gridSpan}
          >
            <RenderWidget type={widget.type} data={data} />
          </DraggableWidget>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Use React Query for cached data fetching
  const { data: dashboardData, isLoading, isFetching, dataUpdatedAt } = useDashboardData();
  const refreshDashboard = useRefreshDashboard();

  // Subscribe to auto-refresh events (manual refresh button in RefreshContext)
  useOnRefresh(refreshDashboard, [refreshDashboard]);

  return (
    <PermissionGate
      permission={Permission.DASHBOARD_VIEW}
      fallback="styled"
      fallbackTitle="Dashboard Access Required"
      fallbackDescription="You don't have the required permissions to view the dashboard. Please contact your administrator to request access."
    >
    <DashboardLayoutProvider>
      <DashboardContent
        data={dashboardData!}
        loading={isLoading}
        isFetching={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      />
    </DashboardLayoutProvider>
    </PermissionGate>
  );
}
