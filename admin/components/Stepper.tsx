'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

export function Stepper({ steps, currentStep, onStepClick, allowSkip = false }: StepperProps) {
  const handleStepClick = (stepNumber: number) => {
    if (!onStepClick) return;

    // If allowSkip is true, allow jumping to any step
    // If false, only allow going to previous steps or the next immediate step
    if (allowSkip || stepNumber <= currentStep + 1) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Item */}
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => handleStepClick(step.number)}
                disabled={!allowSkip && step.number > currentStep + 1 && !onStepClick}
                className={cn(
                  "w-full flex flex-col items-center transition-all",
                  onStepClick && (allowSkip || step.number <= currentStep + 1)
                    ? "cursor-pointer group"
                    : "cursor-default"
                )}
              >
                {/* Circle with number or icon */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all mb-3 border-3 shadow-md",
                    step.number < currentStep
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 shadow-green-200"
                      : step.number === currentStep
                      ? "bg-primary text-primary-foreground border-primary/70 shadow-primary/30 ring-4 ring-primary/20 scale-110"
                      : "bg-white text-muted-foreground border-border shadow-gray-100",
                    onStepClick && (allowSkip || step.number <= currentStep + 1) && "group-hover:scale-105"
                  )}
                >
                  {step.number < currentStep ? (
                    <Check className="w-6 h-6" aria-hidden="true" />
                  ) : step.icon ? (
                    <span className="flex items-center justify-center">{step.icon}</span>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Title and description */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-bold transition-all",
                      step.number === currentStep
                        ? "text-primary text-base"
                        : step.number < currentStep
                        ? "text-green-700"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
              </button>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 mb-12">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    step.number < currentStep
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-md shadow-green-200"
                      : "bg-gray-200"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
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
}

export function StepperNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSave,
  onCancel,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  nextDisabled = false,
  saveDisabled = false,
}: StepperNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between items-center pt-8 border-t-2 border-border mt-8">
      <div>
        {!isFirstStep && (
          <button
            onClick={onPrevious}
            className="px-6 py-3 border-2 border-border bg-white text-foreground rounded-xl hover:bg-muted transition-all font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> {previousLabel}
          </button>
        )}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 border-2 border-border bg-white text-foreground rounded-xl hover:bg-muted transition-all font-semibold shadow-sm hover:shadow-md"
          >
            {cancelLabel}
          </button>
        )}

        {!isLastStep ? (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {nextLabel} <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          onSave && (
            <button
              onClick={onSave}
              disabled={saveDisabled}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-4 h-4" aria-hidden="true" /> {saveLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
