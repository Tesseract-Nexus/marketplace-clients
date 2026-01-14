'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties } from 'react';

type AnimationVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-up'
  | 'slide-down'
  | 'flip-up'
  | 'blur-in';

interface ScrollRevealProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number; // in ms
  duration?: number; // in ms
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
}

const animationStyles: Record<AnimationVariant, { initial: CSSProperties; animate: CSSProperties }> = {
  'fade-up': {
    initial: { opacity: 0, transform: 'translateY(30px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    initial: { opacity: 0, transform: 'translateY(-30px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    initial: { opacity: 0, transform: 'translateX(30px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    initial: { opacity: 0, transform: 'translateX(-30px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
  },
  'zoom-in': {
    initial: { opacity: 0, transform: 'scale(0.9)' },
    animate: { opacity: 1, transform: 'scale(1)' },
  },
  'zoom-out': {
    initial: { opacity: 0, transform: 'scale(1.1)' },
    animate: { opacity: 1, transform: 'scale(1)' },
  },
  'slide-up': {
    initial: { opacity: 0, transform: 'translateY(50px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  'slide-down': {
    initial: { opacity: 0, transform: 'translateY(-50px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  'flip-up': {
    initial: { opacity: 0, transform: 'perspective(600px) rotateX(20deg)' },
    animate: { opacity: 1, transform: 'perspective(600px) rotateX(0)' },
  },
  'blur-in': {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0)' },
  },
};

/**
 * ScrollReveal Component
 *
 * Wraps children with scroll-triggered reveal animations.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * <ScrollReveal variant="fade-up" delay={200}>
 *   <ProductCard />
 * </ScrollReveal>
 */
export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 600,
  className,
  triggerOnce = true,
  threshold = 0.1,
}: ScrollRevealProps) {
  const { ref, isInView } = useScrollAnimation<HTMLDivElement>({
    threshold,
    triggerOnce,
  });

  const styles = animationStyles[variant];

  return (
    <div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={{
        ...(!isInView ? styles.initial : styles.animate),
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollRevealGroup Component
 *
 * Wraps multiple children with staggered scroll-triggered animations.
 *
 * @example
 * <ScrollRevealGroup staggerDelay={100}>
 *   {products.map(product => <ProductCard key={product.id} />)}
 * </ScrollRevealGroup>
 */
interface ScrollRevealGroupProps {
  children: ReactNode[];
  variant?: AnimationVariant;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  itemClassName?: string;
}

export function ScrollRevealGroup({
  children,
  variant = 'fade-up',
  staggerDelay = 100,
  duration = 600,
  className,
  itemClassName,
}: ScrollRevealGroupProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          variant={variant}
          delay={index * staggerDelay}
          duration={duration}
          className={itemClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

export default ScrollReveal;
