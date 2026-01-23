'use client';

import React, { useState, useCallback } from 'react';
import { useSetupWizard } from './SetupWizardProvider';
import { WizardModal } from './WizardModal';
import { SpotlightOverlay } from './SpotlightOverlay';
import { MinimizedBadge } from './MinimizedBadge';
import { WelcomeStep } from './steps/WelcomeStep';
import { CategoryStep } from './steps/CategoryStep';
import { ProductStep } from './steps/ProductStep';
import { StaffStep } from './steps/StaffStep';
import { SettingsStep } from './steps/SettingsStep';
import { CompletionStep } from './steps/CompletionStep';
import { WIZARD_STEPS } from './types';

/**
 * SetupWizard - Main orchestrator component for the setup wizard system
 *
 * This component manages the flow between:
 * 1. Welcome phase - Introduction and overview
 * 2. Tour phase - Optional spotlight tour of the UI
 * 3. Setup phase - Step-by-step setup wizard
 * 4. Completion - Celebration and next steps
 */
export function SetupWizard() {
  const {
    isOpen,
    phase,
    currentStep,
    startTour,
    skipTour,
    startSetup,
    nextStep,
    previousStep,
    skipStep,
    dismissWizard,
    completeWizard,
    closeWizard,
    setPhase,
  } = useSetupWizard();

  // Tour state
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Welcome step handlers
  const handleGetStarted = useCallback(() => {
    startTour();
  }, [startTour]);

  const handleSkipTour = useCallback(() => {
    skipTour();
  }, [skipTour]);

  const handleDismiss = useCallback(() => {
    dismissWizard(false);
  }, [dismissWizard]);

  // Tour handlers
  const handleTourNext = useCallback(() => {
    setTourStepIndex((prev) => prev + 1);
  }, []);

  const handleTourPrevious = useCallback(() => {
    setTourStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleTourSkip = useCallback(() => {
    setTourStepIndex(0);
    startSetup();
  }, [startSetup]);

  const handleTourComplete = useCallback(() => {
    setTourStepIndex(0);
    startSetup();
  }, [startSetup]);

  // Setup step handlers
  const handleStepComplete = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handleStepSkip = useCallback(() => {
    skipStep();
  }, [skipStep]);

  const handleStepBack = useCallback(() => {
    if (currentStep === 0) {
      // Go back to welcome
      setPhase('welcome');
    } else {
      previousStep();
    }
  }, [currentStep, previousStep, setPhase]);

  // Completion handler
  const handleFinish = useCallback(() => {
    completeWizard();
    closeWizard();
  }, [completeWizard, closeWizard]);

  // Don't render anything if wizard is not open
  if (!isOpen) {
    return null;
  }

  // Render tour overlay if in tour phase
  if (phase === 'tour') {
    return (
      <>
        <SpotlightOverlay
          isActive={true}
          currentStepIndex={tourStepIndex}
          onNext={handleTourNext}
          onPrevious={handleTourPrevious}
          onSkip={handleTourSkip}
          onComplete={handleTourComplete}
        />
        <MinimizedBadge />
      </>
    );
  }

  // Render the current step content
  const renderStepContent = () => {
    if (phase === 'welcome') {
      return (
        <WelcomeStep
          onGetStarted={handleGetStarted}
          onSkipTour={handleSkipTour}
          onDismiss={handleDismiss}
        />
      );
    }

    if (phase === 'setup' || phase === 'completed') {
      const currentStepId = WIZARD_STEPS[currentStep]?.id;

      switch (currentStepId) {
        case 'category':
          return (
            <CategoryStep
              onComplete={handleStepComplete}
              onSkip={handleStepSkip}
              onBack={handleStepBack}
            />
          );
        case 'product':
          return (
            <ProductStep
              onComplete={handleStepComplete}
              onSkip={handleStepSkip}
              onBack={handleStepBack}
            />
          );
        case 'staff':
          return (
            <StaffStep
              onComplete={handleStepComplete}
              onSkip={handleStepSkip}
              onBack={handleStepBack}
            />
          );
        case 'settings':
          return (
            <SettingsStep
              onComplete={handleStepComplete}
              onBack={handleStepBack}
            />
          );
        case 'completion':
          return <CompletionStep onFinish={handleFinish} />;
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <>
      <WizardModal>{renderStepContent()}</WizardModal>
      <MinimizedBadge />
    </>
  );
}
