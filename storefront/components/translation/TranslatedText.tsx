'use client';

import React, { type JSX } from 'react';
import { useTranslatedText } from '@/hooks/useTranslatedText';
import { cn } from '@/lib/utils';

type ElementType = keyof JSX.IntrinsicElements;

interface TranslatedTextProps {
  /** The text to translate */
  text: string | undefined | null;
  /** Context hint for better translation */
  context?: string;
  /** Source language (auto-detect if not provided) */
  sourceLang?: string;
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
 * Component that automatically translates text to the user's preferred language
 */
export function TranslatedText({
  text,
  context,
  sourceLang,
  skip = false,
  className,
  as: Component = 'span',
  showLoading = false,
  fallback,
  ...props
}: TranslatedTextProps) {
  const { translatedText, isTranslating } = useTranslatedText(text, {
    context,
    sourceLang,
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
 * Translate product name
 */
export function TranslatedProductName({
  name,
  className,
  as = 'span',
  ...props
}: {
  name: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <TranslatedText
      text={name}
      context="product name"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate product description
 */
export function TranslatedProductDescription({
  description,
  className,
  as = 'p',
  ...props
}: {
  description: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <TranslatedText
      text={description}
      context="product description"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate category name
 */
export function TranslatedCategoryName({
  name,
  className,
  as = 'span',
  ...props
}: {
  name: string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <TranslatedText
      text={name}
      context="category name"
      className={className}
      as={as}
      {...props}
    />
  );
}

/**
 * Translate any UI text (buttons, labels, etc.)
 */
export function TranslatedUIText({
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
    <TranslatedText
      text={text}
      context="UI text"
      className={className}
      as={as}
      {...props}
    />
  );
}

export default TranslatedText;
