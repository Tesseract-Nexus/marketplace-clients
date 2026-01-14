'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "flex items-center gap-1.5",
                isLast ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </span>
            )}

            {!isLast && (
              <span className="text-muted-foreground">/</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
