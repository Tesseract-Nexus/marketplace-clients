'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseLoadingTimeoutOptions {
  /** Time in ms before showing "taking longer" message */
  warningTimeout?: number;
  /** Time in ms before showing error/retry option */
  errorTimeout?: number;
  /** Whether to automatically reset on loading change */
  autoReset?: boolean;
}

interface UseLoadingTimeoutReturn {
  /** Whether the warning timeout has been reached */
  isSlowLoading: boolean;
  /** Whether the error timeout has been reached */
  hasTimedOut: boolean;
  /** Time elapsed since loading started (in seconds) */
  elapsedTime: number;
  /** Reset the timeout state */
  reset: () => void;
  /** Start tracking loading */
  startLoading: () => void;
  /** Stop tracking loading */
  stopLoading: () => void;
}

/**
 * Hook for tracking loading timeouts with progressive feedback
 *
 * @example
 * const { isSlowLoading, hasTimedOut, reset } = useLoadingTimeout({
 *   warningTimeout: 5000,
 *   errorTimeout: 15000,
 * });
 *
 * if (hasTimedOut) {
 *   return <div>Taking too long. <button onClick={reset}>Retry</button></div>
 * }
 * if (isSlowLoading) {
 *   return <div>Taking longer than expected...</div>
 * }
 */
export function useLoadingTimeout({
  warningTimeout = 5000,
  errorTimeout = 15000,
  autoReset = true,
}: UseLoadingTimeoutOptions = {}): UseLoadingTimeoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const reset = useCallback(() => {
    setStartTime(null);
    setElapsedTime(0);
    setIsSlowLoading(false);
    setHasTimedOut(false);
  }, []);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setStartTime(Date.now());
    setIsSlowLoading(false);
    setHasTimedOut(false);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (autoReset) {
      reset();
    }
  }, [autoReset, reset]);

  // Update elapsed time every second while loading
  useEffect(() => {
    if (!isLoading || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(Math.floor(elapsed / 1000));

      if (elapsed >= errorTimeout && !hasTimedOut) {
        setHasTimedOut(true);
      } else if (elapsed >= warningTimeout && !isSlowLoading) {
        setIsSlowLoading(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, startTime, warningTimeout, errorTimeout, hasTimedOut, isSlowLoading]);

  return {
    isSlowLoading,
    hasTimedOut,
    elapsedTime,
    reset,
    startLoading,
    stopLoading,
  };
}

export default useLoadingTimeout;
