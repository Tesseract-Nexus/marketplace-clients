"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { useOnRefresh } from '@/contexts/RefreshContext';
import { DashboardLayoutProvider, useDashboardLayoutContext } from '@/contexts/DashboardLayoutContext';
import { DraggableWidget, DashboardToolbar, RenderWidget } from '@/components/dashboard';
import { useDashboardData, useRefreshDashboard } from '@/hooks/useDashboardData';
import { DashboardData } from '@/lib/types/dashboard';

function DashboardContent({ data, loading }: { data: DashboardData; loading: boolean }) {
  const { widgets, isLoaded, isEditMode } = useDashboardLayoutContext();

  if (loading || !isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DashboardToolbar />

      {/* Responsive Grid Container for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets.map((widget) => (
          <DraggableWidget
            key={widget.id}
            id={widget.id}
            gridSpan={widget.gridSpan}
            isEditMode={isEditMode}
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
  const { data: dashboardData, isLoading, isFetching } = useDashboardData();
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
      <DashboardContent data={dashboardData!} loading={isLoading} />
    </DashboardLayoutProvider>
    </PermissionGate>
  );
}
