'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Step {
  number: number;
  title: string;
  icon?: ReactNode;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  allowSkip?: boolean;
  /** Variant: 'default' for full size, 'compact' for smaller version */
  variant?: 'default' | 'compact' | 'minimal';
}

/**
 * Stepper - A modern, sleek step indicator component
 *
 * @example
 * <Stepper
 *   steps={[
 *     { number: 1, title: 'Details', description: 'Basic info' },
 *     { number: 2, title: 'Settings', description: 'Configuration' },
 *     { number: 3, title: 'Review', description: 'Confirm' },
 *   ]}
 *   currentStep={2}
 *   variant="default"
 * />
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowSkip = false,
  variant = 'default',
}: StepperProps) {
  const handleStepClick = (stepNumber: number) => {
    if (!onStepClick) return;
    if (allowSkip || stepNumber <= currentStep + 1) {
      onStepClick(stepNumber);
    }
  };

  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';

  // Minimal variant - just dots with progress
  if (isMinimal) {
    return (
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <button
              onClick={() => handleStepClick(step.number)}
              disabled={!onStepClick}
              className={cn(
                'relative transition-all duration-300',
                onStepClick ? 'cursor-pointer' : 'cursor-default'
              )}
              title={step.title}
            >
              <div
                className={cn(
                  'rounded-full transition-all duration-300',
                  step.number < currentStep
                    ? 'w-2.5 h-2.5 bg-success'
                    : step.number === currentStep
                    ? 'w-3 h-3 bg-primary ring-4 ring-primary/20'
                    : 'w-2 h-2 bg-muted-foreground/30'
                )}
              />
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 rounded-full transition-all duration-500',
                  step.number < currentStep ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile: Show current step info only */}
      <div className={cn('sm:hidden', isCompact && 'hidden')}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-xs font-semibold text-primary">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-all duration-300',
                step.number < currentStep
                  ? 'bg-success'
                  : step.number === currentStep
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Full stepper */}
      <div className={cn('hidden sm:block', isCompact && 'block')}>
        <div className="flex items-start">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              {/* Step Item */}
              <div className="flex flex-col items-center flex-1 relative">
                <button
                  onClick={() => handleStepClick(step.number)}
                  disabled={!allowSkip && step.number > currentStep + 1 && !onStepClick}
                  className={cn(
                    'flex flex-col items-center transition-all group',
                    onStepClick && (allowSkip || step.number <= currentStep + 1)
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      'rounded-full flex items-center justify-center font-semibold transition-all duration-300 border-2',
                      isCompact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm',
                      step.number < currentStep
                        ? 'bg-success border-success text-white'
                        : step.number === currentStep
                        ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                        : 'bg-card border-border text-muted-foreground',
                      onStepClick &&
                        (allowSkip || step.number <= currentStep + 1) &&
                        'group-hover:scale-105'
                    )}
                  >
                    {step.number < currentStep ? (
                      <Check className={cn(isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                    ) : step.icon ? (
                      <span className="flex items-center justify-center">{step.icon}</span>
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Title and description */}
                  <div className={cn('text-center', isCompact ? 'mt-1.5' : 'mt-2')}>
                    <p
                      className={cn(
                        'font-semibold transition-all leading-tight',
                        isCompact ? 'text-[10px]' : 'text-xs',
                        step.number === currentStep
                          ? 'text-primary'
                          : step.number < currentStep
                          ? 'text-success'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && !isCompact && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {step.description}
                      </p>
                    )}
                  </div>
                </button>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 mx-1',
                    isCompact ? 'mt-4' : 'mt-5'
                  )}
                >
                  <div className="relative h-0.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 bg-success rounded-full transition-all duration-500',
                        step.number < currentStep ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepperNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  nextDisabled?: boolean;
  saveDisabled?: boolean;
  /** Show loading state on save button */
  saving?: boolean;
  /** Variant to match stepper */
  variant?: 'default' | 'compact';
}

/**
 * StepperNavigation - Navigation buttons for multi-step forms
 */
export function StepperNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSave,
  onCancel,
  nextLabel = 'Continue',
  previousLabel = 'Back',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  nextDisabled = false,
  saveDisabled = false,
  saving = false,
  variant = 'default',
}: StepperNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex items-center border-t border-border',
        isCompact ? 'pt-4 mt-4' : 'pt-6 mt-6',
        isFirstStep ? 'justify-end' : 'justify-between'
      )}
    >
      {/* Left side: Back button */}
      {!isFirstStep && (
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
          className={cn(
            'gap-2 text-muted-foreground hover:text-foreground',
            isCompact ? 'h-9 px-3 text-sm' : 'h-10 px-4'
          )}
        >
          <ChevronLeft className={cn(isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          {previousLabel}
        </Button>
      )}

      {/* Right side: Cancel + Next/Save */}
      <div className="flex items-center gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={cn(isCompact ? 'h-9 px-3 text-sm' : 'h-10 px-4')}
          >
            {cancelLabel}
          </Button>
        )}

        {!isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(
              'gap-2 bg-primary text-primary-foreground hover:bg-primary/90',
              isCompact ? 'h-9 px-4 text-sm' : 'h-10 px-5'
            )}
          >
            {nextLabel}
            <ChevronRight className={cn(isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          </Button>
        ) : (
          onSave && (
            <Button
              type="button"
              onClick={onSave}
              disabled={saveDisabled || saving}
              className={cn(
                'gap-2 bg-success text-white hover:bg-success/90',
                isCompact ? 'h-9 px-4 text-sm' : 'h-10 px-5'
              )}
            >
              {saving ? (
                <>
                  <Loader2 className={cn('animate-spin', isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                  Saving...
                </>
              ) : (
                <>
                  <Check className={cn(isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                  {saveLabel}
                </>
              )}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

/**
 * StepperContent - Wrapper for step content with smooth transitions
 */
interface StepperContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StepperContent({ children, className }: StepperContentProps) {
  return (
    <div className={cn('animate-in fade-in slide-in-from-right-4 duration-300', className)}>
      {children}
    </div>
  );
}
