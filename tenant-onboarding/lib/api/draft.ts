// Draft API Client
// Handles communication with the tenant-service draft endpoints
// Uses runtime configuration for dynamic URL routing

import { getDraftConfig } from '../config';

export interface DraftFormData {
  currentStep: number;
  businessInfo?: Record<string, unknown>;
  contactDetails?: Record<string, unknown>;
  businessAddress?: Record<string, unknown>;
  storeSetup?: Record<string, unknown>;
}

export interface SaveDraftRequest {
  session_id: string;
  form_data: DraftFormData;
  current_step: number;
}

export interface SaveDraftResponse {
  session_id: string;
  saved_at: string;
  expires_at: string;
}

export interface GetDraftResponse {
  found: boolean;
  session_id?: string;
  form_data?: DraftFormData;
  current_step?: number;
  saved_at?: string;
  expires_at?: string;
  time_remaining_hours?: number;
}

export interface HeartbeatRequest {
  session_id: string;
}

export interface BrowserCloseRequest {
  session_id: string;
}

// Default URLs (BFF pattern) - used before config is loaded
const DEFAULT_URLS = {
  save: '/api/onboarding/draft/save',
  get: (sessionId: string) => `/api/onboarding/draft/${sessionId}`,
  heartbeat: '/api/onboarding/draft/heartbeat',
  browserClose: '/api/onboarding/draft/browser-close',
};

const FETCH_TIMEOUT_MS = 10000; // 10 seconds

class DraftApi {
  private configLoaded = false;
  private urls = DEFAULT_URLS;

  /**
   * Create a fetch call with an AbortController timeout
   */
  private fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
  }

  /**
   * Initialize the API client by loading runtime config
   */
  async init(): Promise<void> {
    if (this.configLoaded) return;

    try {
      const draftConfig = await getDraftConfig();
      this.urls = {
        save: draftConfig.save,
        get: draftConfig.get,
        heartbeat: draftConfig.heartbeat,
        browserClose: draftConfig.browserClose,
      };
      this.configLoaded = true;
    } catch (error) {
      console.warn('Failed to load draft config, using defaults:', error);
      // Keep using default URLs (BFF pattern)
    }
  }

  /**
   * Ensure config is loaded before making a request
   */
  private async ensureConfig(): Promise<void> {
    if (!this.configLoaded) {
      await this.init();
    }
  }

  /**
   * Save draft form data
   */
  async saveDraft(sessionId: string, formData: DraftFormData, currentStep: number): Promise<SaveDraftResponse> {
    await this.ensureConfig();

    const response = await this.fetchWithTimeout(this.urls.save, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        form_data: formData,
        current_step: currentStep,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to save draft');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get draft by session ID
   */
  async getDraft(sessionId: string): Promise<GetDraftResponse> {
    await this.ensureConfig();

    const response = await this.fetchWithTimeout(this.urls.get(sessionId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { found: false };
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get draft');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete draft by session ID
   */
  async deleteDraft(sessionId: string): Promise<void> {
    await this.ensureConfig();

    const response = await this.fetchWithTimeout(this.urls.get(sessionId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to delete draft');
    }
  }

  /**
   * Send heartbeat to keep draft session alive
   */
  async sendHeartbeat(sessionId: string): Promise<void> {
    await this.ensureConfig();

    const response = await this.fetchWithTimeout(this.urls.heartbeat, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to send heartbeat');
    }
  }

  /**
   * Notify server that browser was closed
   * Uses Beacon API for reliable delivery on page unload
   * Note: This method is synchronous and uses cached URLs
   */
  sendBrowserClose(sessionId: string): boolean {
    const data = JSON.stringify({ session_id: sessionId });
    const url = this.urls.browserClose;

    // Use Beacon API for reliable delivery
    if (navigator.sendBeacon) {
      return navigator.sendBeacon(
        url,
        new Blob([data], { type: 'application/json' })
      );
    }

    // Fallback to sync XHR for older browsers
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, false); // sync
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
      return true;
    } catch {
      return false;
    }
  }
}

export const draftApi = new DraftApi();
