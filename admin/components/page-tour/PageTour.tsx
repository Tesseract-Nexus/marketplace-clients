'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb, Keyboard, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTour } from './PageTourProvider';
import { cn } from '@/lib/utils';

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function PageTour() {
  const {
    isActive,
    currentStepIndex,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    getCurrentTourConfig,
    getCurrentStep,
  } = usePageTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const config = getCurrentTourConfig();
  const step = getCurrentStep();

  // Find and highlight the target element
  useEffect(() => {
    if (!isActive || !step) {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }

    setIsAnimating(true);

    const findAndHighlight = () => {
      // Try to find the target element
      let element: Element | null = null;

      // Try exact selector first
      element = document.querySelector(step.target);

      // If not found and selector has alternatives (with :has-text), try simpler approaches
      if (!element && step.target.includes(':has-text')) {
        const match = step.target.match(/button:has-text\("([^"]+)"\)/);
        if (match) {
          const text = match[1];
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent?.includes(text)) {
              element = btn;
              break;
            }
          }
        }
      }

      // Try data-tour attribute if selector starts with [data-tour=
      if (!element && step.target.startsWith('[data-tour=')) {
        const match = step.target.match(/\[data-tour="([^"]+)"\]/);
        if (match) {
          element = document.querySelector(`[data-tour="${match[1]}"]`);
        }
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position
        setTimeout(() => {
          calculateTooltipPosition(rect);
          setIsAnimating(false);
        }, 100);
      } else {
        // Element not found, skip to next step after delay
        console.warn(`Tour element not found: ${step.target}`);
        setTimeout(() => {
          setIsAnimating(false);
          // Auto-skip if element not found
        }, 500);
      }
    };

    // Delay to allow page to render
    const timer = setTimeout(findAndHighlight, step.delay || 300);
    return () => clearTimeout(timer);
  }, [isActive, step, currentStepIndex]);

  // Calculate optimal tooltip position
  const calculateTooltipPosition = (rect: DOMRect) => {
    if (!tooltipRef.current || !step) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 16;
    const arrowSize = 12;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
      case 'top-left':
      case 'top-right':
        top = rect.top - tooltipRect.height - padding - arrowSize;
        left = position === 'top-left'
          ? rect.left
          : position === 'top-right'
            ? rect.right - tooltipRect.width
            : rect.left + rect.width / 2 - tooltipRect.width / 2;
        arrowPosition = 'bottom';
        break;

      case 'bottom':
      case 'bottom-left':
      case 'bottom-right':
        top = rect.bottom + padding + arrowSize;
        left = position === 'bottom-left'
          ? rect.left
          : position === 'bottom-right'
            ? rect.right - tooltipRect.width
            : rect.left + rect.width / 2 - tooltipRect.width / 2;
        arrowPosition = 'top';
        break;

      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - padding - arrowSize;
        arrowPosition = 'right';
        break;

      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + padding + arrowSize;
        arrowPosition = 'left';
        break;
    }

    // Keep tooltip within viewport
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) {
      top = rect.bottom + padding + arrowSize;
      arrowPosition = 'top';
    }
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = rect.top - tooltipRect.height - padding - arrowSize;
      arrowPosition = 'bottom';
    }

    setTooltipPosition({ top, left, arrowPosition });
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        previousStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skipTour, previousStep]);

  const handleNext = () => {
    if (config && currentStepIndex >= config.steps.length - 1) {
      completeTour();
    } else {
      nextStep();
    }
  };

  if (!isActive || !config || !step) {
    return null;
  }

  const isLastStep = currentStepIndex >= config.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <>
      {/* Overlay with cutout for target element */}
      <div className="fixed inset-0 z-[300] pointer-events-auto">
        {/* Semi-transparent overlay */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tour-spotlight-mask)"
            onClick={skipTour}
          />
        </svg>

        {/* Highlight ring around target */}
        {targetRect && (
          <div
            className={cn(
              "absolute border-2 border-primary rounded-lg pointer-events-none",
              "shadow-[0_0_0_4px_rgba(99,102,241,0.3)]",
              isAnimating ? "opacity-0" : "opacity-100 animate-pulse"
            )}
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              transition: 'all 0.3s ease-out',
            }}
          />
        )}

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-[301] w-80 bg-card border border-border rounded-xl shadow-2xl",
            "transform transition-all duration-300",
            isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}
          style={tooltipPosition ? {
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          } : { visibility: 'hidden' }}
        >
          {/* Arrow */}
          {tooltipPosition && (
            <div
              className={cn(
                "absolute w-3 h-3 bg-card border-border transform rotate-45",
                tooltipPosition.arrowPosition === 'top' && "border-t border-l -top-1.5 left-1/2 -translate-x-1/2",
                tooltipPosition.arrowPosition === 'bottom' && "border-b border-r -bottom-1.5 left-1/2 -translate-x-1/2",
                tooltipPosition.arrowPosition === 'left' && "border-t border-l -left-1.5 top-1/2 -translate-y-1/2",
                tooltipPosition.arrowPosition === 'right' && "border-b border-r -right-1.5 top-1/2 -translate-y-1/2"
              )}
            />
          )}

          {/* Content */}
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
              <button
                onClick={skipTour}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3">
              {step.description}
            </p>

            {/* Tip */}
            {step.tip && (
              <div className="flex items-start gap-2 p-2 bg-info/10 border border-info/20 rounded-lg mb-3">
                <Keyboard className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-info">{step.tip}</p>
              </div>
            )}

            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {config.steps.length}
              </span>
              <div className="flex gap-1">
                {config.steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      idx === currentStepIndex
                        ? "bg-primary"
                        : idx < currentStepIndex
                          ? "bg-primary/50"
                          : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="text-muted-foreground"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip Tour
              </Button>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[302] flex items-center gap-2 px-3 py-1.5 bg-card/90 backdrop-blur border border-border rounded-full text-xs text-muted-foreground">
        <span>Use</span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">→</kbd>
        <span>to navigate,</span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd>
        <span>to skip</span>
      </div>
    </>
  );
}
