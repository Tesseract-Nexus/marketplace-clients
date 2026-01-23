'use client';

import React from 'react';
import { Sparkles, Package, Users, Settings, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { useSetupWizard } from '../SetupWizardProvider';
import { cn } from '@/lib/utils';

interface WelcomeStepProps {
  onGetStarted: () => void;
  onSkipTour: () => void;
  onDismiss: () => void;
}

export function WelcomeStep({ onGetStarted, onSkipTour, onDismiss }: WelcomeStepProps) {
  const { currentTenant } = useTenant();

  const setupItems = [
    {
      icon: Package,
      title: 'Create Categories & Products',
      description: 'Organize and add items to your catalog',
    },
    {
      icon: Users,
      title: 'Invite Team Members',
      description: 'Add staff to help manage your store',
    },
    {
      icon: Settings,
      title: 'Configure Settings',
      description: 'Set up essential store settings',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center px-6 pt-8 pb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to {currentTenant?.name || 'Your Store'}!
        </h2>
        <p className="text-muted-foreground">
          Let's get your store set up in just a few steps.
        </p>
      </div>

      {/* Setup preview */}
      <div className="flex-1 px-6 pb-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Here's what we'll help you with:
          </p>
          {setupItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50',
                'hover:bg-card/80 transition-colors duration-200'
              )}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <div className="flex flex-col gap-3">
          <Button
            onClick={onGetStarted}
            className="w-full h-12 text-base gap-2"
          >
            Let's Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onSkipTour}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour, go to setup
            </button>
            <span className="text-muted-foreground/50">|</span>
            <button
              onClick={onDismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
