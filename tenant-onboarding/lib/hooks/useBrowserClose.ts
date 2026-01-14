'use client';

import { useEffect, useRef, useCallback } from 'react';
import { draftApi } from '../api/draft';

export interface UseBrowserCloseOptions {
  sessionId: string | null;
  enabled?: boolean;
  hasUnsavedChanges?: boolean;
  onBeforeUnload?: () => void;
}

/**
 * Hook for detecting browser close/navigation and notifying the server
 *
 * Features:
 * - Sends beacon on page unload (browser close, tab close, navigation)
 * - Handles visibility change (tab switching)
 * - Optional unsaved changes warning prompt
 * - Cleanup on unmount
 */
export function useBrowserClose(options: UseBrowserCloseOptions): void {
  const {
    sessionId,
    enabled = true,
    hasUnsavedChanges = false,
    onBeforeUnload,
  } = options;

  const sessionIdRef = useRef(sessionId);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Update refs when values change
  useEffect(() => {
    sessionIdRef.current = sessionId;
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [sessionId, hasUnsavedChanges]);

  // Handle beforeunload event (browser close, tab close, navigation)
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!sessionIdRef.current || !enabled) return;

    // Send browser close notification via beacon
    draftApi.sendBrowserClose(sessionIdRef.current);

    // Call optional callback
    onBeforeUnload?.();

    // Show unsaved changes warning if applicable
    if (hasUnsavedChangesRef.current) {
      event.preventDefault();
      event.returnValue = ''; // Required for Chrome
      return '';
    }
  }, [enabled, onBeforeUnload]);

  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (!sessionIdRef.current || !enabled) return;

    // When page becomes hidden (tab switch, minimize)
    if (document.visibilityState === 'hidden') {
      // Send heartbeat to indicate still active
      draftApi.sendHeartbeat(sessionIdRef.current).catch(() => {
        // Ignore errors - user may be offline
      });
    }
  }, [enabled]);

  // Handle page hide (more reliable than beforeunload on mobile)
  const handlePageHide = useCallback((event: PageTransitionEvent) => {
    if (!sessionIdRef.current || !enabled) return;

    // persisted = true means page might be restored from bfcache
    if (!event.persisted) {
      draftApi.sendBrowserClose(sessionIdRef.current);
    }
  }, [enabled]);

  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleBeforeUnload, handlePageHide, handleVisibilityChange]);
}

/**
 * Hook for detecting navigation away from the page using Next.js router
 * This is complementary to useBrowserClose for SPA navigation
 */
export function useNavigationWarning(
  hasUnsavedChanges: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
): void {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}
