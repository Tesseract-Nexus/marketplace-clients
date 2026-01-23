'use client';

import React, { useEffect, useState } from 'react';
import {
  PartyPopper,
  CheckCircle,
  Package,
  FolderPlus,
  UserPlus,
  Settings,
  ArrowRight,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupWizard } from '../SetupWizardProvider';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

interface CompletionStepProps {
  onFinish: () => void;
}

export function CompletionStep({ onFinish }: CompletionStepProps) {
  const { currentTenant } = useTenant();
  const {
    createdCategory,
    createdProduct,
    invitedStaff,
    completedSteps,
    skippedSteps,
    markStepComplete,
  } = useSetupWizard();
  const [showConfetti, setShowConfetti] = useState(false);

  // Mark completion step as complete and trigger celebration
  useEffect(() => {
    markStepComplete('completion');
    setShowConfetti(true);

    // Hide confetti after animation
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [markStepComplete]);

  const completionItems = [
    {
      icon: FolderPlus,
      label: 'Category',
      value: createdCategory?.name,
      completed: completedSteps.includes('category'),
      skipped: skippedSteps.includes('category'),
    },
    {
      icon: Package,
      label: 'Product',
      value: createdProduct?.name,
      completed: completedSteps.includes('product'),
      skipped: skippedSteps.includes('product'),
    },
    {
      icon: UserPlus,
      label: 'Team Member',
      value: invitedStaff?.email,
      completed: completedSteps.includes('staff'),
      skipped: skippedSteps.includes('staff'),
    },
    {
      icon: Settings,
      label: 'Settings',
      value: 'Configured',
      completed: completedSteps.includes('settings'),
      skipped: false,
    },
  ];

  const nextSteps = [
    { label: 'Add more products to your catalog', href: '/products' },
    { label: 'Set up shipping and payments', href: '/settings/shipping-carriers' },
    { label: 'Customize your storefront', href: '/storefronts' },
    { label: 'View your analytics dashboard', href: '/analytics' },
  ];

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-4 animate-bounce">
            <PartyPopper className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Congratulations!
          </h2>
          <p className="text-muted-foreground">
            {currentTenant?.name || 'Your store'} is ready to go. Here's what was set up:
          </p>
        </div>

        {/* Completion Summary */}
        <div className="px-6 pb-6">
          <div className="space-y-2 mb-6">
            {completionItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  item.completed
                    ? 'border-success/30 bg-success/5'
                    : item.skipped
                    ? 'border-border bg-muted/30'
                    : 'border-border bg-card'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    item.completed
                      ? 'bg-success/20 text-success'
                      : item.skipped
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {item.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : item.skipped ? (
                    <SkipForward className="w-4 h-4" />
                  ) : (
                    <item.icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  {item.value && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {item.value}
                    </span>
                  )}
                </div>
                {item.completed && (
                  <span className="text-xs text-success font-medium">Completed</span>
                )}
                {item.skipped && (
                  <span className="text-xs text-muted-foreground">Skipped</span>
                )}
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Suggested Next Steps
            </h3>
            <div className="space-y-2">
              {nextSteps.map((step, index) => (
                <a
                  key={index}
                  href={step.href}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border border-border',
                    'hover:border-primary/50 hover:bg-primary/5 transition-colors',
                    'text-sm text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="flex-1">{step.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <Button onClick={onFinish} className="w-full h-12 text-base" variant="success">
          Explore Your Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Confetti Styles */}
      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confetti-fall linear forwards;
          opacity: 0.8;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
