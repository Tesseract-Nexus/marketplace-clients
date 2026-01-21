'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { Button } from '@/components/ui/button';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';

interface LoadingWithTimeoutProps {
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom slow loading message */
  slowLoadingMessage?: string;
  /** Custom timeout message */
  timeoutMessage?: string;
  /** Time in ms before showing slow message */
  warningTimeout?: number;
  /** Time in ms before showing retry option */
  errorTimeout?: number;
  /** Additional className */
  className?: string;
  /** Children to render while loading */
  children?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * LoadingWithTimeout Component
 *
 * A loading indicator that provides progressive feedback:
 * 1. Initial: Shows spinner with loading message
 * 2. After warningTimeout: Shows "taking longer than expected" message
 * 3. After errorTimeout: Shows retry option
 */
export function LoadingWithTimeout({
  isLoading,
  onRetry,
  loadingMessage = 'Loading...',
  slowLoadingMessage = 'This is taking longer than expected...',
  timeoutMessage = 'Something seems to be wrong. Would you like to try again?',
  warningTimeout = 5000,
  errorTimeout = 15000,
  className,
  children,
  size = 'md',
}: LoadingWithTimeoutProps) {
  const {
    isSlowLoading,
    hasTimedOut,
    elapsedTime,
    startLoading,
    stopLoading,
    reset,
  } = useLoadingTimeout({
    warningTimeout,
    errorTimeout,
  });

  // Sync with isLoading prop
  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [isLoading, startLoading, stopLoading]);

  const handleRetry = () => {
    reset();
    onRetry?.();
  };

  if (!isLoading) {
    return <>{children}</>;
  }

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', sizeClasses[size], className)}>
      <AnimatePresence mode="wait">
        {hasTimedOut ? (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground max-w-xs">
              <TranslatedUIText text={timeoutMessage} />
            </p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                <TranslatedUIText text="Try Again" />
              </Button>
            )}
          </motion.div>
        ) : isSlowLoading ? (
          <motion.div
            key="slow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Loader2 className={cn(iconSizes[size], 'animate-spin text-tenant-primary')} aria-hidden="true" />
            <p className="text-muted-foreground">
              <TranslatedUIText text={slowLoadingMessage} />
            </p>
            <p className="text-xs text-muted-foreground/70">
              {elapsedTime}s <TranslatedUIText text="elapsed" />
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className={cn(iconSizes[size], 'animate-spin text-tenant-primary')} aria-hidden="true" />
            <p className="text-muted-foreground">
              <TranslatedUIText text={loadingMessage} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LoadingWithTimeout;
