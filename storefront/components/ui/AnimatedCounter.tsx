'use client';

import { useAnimatedCounter } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

/**
 * AnimatedCounter Component
 *
 * Displays a number that animates from 0 to the target value
 * when it scrolls into view.
 *
 * @example
 * <AnimatedCounter value={10000} suffix="+" />
 * // Renders: 10,000+
 */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const { ref, count } = useAnimatedCounter(value, duration);

  const formattedCount = decimals > 0
    ? (count / Math.pow(10, decimals)).toFixed(decimals)
    : count.toLocaleString();

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;
