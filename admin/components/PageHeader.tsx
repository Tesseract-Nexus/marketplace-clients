'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: {
    label: string;
    icon?: string;
    variant?: 'default' | 'success' | 'warning' | 'info';
  };
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  const badgeStyles = {
    default: 'bg-primary/20 text-primary border-primary/30',
    success: 'bg-success-muted text-success-muted-foreground border-success/30',
    warning: 'bg-warning-muted text-warning-muted-foreground border-warning/30',
    info: 'bg-info-muted text-info-muted-foreground border-info/30',
  };

  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 md:mb-4 overflow-x-auto scrollbar-hide">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground break-words">
              {title}
            </h1>
            {badge && (
              <span className={cn(
                "text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border font-semibold whitespace-nowrap",
                badgeStyles[badge.variant || 'default']
              )}>
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-1.5 md:mt-2 text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-none">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2 sm:gap-3 sm:ml-4 md:ml-6 sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
