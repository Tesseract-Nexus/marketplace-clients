'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { draftApi, type DraftFormData, type GetDraftResponse } from '../api/draft';

export interface DraftRecoveryState {
  isLoading: boolean;
  hasDraft: boolean;
  draftData: DraftFormData | null;
  currentStep: number | null;
  savedAt: Date | null;
  expiresAt: Date | null;
  timeRemainingHours: number | null;
  error: string | null;
}

export interface UseDraftRecoveryOptions {
  sessionId: string | null;
  enabled?: boolean;
  onRecoveryComplete?: (data: DraftFormData, step: number) => void;
  onSessionNotFound?: () => void; // Called when session doesn't exist (stale session)
}

export interface UseDraftRecoveryReturn {
  state: DraftRecoveryState;
  recoverDraft: () => void;
  dismissDraft: () => void;
  deleteDraft: () => Promise<void>;
}

/**
 * Hook for recovering draft form data when the page loads
 *
 * Features:
 * - Checks for existing draft on mount
 * - Provides draft data for recovery
 * - Handles dismissal (continue without recovery)
 * - Delete draft functionality
 */
export function useDraftRecovery(
  options: UseDraftRecoveryOptions
): UseDraftRecoveryReturn {
  const { sessionId, enabled = true, onRecoveryComplete, onSessionNotFound } = options;

  const [state, setState] = useState<DraftRecoveryState>({
    isLoading: true,
    hasDraft: false,
    draftData: null,
    currentStep: null,
    savedAt: null,
    expiresAt: null,
    timeRemainingHours: null,
    error: null,
  });

  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  // Use refs for callbacks to avoid re-fetching when callbacks change
  const onRecoveryCompleteRef = useRef(onRecoveryComplete);
  const onSessionNotFoundRef = useRef(onSessionNotFound);

  // Keep refs up to date
  useEffect(() => {
    onRecoveryCompleteRef.current = onRecoveryComplete;
    onSessionNotFoundRef.current = onSessionNotFound;
  }, [onRecoveryComplete, onSessionNotFound]);

  // Fetch draft on mount and auto-apply if found
  useEffect(() => {
    if (!sessionId || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchDraft = async () => {
      try {
        const response = await draftApi.getDraft(sessionId);

        if (response.found && response.form_data) {
          setState({
            isLoading: false,
            hasDraft: true,
            draftData: response.form_data,
            currentStep: response.current_step ?? null,
            savedAt: response.saved_at ? new Date(response.saved_at) : null,
            expiresAt: response.expires_at ? new Date(response.expires_at) : null,
            timeRemainingHours: response.time_remaining_hours ?? null,
            error: null,
          });

          // Auto-apply draft data immediately instead of showing recovery prompt
          // This ensures form data is restored on page reload without user interaction
          if (response.form_data && response.current_step !== undefined) {
            console.log('[DraftRecovery] Auto-applying draft data');
            onRecoveryCompleteRef.current?.(response.form_data, response.current_step);
            setShowRecoveryPrompt(false);
          } else {
            setShowRecoveryPrompt(true);
          }
          console.log('[DraftRecovery] Found draft data:', response);
        } else {
          // No draft saved yet — this is normal for new sessions.
          // Only clear stale session if the server explicitly says session is gone
          // (handled by getDraft returning 404 which sets found:false).
          // Don't call onSessionNotFound here — a valid session with no draft
          // should not trigger a full wizard reset.
          console.log('[DraftRecovery] No draft found for session (may be new)');
          setState({
            isLoading: false,
            hasDraft: false,
            draftData: null,
            currentStep: null,
            savedAt: null,
            expiresAt: null,
            timeRemainingHours: null,
            error: null,
          });
        }
      } catch (error) {
        console.error('[DraftRecovery] Failed to fetch draft:', error);
        setState({
          isLoading: false,
          hasDraft: false,
          draftData: null,
          currentStep: null,
          savedAt: null,
          expiresAt: null,
          timeRemainingHours: null,
          error: error instanceof Error ? error.message : 'Failed to fetch draft',
        });
      }
    };

    fetchDraft();
  }, [sessionId, enabled]);

  // Recover draft (apply the data)
  const recoverDraft = useCallback(() => {
    if (state.draftData && state.currentStep !== null) {
      onRecoveryComplete?.(state.draftData, state.currentStep);
      setShowRecoveryPrompt(false);
      console.log('[DraftRecovery] Draft recovered');
    }
  }, [state.draftData, state.currentStep, onRecoveryComplete]);

  // Dismiss draft (continue without recovery)
  const dismissDraft = useCallback(() => {
    setShowRecoveryPrompt(false);
    console.log('[DraftRecovery] Draft dismissed');
  }, []);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!sessionId) return;

    try {
      await draftApi.deleteDraft(sessionId);
      setState({
        isLoading: false,
        hasDraft: false,
        draftData: null,
        currentStep: null,
        savedAt: null,
        expiresAt: null,
        timeRemainingHours: null,
        error: null,
      });
      setShowRecoveryPrompt(false);
      console.log('[DraftRecovery] Draft deleted');
    } catch (error) {
      console.error('[DraftRecovery] Failed to delete draft:', error);
    }
  }, [sessionId]);

  return {
    state: {
      ...state,
      hasDraft: state.hasDraft && showRecoveryPrompt,
    },
    recoverDraft,
    dismissDraft,
    deleteDraft,
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(hours: number | null): string {
  if (hours === null) return '';

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const roundedHours = Math.round(hours);
  return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
}
