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
    <div className={cn("mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
            {badge && (
              <span className={cn(
                "text-sm px-3 py-1 rounded-full border font-semibold",
                badgeStyles[badge.variant || 'default']
              )}>
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-2 text-lg">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex gap-3 ml-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
