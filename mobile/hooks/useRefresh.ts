import { useState, useCallback } from 'react';

interface UseRefreshOptions {
  onRefresh: () => Promise<unknown>;
  minimumDelay?: number;
}

interface UseRefreshReturn {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

/**
 * Hook for pull-to-refresh functionality
 * Ensures minimum visual feedback duration for better UX
 */
export function useRefresh({ onRefresh, minimumDelay = 500 }: UseRefreshOptions): UseRefreshReturn {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    const startTime = Date.now();

    try {
      await onRefresh();
    } finally {
      // Ensure minimum delay for visual feedback
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, minimumDelay - elapsed);

      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      setRefreshing(false);
    }
  }, [onRefresh, minimumDelay]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
}

/**
 * Hook for managing multiple refresh sources
 */
export function useMultiRefresh(refreshFunctions: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.allSettled(refreshFunctions.map((fn) => fn()));
    } finally {
      setRefreshing(false);
    }
  }, [refreshFunctions]);

  return {
    refreshing,
    onRefresh,
  };
}
