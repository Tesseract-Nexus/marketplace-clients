'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  labelClassName?: string;
}

const sizeMap = {
  sm: { size: 48, stroke: 4, fontSize: 'text-xs' },
  md: { size: 72, stroke: 5, fontSize: 'text-sm' },
  lg: { size: 96, stroke: 6, fontSize: 'text-base' },
};

export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  label,
  strokeWidth,
  className,
  trackClassName,
  progressClassName,
  labelClassName,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const { size: svgSize, stroke: defaultStroke, fontSize } = sizeMap[size];
  const stroke = strokeWidth || defaultStroke;

  const radius = (svgSize - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentage === 100) return 'text-success stroke-success';
    if (percentage >= 60) return 'text-primary stroke-primary';
    return 'text-warning stroke-warning';
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        className="transform -rotate-90"
        width={svgSize}
        height={svgSize}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        {/* Background track */}
        <circle
          className={cn('stroke-muted', trackClassName)}
          strokeWidth={stroke}
          fill="none"
          r={radius}
          cx={svgSize / 2}
          cy={svgSize / 2}
        />
        {/* Progress arc */}
        <circle
          className={cn(
            'transition-all duration-500 ease-out',
            getProgressColor(),
            progressClassName
          )}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={svgSize / 2}
          cy={svgSize / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center',
            labelClassName
          )}
        >
          <span className={cn('font-bold', fontSize, getProgressColor().split(' ')[0])}>
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CircularProgress;
