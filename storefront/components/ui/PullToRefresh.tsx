'use client';

import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number; // Pull distance to trigger refresh (default: 80)
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only enable on touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    // Only start pull if at top of scroll
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;

    const touch = e.touches[0];
    if (!touch) return;

    startY.current = touch.clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) {
      setPullDistance(0);
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const currentY = touch.clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance for more natural feel
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(distance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing && !disabled) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Keep indicator visible during refresh

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, disabled, onRefresh]);

  // Add touch event listeners
  useEffect(() => {
    if (!isTouchDevice) return;

    const options = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDevice, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate progress (0 to 1)
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  // Don't render pull indicator on non-touch devices
  if (!isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'pull-refresh-indicator',
          'absolute left-1/2 -translate-x-1/2 z-50',
          'flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'bg-white dark:bg-stone-800',
          'border border-stone-200 dark:border-stone-700',
          'shadow-lg',
          'transition-opacity duration-200',
          pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: Math.max(pullDistance - 50, -50),
          transform: `translateX(-50%) rotate(${rotation}deg)`,
        }}
      >
        <RefreshCw
          className={cn(
            'h-5 w-5 text-tenant-primary',
            isRefreshing && 'animate-spin'
          )}
        />
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
