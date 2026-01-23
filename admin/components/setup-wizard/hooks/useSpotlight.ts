'use client';

import { useState, useCallback, useEffect } from 'react';
import { SpotlightState, TOUR_STEPS } from '../types';

/**
 * Hook for managing spotlight tour state and positioning
 */
export function useSpotlight() {
  const [state, setState] = useState<SpotlightState>({
    isActive: false,
    currentStepIndex: 0,
    steps: TOUR_STEPS,
  });

  // Start the spotlight tour
  const startTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
    }));
  }, []);

  // End the spotlight tour
  const endTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      currentStepIndex: 0,
    }));
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= prev.steps.length) {
        return { ...prev, isActive: false, currentStepIndex: 0 };
      }
      return { ...prev, currentStepIndex: nextIndex };
    });
  }, []);

  // Go to previous step
  const previousStep = useCallback(() => {
    setState((prev) => {
      const prevIndex = Math.max(0, prev.currentStepIndex - 1);
      return { ...prev, currentStepIndex: prevIndex };
    });
  }, []);

  // Go to specific step
  const goToStep = useCallback((index: number) => {
    setState((prev) => {
      const clampedIndex = Math.max(0, Math.min(index, prev.steps.length - 1));
      return { ...prev, currentStepIndex: clampedIndex };
    });
  }, []);

  // Get current step
  const currentStep = state.steps[state.currentStepIndex] || null;

  // Check if first/last step
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.steps.length - 1;

  // Calculate progress
  const progress = state.steps.length > 0
    ? Math.round(((state.currentStepIndex + 1) / state.steps.length) * 100)
    : 0;

  return {
    // State
    isActive: state.isActive,
    currentStepIndex: state.currentStepIndex,
    currentStep,
    steps: state.steps,
    totalSteps: state.steps.length,
    isFirstStep,
    isLastStep,
    progress,

    // Actions
    startTour,
    endTour,
    nextStep,
    previousStep,
    goToStep,
  };
}

/**
 * Hook for calculating spotlight target position
 */
export function useSpotlightTarget(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const element = document.querySelector(selector);
    if (!element) {
      setRect(null);
      return;
    }

    // Measure initial position
    const measure = () => {
      const newRect = element.getBoundingClientRect();
      setRect(newRect);
    };

    measure();

    // Re-measure on resize and scroll
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    // Set up a MutationObserver to detect layout changes
    const observer = new MutationObserver(measure);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer.disconnect();
    };
  }, [selector]);

  return rect;
}
