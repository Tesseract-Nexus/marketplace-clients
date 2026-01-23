'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { SpotlightStep, TOUR_STEPS } from './types';
import { SpotlightTooltip } from './SpotlightTooltip';
import { cn } from '@/lib/utils';

interface SpotlightOverlayProps {
  isActive: boolean;
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SpotlightOverlay({
  isActive,
  currentStepIndex,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: SpotlightOverlayProps) {
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!currentStep) return;

    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8; // Add some padding around the target
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      // If element not found, skip to next step or complete
      console.warn(`Spotlight target not found: ${currentStep.target}`);
      setTargetRect(null);
    }
  }, [currentStep]);

  // Measure on step change and window resize
  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      return;
    }

    // Initial measurement
    measureTarget();

    // Re-measure on resize
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget);

    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget);
    };
  }, [isActive, currentStepIndex, measureTarget]);

  // Handle step change animation
  useEffect(() => {
    if (isActive) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isActive]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLastStep) {
          onComplete();
        } else {
          onNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isFirstStep) {
          onPrevious();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isFirstStep, isLastStep, onNext, onPrevious, onSkip, onComplete]);

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      {/* Overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ transition: 'all 0.3s ease-out' }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* White background (visible) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout (transparent) */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                fill="black"
                className={cn(
                  'transition-all duration-300 ease-out',
                  isAnimating && 'animate-pulse'
                )}
              />
            )}
          </mask>
        </defs>

        {/* Semi-transparent overlay with mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
          onClick={onSkip}
        />
      </svg>

      {/* Spotlight ring around target */}
      {targetRect && (
        <div
          className={cn(
            'absolute rounded-xl pointer-events-none',
            'ring-4 ring-primary/50 ring-offset-2 ring-offset-transparent',
            'shadow-[0_0_0_4px_rgba(99,102,241,0.3)]',
            'transition-all duration-300 ease-out'
          )}
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      {targetRect && (
        <SpotlightTooltip
          step={currentStep}
          targetRect={targetRect}
          currentStepIndex={currentStepIndex}
          totalSteps={TOUR_STEPS.length}
          onNext={isLastStep ? onComplete : onNext}
          onPrevious={onPrevious}
          onSkip={onSkip}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      )}
    </div>
  );
}
