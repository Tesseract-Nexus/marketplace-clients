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
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-violet-100 text-violet-700 border-violet-200',
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent break-words">
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
