'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';

// Refresh interval options (in milliseconds)
export const REFRESH_INTERVALS = {
  OFF: 0,
  '10s': 10000,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
} as const;

export type RefreshIntervalKey = keyof typeof REFRESH_INTERVALS;

// Routes where auto-refresh is allowed
const AUTO_REFRESH_ALLOWED_ROUTES = ['/'];

interface RefreshContextType {
  // Current interval setting
  interval: RefreshIntervalKey;
  setInterval: (interval: RefreshIntervalKey) => void;

  // Manual refresh
  triggerRefresh: () => void;

  // Subscribe to refresh events
  onRefresh: (callback: () => void | Promise<void>) => () => void;

  // State
  isRefreshing: boolean;
  lastRefreshed: Date | null;

  // Countdown to next refresh (in seconds)
  countdown: number | null;

  // Whether auto-refresh is active (enabled AND on allowed route)
  isAutoRefreshActive: boolean;
}

const RefreshContext = createContext<RefreshContextType | null>(null);

const STORAGE_KEY = 'admin-refresh-interval';

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [interval, setIntervalState] = useState<RefreshIntervalKey>('OFF');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const pathname = usePathname();

  const callbacksRef = useRef<Set<() => void | Promise<void>>>(new Set());
  const intervalIdRef = useRef<number | null>(null);
  const countdownIdRef = useRef<number | null>(null);

  // Check if current route allows auto-refresh
  const isOnAllowedRoute = AUTO_REFRESH_ALLOWED_ROUTES.includes(pathname || '');
  const isAutoRefreshActive = interval !== 'OFF' && isOnAllowedRoute;

  // Load saved preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in REFRESH_INTERVALS) {
        setIntervalState(saved as RefreshIntervalKey);
      }
    }
  }, []);

  // Use ref to track refreshing state to avoid dependency loop
  const isRefreshingRef = useRef(false);

  // Execute all registered refresh callbacks
  const executeRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    const callbacks = Array.from(callbacksRef.current);

    try {
      await Promise.all(callbacks.map(cb => cb()));
    } catch (error) {
      // Error during refresh - silent fail to prevent console spam
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }
  }, []);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    executeRefresh();
    // Reset countdown after manual refresh
    if (interval !== 'OFF') {
      setCountdown(REFRESH_INTERVALS[interval] / 1000);
    }
  }, [executeRefresh, interval]);

  // Subscribe to refresh events
  const onRefresh = useCallback((callback: () => void | Promise<void>) => {
    callbacksRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  // Set interval and persist to localStorage
  const setRefreshInterval = useCallback((newInterval: RefreshIntervalKey) => {
    setIntervalState(newInterval);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newInterval);
    }
  }, []);

  // Helper to clear all intervals
  const clearAllIntervals = useCallback(() => {
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (countdownIdRef.current) {
      window.clearInterval(countdownIdRef.current);
      countdownIdRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Setup auto-refresh interval - only when active (enabled AND on allowed route)
  useEffect(() => {
    // Always clear existing intervals first
    clearAllIntervals();

    // Only set up intervals if auto-refresh is active
    if (!isAutoRefreshActive) {
      return;
    }

    const ms = REFRESH_INTERVALS[interval];

    // Set initial countdown
    setCountdown(ms / 1000);

    // Countdown timer (updates every second)
    countdownIdRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          return ms / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    // Refresh timer - only calls registered callbacks, never reloads the page
    intervalIdRef.current = window.setInterval(() => {
      executeRefresh();
    }, ms);

    return () => {
      clearAllIntervals();
    };
  }, [interval, isAutoRefreshActive, executeRefresh, clearAllIntervals]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    interval,
    setInterval: setRefreshInterval,
    triggerRefresh,
    onRefresh,
    isRefreshing,
    lastRefreshed,
    countdown,
    isAutoRefreshActive,
  }), [
    interval,
    setRefreshInterval,
    triggerRefresh,
    onRefresh,
    isRefreshing,
    lastRefreshed,
    countdown,
    isAutoRefreshActive,
  ]);

  return (
    <RefreshContext.Provider value={contextValue}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}

// Hook to subscribe to refresh events
export function useOnRefresh(callback: () => void | Promise<void>, deps: React.DependencyList = []) {
  const { onRefresh } = useRefresh();

  useEffect(() => {
    const unsubscribe = onRefresh(callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh, ...deps]);
}
