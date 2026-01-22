'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  formatCurrency as formatCurrencyUtil,
  formatChartAxisCurrency as formatChartAxisCurrencyUtil,
  getCurrencySymbol,
} from '@/lib/utils/currency';

// Re-export currency utilities for use in widgets
export { getCurrencySymbol };

// Custom styled Card components for dashboard widgets
export const DashboardCard = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border bg-white/80 backdrop-blur-sm text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300", className)} {...props}>
    {children}
  </div>
);

export const DashboardCardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

export const DashboardCardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const DashboardCardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
);

export const DashboardCardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

export const DashboardBadge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

// Utility functions - now accepts optional currency parameter
export const formatCurrency = (amount: number, currency: string = 'INR') => {
  return formatCurrencyUtil(amount, currency);
};

// Format for chart axis labels
export const formatChartAxisCurrency = (value: number, currency: string = 'INR') => {
  return formatChartAxisCurrencyUtil(value, currency);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const getRelativeTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
};

// Custom tooltip for charts - accepts optional currency parameter
export const CustomTooltip = ({
  active,
  payload,
  label,
  currency = 'INR'
}: {
  active?: boolean;
  payload?: readonly { value?: number | string; name?: string }[];
  label?: string;
  currency?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {item.name === 'revenue' ? 'Revenue: ' : 'Orders: '}
            <span className="font-semibold text-success">
              {item.name === 'revenue' && typeof item.value === 'number'
                ? formatCurrency(item.value, currency)
                : item.value
              }
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
