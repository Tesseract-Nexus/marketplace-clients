import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  details: NetInfoState['details'];
}

/**
 * Hook to track network connectivity status
 */
export function useNetwork(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    details: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        details: state.details,
      });
    });

    // Subscribe to updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        details: state.details,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}

/**
 * Hook to check if currently online
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetwork();
  return Boolean(isConnected && isInternetReachable);
}

/**
 * Hook to execute callback when network status changes
 */
export function useNetworkChange(onOnline?: () => void, onOffline?: () => void) {
  const [wasOnline, setWasOnline] = useState<boolean | null>(null);
  const isOnline = useIsOnline();

  useEffect(() => {
    if (wasOnline === null) {
      setWasOnline(isOnline);
      return;
    }

    if (!wasOnline && isOnline) {
      onOnline?.();
    } else if (wasOnline && !isOnline) {
      onOffline?.();
    }

    setWasOnline(isOnline);
  }, [isOnline, wasOnline, onOnline, onOffline]);
}

/**
 * Hook to queue operations when offline
 */
export function useOfflineQueue<T>() {
  const [queue, setQueue] = useState<T[]>([]);
  const isOnline = useIsOnline();

  const addToQueue = useCallback((item: T) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const processQueue = useCallback(
    async (processor: (item: T) => Promise<void>) => {
      if (!isOnline || queue.length === 0) {
        return;
      }

      const itemsToProcess = [...queue];
      setQueue([]);

      for (const item of itemsToProcess) {
        try {
          await processor(item);
        } catch (error) {
          // Re-add failed items to queue
          setQueue((prev) => [...prev, item]);
        }
      }
    },
    [isOnline, queue]
  );

  return {
    queue,
    queueLength: queue.length,
    addToQueue,
    processQueue,
    clearQueue: () => setQueue([]),
  };
}
