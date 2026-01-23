'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpotlightStep } from './types';
import { cn } from '@/lib/utils';

interface SpotlightTooltipProps {
  step: SpotlightStep;
  targetRect: { top: number; left: number; width: number; height: number };
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const TOOLTIP_OFFSET = 16;
const TOOLTIP_WIDTH = 320;

export function SpotlightTooltip({
  step,
  targetRect,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isFirstStep,
  isLastStep,
}: SpotlightTooltipProps) {
  // Calculate tooltip position based on step.position and available space
  const tooltipStyle = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    switch (step.position) {
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left + targetRect.width + TOOLTIP_OFFSET;
        arrowPosition = 'left';
        // If tooltip would overflow right, switch to left
        if (left + TOOLTIP_WIDTH > viewportWidth - 20) {
          left = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
          arrowPosition = 'right';
        }
        break;

      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
        arrowPosition = 'right';
        // If tooltip would overflow left, switch to right
        if (left < 20) {
          left = targetRect.left + targetRect.width + TOOLTIP_OFFSET;
          arrowPosition = 'left';
        }
        break;

      case 'bottom':
        top = targetRect.top + targetRect.height + TOOLTIP_OFFSET;
        left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
        arrowPosition = 'top';
        // If tooltip would overflow bottom, switch to top
        if (top + 200 > viewportHeight) {
          top = targetRect.top - TOOLTIP_OFFSET - 200;
          arrowPosition = 'bottom';
        }
        break;

      case 'top':
      default:
        top = targetRect.top - TOOLTIP_OFFSET - 200;
        left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
        arrowPosition = 'bottom';
        // If tooltip would overflow top, switch to bottom
        if (top < 20) {
          top = targetRect.top + targetRect.height + TOOLTIP_OFFSET;
          arrowPosition = 'top';
        }
        break;
    }

    // Ensure tooltip doesn't overflow horizontally
    left = Math.max(20, Math.min(left, viewportWidth - TOOLTIP_WIDTH - 20));

    // Apply custom offset if provided
    if (step.offset) {
      left += step.offset.x;
      top += step.offset.y;
    }

    return { top, left, arrowPosition };
  }, [step.position, step.offset, targetRect]);

  return (
    <div
      className={cn(
        'absolute pointer-events-auto z-[301]',
        'bg-card border border-border rounded-xl shadow-2xl',
        'animate-in fade-in slide-in-from-bottom-2 duration-300'
      )}
      style={{
        top: tooltipStyle.top,
        left: tooltipStyle.left,
        width: TOOLTIP_WIDTH,
        transform:
          tooltipStyle.arrowPosition === 'left' || tooltipStyle.arrowPosition === 'right'
            ? 'translateY(-50%)'
            : 'none',
      }}
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-3 h-3 bg-card border-border rotate-45',
          tooltipStyle.arrowPosition === 'top' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-l',
          tooltipStyle.arrowPosition === 'bottom' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b border-r',
          tooltipStyle.arrowPosition === 'left' && 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b',
          tooltipStyle.arrowPosition === 'right' && 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t'
        )}
      />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-foreground pr-6">{step.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="h-6 w-6 p-0 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-200',
                  i === currentStepIndex
                    ? 'w-4 bg-primary'
                    : i < currentStepIndex
                    ? 'bg-success'
                    : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={onNext}
              className="h-8 px-3 gap-1"
            >
              {isLastStep ? 'Start Setup' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
