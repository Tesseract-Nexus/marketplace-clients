'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight card components for modern flat design.
 * Use sparingly - prefer flat sections with spacing over card wrappers.
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove border for seamless look */
  borderless?: boolean;
  /** Add hover effect for interactive cards */
  interactive?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

/**
 * Card - A lightweight card for content sections
 *
 * Only use when content needs visual separation (list items, standalone widgets).
 * For page sections, prefer using spacing and subtle dividers instead.
 */
export function Card({
  className,
  children,
  borderless = false,
  interactive = false,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg',
        !borderless && 'border border-border',
        interactive && 'hover:border-primary/30 transition-colors cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ListCard - For individual items in a list (orders, reviews, staff members)
 */
export function ListCard({
  className,
  children,
  interactive = true,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border p-4',
        interactive && 'hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Section - For page sections without heavy card styling
 * Uses spacing and optional subtle top border for separation
 */
interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add top border for separation */
  divider?: boolean;
}

export function Section({
  className,
  children,
  divider = false,
  ...props
}: SectionProps) {
  return (
    <div
      className={cn(
        divider && 'pt-6 border-t border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ContentBox - Minimal wrapper for content that needs background
 */
export function ContentBox({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
