'use client';

import { User, Truck, CreditCard, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCheckout, CheckoutStep, STEPS_ORDER } from '@/context/CheckoutContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';

interface StepConfig {
  id: CheckoutStep;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  { id: 'contact', label: 'Contact', shortLabel: 'Info', icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
  { id: 'shipping', label: 'Shipping', shortLabel: 'Ship', icon: <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
  { id: 'payment', label: 'Payment', shortLabel: 'Pay', icon: <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
  { id: 'review', label: 'Review', shortLabel: 'Done', icon: <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
];

export function CheckoutProgress() {
  const { currentStep, completedSteps, goToStep, canNavigateToStep, getProgressPercent } = useCheckout();

  const currentIndex = STEPS_ORDER.indexOf(currentStep);

  return (
    <div className="flex flex-col items-center mb-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center w-full max-w-xl">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const canNavigate = canNavigateToStep(step.id);
          const isPast = currentIndex > index;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <button
                onClick={() => canNavigate && goToStep(step.id)}
                disabled={!canNavigate}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 group transition-all',
                  canNavigate ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <motion.div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all',
                    isCurrent && 'border-tenant-primary bg-tenant-primary text-on-tenant-primary shadow-md',
                    isCompleted && !isCurrent && 'border-green-500 bg-green-500 text-white',
                    !isCurrent && !isCompleted && 'border-muted-foreground/30 bg-muted text-muted-foreground'
                  )}
                  animate={isCurrent ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-medium transition-colors',
                    isCurrent && 'text-tenant-primary',
                    isCompleted && !isCurrent && 'text-green-600',
                    !isCurrent && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {/* Show short label on mobile, full on desktop */}
                  <span className="sm:hidden"><TranslatedUIText text={step.shortLabel} /></span>
                  <span className="hidden sm:inline"><TranslatedUIText text={step.label} /></span>
                </span>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 sm:mx-2 relative">
                  <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: isPast || isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact progress text - hidden on mobile, show progress bar instead */}
      <p className="mt-2 text-[10px] text-muted-foreground hidden sm:block">
        <TranslatedUIText text="Step" /> {currentIndex + 1}/{STEPS.length}
        {currentStep === 'review' && (
          <span className="text-green-600 ml-2 font-medium">
            <TranslatedUIText text="Almost done!" />
          </span>
        )}
      </p>

      {/* Progress bar (mobile only) */}
      <div className="w-full max-w-[200px] mt-2 sm:hidden">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-tenant-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${getProgressPercent()}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

export default CheckoutProgress;
