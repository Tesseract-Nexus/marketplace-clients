'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { ChartErrorBoundary } from './error-boundary';

interface SafeChartContainerProps {
  children: ReactNode;
  width?: string | number;
  height?: string | number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  fallback?: ReactNode;
}

/**
 * SafeChartContainer wraps Recharts ResponsiveContainer to prevent
 * "width(-1) and height(-1) should be greater than 0" errors.
 *
 * It ensures the container has valid dimensions before rendering the chart.
 */
export function SafeChartContainer({
  children,
  width = '100%',
  height = '100%',
  minWidth = 100,
  minHeight = 100,
  className = '',
  fallback = null,
}: SafeChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
          setIsReady(true);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Watch for resize changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          setIsReady(true);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const hasValidDimensions = dimensions.width >= minWidth && dimensions.height >= minHeight;

  return (
    <ChartErrorBoundary>
      <div
        ref={containerRef}
        className={className}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minWidth: `${minWidth}px`,
          minHeight: `${minHeight}px`,
        }}
      >
        {isReady && hasValidDimensions ? (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          fallback || (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="animate-pulse">Loading chart...</div>
            </div>
          )
        )}
      </div>
    </ChartErrorBoundary>
  );
}

export default SafeChartContainer;
