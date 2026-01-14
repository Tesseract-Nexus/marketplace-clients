'use client';

import React, { type JSX } from 'react';
import { useAdminTranslatedText } from '@/hooks/useAdminTranslatedText';
import { cn } from '@/lib/utils';

type ElementType = keyof JSX.IntrinsicElements;

interface AdminTranslatedTextProps {
  /** The text to translate */
  text: string | undefined | null;
  /** Context hint for better translation */
  context?: string;
  /** Skip translation */
  skip?: boolean;
  /** Custom class name */
  className?: string;
  /** Render as a specific element */
  as?: ElementType;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Fallback text while loading */
  fallback?: string;
  /** Additional props to pass to the element */
  [key: string]: unknown;
}

/**
 * Component that automatically translates text to the admin user's preferred language
 */
export function AdminTranslatedText({
  text,
  context,
  skip = false,
  className,
  as: Component = 'span',
  showLoading = false,
  fallback,
  ...props
}: AdminTranslatedTextProps) {
  const { translatedText, isTranslating } = useAdminTranslatedText(text, {
    context,
    skip,
  });

  if (!text) {
    return null;
  }

  const displayText = isTranslating && fallback ? fallback : translatedText;

  return (
    <Component
      className={cn(
        isTranslating && showLoading && 'animate-pulse',
        className
      )}
      {...props}
    >
      {displayText}
    </Component>
  );
}

/**
 * Translate any UI text (buttons, labels, menu items, etc.)
 */
export function AdminUIText({
  text,
  className,
  as = 'span',
  ...props
}: {
  text: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <AdminTranslatedText
      text={text}
      context="admin UI"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate page titles
 */
export function AdminPageTitle({
  text,
  className,
  as = 'h1',
  ...props
}: {
  text: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <AdminTranslatedText
      text={text}
      context="page title"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate form labels
 */
export function AdminFormLabel({
  text,
  className,
  as = 'label',
  ...props
}: {
  text: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <AdminTranslatedText
      text={text}
      context="form label"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate button text
 */
export function AdminButtonText({
  text,
  className,
  as = 'span',
  ...props
}: {
  text: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <AdminTranslatedText
      text={text}
      context="button"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate table headers
 */
export function AdminTableHeader({
  text,
  className,
  as = 'span',
  ...props
}: {
  text: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <AdminTranslatedText
      text={text}
      context="table header"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate error/status messages
 */
export function AdminMessage({
  text,
  className,
  as = 'span',
  ...props
}: {
  text: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <AdminTranslatedText
      text={text}
      context="message"
      className={className}
      as={as}
      {...props}
    />
  );
}

export default AdminTranslatedText;
