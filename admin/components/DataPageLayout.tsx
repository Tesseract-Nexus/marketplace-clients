'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SidebarStatItem {
  id: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'default' | 'success' | 'warning' | 'error' | 'primary' | 'muted';
  onClick?: () => void;
  isActive?: boolean;
}

export interface SidebarSection {
  title: string;
  items: SidebarStatItem[];
}

export interface HealthWidgetConfig {
  label: string;
  currentValue: number;
  totalValue: number;
  segments?: {
    value: number;
    color: 'success' | 'warning' | 'error' | 'primary' | 'muted';
  }[];
  status: 'healthy' | 'attention' | 'critical' | 'normal';
}

interface DataPageLayoutProps {
  children: ReactNode;
  sidebar?: {
    healthWidget?: HealthWidgetConfig;
    sections: SidebarSection[];
  };
  mobileStats?: SidebarStatItem[];
  className?: string;
}

const colorClasses = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
};

const bgColorClasses = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  primary: 'bg-primary',
  muted: 'bg-muted',
};

const statusColors = {
  healthy: { bg: 'bg-success/5 border-success/20', text: 'text-success' },
  attention: { bg: 'bg-warning/5 border-warning/20', text: 'text-warning' },
  critical: { bg: 'bg-error/5 border-error/20', text: 'text-error' },
  normal: { bg: 'bg-muted border-border', text: 'text-muted-foreground' },
};

export function DataPageLayout({
  children,
  sidebar,
  mobileStats,
  className,
}: DataPageLayoutProps) {
  if (!sidebar) {
    return <>{children}</>;
  }

  return (
    <div className={cn('flex gap-6', className)}>
      {/* Left Sidebar with Stats - Always Visible on Desktop */}
      <div className="w-56 flex-shrink-0 hidden lg:block">
        <div className="sticky top-6 space-y-4">
          {/* Health Widget */}
          {sidebar.healthWidget && (
            <div className={cn(
              'rounded-lg border p-3',
              statusColors[sidebar.healthWidget.status].bg
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-xs font-medium capitalize',
                  statusColors[sidebar.healthWidget.status].text
                )}>
                  {sidebar.healthWidget.status === 'healthy' ? 'Healthy' :
                   sidebar.healthWidget.status === 'attention' ? 'Attention' :
                   sidebar.healthWidget.status === 'critical' ? 'Critical' : 'Normal'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sidebar.healthWidget.currentValue}/{sidebar.healthWidget.totalValue}
                </span>
              </div>
              {sidebar.healthWidget.segments && sidebar.healthWidget.segments.length > 0 && (
                <div className="flex gap-1">
                  {sidebar.healthWidget.segments.map((segment, idx) => (
                    <div
                      key={idx}
                      className={cn('h-1 rounded-full', bgColorClasses[segment.color])}
                      style={{ width: `${(segment.value / Math.max(sidebar.healthWidget!.totalValue, 1)) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stat Sections */}
          {sidebar.sections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="bg-card rounded-lg border border-border p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isButton = !!item.onClick;
                const Component = isButton ? 'button' : 'div';

                return (
                  <Component
                    key={item.id}
                    onClick={item.onClick}
                    className={cn(
                      'w-full flex justify-between items-center text-sm p-1.5 rounded transition-colors',
                      isButton && (item.isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted')
                    )}
                  >
                    <span className={cn('flex items-center gap-2', colorClasses[item.color || 'muted'])}>
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                    <span className={cn('font-semibold', colorClasses[item.color || 'default'])}>
                      {item.value}
                    </span>
                  </Component>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Stats Row */}
        {mobileStats && mobileStats.length > 0 && (
          <div className={cn(
            'lg:hidden mb-4 grid gap-2',
            mobileStats.length <= 4 ? `grid-cols-${mobileStats.length}` : 'grid-cols-4'
          )} style={{ gridTemplateColumns: `repeat(${Math.min(mobileStats.length, 5)}, minmax(0, 1fr))` }}>
            {mobileStats.slice(0, 5).map((item) => {
              const isButton = !!item.onClick;
              const Component = isButton ? 'button' : 'div';

              return (
                <Component
                  key={item.id}
                  onClick={item.onClick}
                  className="bg-card rounded-lg border border-border p-2 text-center"
                >
                  <p className={cn('text-lg font-bold', colorClasses[item.color || 'default'])}>
                    {item.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                </Component>
              );
            })}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default DataPageLayout;
