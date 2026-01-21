'use client';

import { useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  show?: boolean;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 300,
  show = true,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, delay]);

  return (
    <div
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-out',
      }}
    >
      {children}
    </div>
  );
}

// Staggered fade-in for lists
interface FadeInStaggerProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  duration?: number;
  show?: boolean;
}

export function FadeInStagger({
  children,
  className,
  staggerDelay = 50,
  duration = 300,
  show = true,
}: FadeInStaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          delay={index * staggerDelay}
          duration={duration}
          show={show}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Content wrapper that shows skeleton while loading, then fades in content
interface ContentLoaderProps<T> {
  data: T | undefined;
  isLoading: boolean;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
  className?: string;
}

export function ContentLoader<T>({
  data,
  isLoading,
  skeleton,
  children,
  className,
}: ContentLoaderProps<T>) {
  if (isLoading || !data) {
    return <div className={className}>{skeleton}</div>;
  }

  return (
    <FadeIn className={className} show={!!data}>
      {children(data)}
    </FadeIn>
  );
}
