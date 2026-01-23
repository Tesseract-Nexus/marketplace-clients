'use client';

import React from 'react';
import { Sparkles, ChevronUp } from 'lucide-react';
import { useSetupWizard } from './SetupWizardProvider';
import { WIZARD_STEPS } from './types';
import { cn } from '@/lib/utils';

export function MinimizedBadge() {
  const { isOpen, isMinimized, restoreWizard, currentStep, completedSteps, phase } =
    useSetupWizard();

  // Only show when wizard is minimized
  if (!isOpen || !isMinimized) {
    return null;
  }

  // Calculate progress
  const totalSteps = WIZARD_STEPS.length - 1; // Exclude completion step
  const progress = Math.round((completedSteps.length / totalSteps) * 100);

  // Get current step title
  const currentStepTitle = phase === 'welcome'
    ? 'Get Started'
    : phase === 'tour'
    ? 'Quick Tour'
    : WIZARD_STEPS[currentStep]?.title || 'Setup';

  return (
    <button
      onClick={restoreWizard}
      className={cn(
        'fixed bottom-6 right-6 z-[199]',
        'flex items-center gap-3 px-4 py-3',
        'bg-primary text-primary-foreground',
        'rounded-full shadow-lg',
        'hover:shadow-xl hover:scale-105',
        'transition-all duration-200',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        'group'
      )}
    >
      {/* Icon */}
      <div className="relative">
        <Sparkles className="w-5 h-5" />
        {/* Progress ring */}
        <svg
          className="absolute -inset-1 w-7 h-7 -rotate-90"
          viewBox="0 0 28 28"
        >
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${(progress / 100) * 75.4} 75.4`}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium leading-tight">
          Setup Wizard
        </span>
        <span className="text-xs opacity-80 leading-tight">
          {currentStepTitle}
        </span>
      </div>

      {/* Expand indicator */}
      <ChevronUp className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
