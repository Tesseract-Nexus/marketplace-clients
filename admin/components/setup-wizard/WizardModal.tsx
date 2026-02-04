'use client';

import React, { useEffect } from 'react';
import { X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/Stepper';
import { useSetupWizard } from './SetupWizardProvider';
import { WIZARD_STEPS } from './types';
import { cn } from '@/lib/utils';

interface WizardModalProps {
  children: React.ReactNode;
}

export function WizardModal({ children }: WizardModalProps) {
  const { isOpen, isMinimized, currentStep, phase, closeWizard, minimizeWizard, dismissWizard } =
    useSetupWizard();

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        minimizeWizard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, minimizeWizard]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMinimized]);

  if (!isOpen || isMinimized) {
    return null;
  }

  // Convert wizard steps to Stepper format
  const stepperSteps = WIZARD_STEPS.map((step, index) => ({
    number: index + 1,
    title: step.title,
    description: step.description,
  }));

  const showStepper = phase === 'setup' && currentStep < WIZARD_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={minimizeWizard}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        data-testid="setup-wizard"
        className={cn(
          'fixed z-[201] bg-card border border-border shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-300',
          // Mobile: full screen
          'inset-0 rounded-none',
          // Tablet: centered modal
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-[540px] sm:max-h-[85vh] sm:rounded-2xl',
          // Desktop: larger modal
          'lg:w-[640px]'
        )}
      >
        {/* Header with close/minimize buttons */}
        <div className="absolute top-0 right-0 p-3 flex items-center gap-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={minimizeWizard}
            className="rounded-lg text-muted-foreground hover:text-foreground"
            title="Minimize"
            aria-label="Minimize wizard"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dismissWizard(false)}
            className="rounded-lg text-muted-foreground hover:text-foreground"
            title="Close"
            aria-label="Close wizard"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stepper (only during setup phase, not on completion) */}
        {showStepper && (
          <div className="px-6 pt-4 pb-2 border-b border-border">
            <Stepper
              steps={stepperSteps.slice(0, -1)} // Exclude completion step from stepper
              currentStep={currentStep + 1}
              variant="compact"
            />
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'flex flex-col overflow-hidden',
            showStepper
              ? 'h-[calc(100vh-80px)] sm:h-[calc(85vh-80px)] sm:max-h-[600px]'
              : 'h-screen sm:h-auto sm:max-h-[85vh]'
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
