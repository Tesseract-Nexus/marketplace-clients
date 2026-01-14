'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { draftApi, type DraftFormData } from '../api/draft';

export interface AutoSaveOptions {
  sessionId: string | null;
  debounceMs?: number; // Default 2000ms (2 seconds)
  heartbeatIntervalMs?: number; // Default 60000ms (1 minute)
  enabled?: boolean;
  onSessionNotFound?: () => void; // Called when session is stale/not found
}

export interface AutoSaveState {
  lastSavedAt: Date | null;
  isSaving: boolean;
  error: string | null;
  expiresAt: Date | null;
}

export interface UseAutoSaveReturn {
  state: AutoSaveState;
  saveNow: () => Promise<void>;
  clearDraft: () => Promise<void>;
}

/**
 * Hook for auto-saving form data to the draft API
 *
 * Features:
 * - Debounced auto-save on form data changes
 * - Periodic heartbeat to keep session alive
 * - Manual save trigger
 * - Clear draft functionality
 */
export function useAutoSave(
  formData: DraftFormData,
  currentStep: number,
  options: AutoSaveOptions
): UseAutoSaveReturn {
  const {
    sessionId,
    debounceMs = 2000,
    heartbeatIntervalMs = 60000,
    enabled = true,
    onSessionNotFound,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    lastSavedAt: null,
    isSaving: false,
    error: null,
    expiresAt: null,
  });

  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedFormDataRef = useRef<string>('');

  // Update refs when values change
  useEffect(() => {
    formDataRef.current = formData;
    currentStepRef.current = currentStep;
  }, [formData, currentStep]);

  // Save draft to server
  const saveDraft = useCallback(async () => {
    if (!sessionId || !enabled) return;

    // Serialize current form data
    const currentFormDataStr = JSON.stringify(formDataRef.current);

    // Skip if nothing changed
    if (currentFormDataStr === lastSavedFormDataRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await draftApi.saveDraft(
        sessionId,
        formDataRef.current,
        currentStepRef.current
      );

      lastSavedFormDataRef.current = currentFormDataStr;

      setState({
        lastSavedAt: new Date(response.saved_at),
        isSaving: false,
        error: null,
        expiresAt: new Date(response.expires_at),
      });

      console.log('[AutoSave] Draft saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      console.error('[AutoSave] Failed to save draft:', error);

      // Check if the error is due to session not found (stale session)
      if (errorMessage.toLowerCase().includes('session not found') ||
          errorMessage.toLowerCase().includes('not found')) {
        console.warn('[AutoSave] Session not found - clearing stale session');
        onSessionNotFound?.();
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
    }
  }, [sessionId, enabled, onSessionNotFound]);

  // Debounced save - triggered on form data changes
  useEffect(() => {
    if (!sessionId || !enabled) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced save
    debounceTimerRef.current = setTimeout(() => {
      saveDraft();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, currentStep, sessionId, enabled, debounceMs, saveDraft]);

  // Heartbeat - keep session alive
  useEffect(() => {
    if (!sessionId || !enabled) return;

    const sendHeartbeat = async () => {
      try {
        await draftApi.sendHeartbeat(sessionId);
        console.log('[AutoSave] Heartbeat sent');
      } catch (error) {
        console.warn('[AutoSave] Failed to send heartbeat:', error);
      }
    };

    // Send heartbeat periodically
    heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatIntervalMs);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [sessionId, enabled, heartbeatIntervalMs]);

  // Manual save trigger
  const saveNow = useCallback(async () => {
    // Clear debounce timer and save immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await saveDraft();
  }, [saveDraft]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    if (!sessionId) return;

    try {
      await draftApi.deleteDraft(sessionId);
      lastSavedFormDataRef.current = '';
      setState({
        lastSavedAt: null,
        isSaving: false,
        error: null,
        expiresAt: null,
      });
      console.log('[AutoSave] Draft cleared');
    } catch (error) {
      console.error('[AutoSave] Failed to clear draft:', error);
    }
  }, [sessionId]);

  return {
    state,
    saveNow,
    clearDraft,
  };
}
