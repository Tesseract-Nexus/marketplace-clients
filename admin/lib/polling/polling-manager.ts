/**
 * Enterprise Polling Manager
 *
 * Production-grade polling infrastructure with:
 * - Circuit breaker pattern to prevent hammering failed services
 * - Idle detection to pause polling when user is inactive
 * - Request deduplication to prevent duplicate in-flight requests
 * - Network-aware polling (pauses when offline)
 * - Adaptive intervals based on errors and activity
 * - Configurable via environment variables
 *
 * @example
 * ```typescript
 * const poller = PollingManager.getInstance();
 *
 * // Register a polling task
 * poller.register('session-check', {
 *   fn: checkSession,
 *   interval: 300000, // 5 minutes
 *   onError: handleError,
 * });
 *
 * // Start polling
 * poller.start('session-check');
 *
 * // Stop when component unmounts
 * poller.stop('session-check');
 * ```
 */

export interface PollingConfig {
  /** Function to execute on each poll */
  fn: () => Promise<void>;
  /** Base interval in milliseconds */
  interval: number;
  /** Optional error handler */
  onError?: (error: Error) => void;
  /** Whether to pause when user is idle (default: true) */
  pauseOnIdle?: boolean;
  /** Whether to pause when offline (default: true) */
  pauseWhenOffline?: boolean;
  /** Max consecutive failures before circuit breaks (default: 5) */
  maxFailures?: number;
  /** Circuit breaker reset time in ms (default: 60000) */
  circuitResetTime?: number;
  /** Whether to use exponential backoff on failures (default: true) */
  useBackoff?: boolean;
  /** Maximum backoff interval in ms (default: 5 minutes) */
  maxBackoffInterval?: number;
  /** Whether to dedupe in-flight requests (default: true) */
  dedupeRequests?: boolean;
}

interface PollingState {
  config: PollingConfig;
  timerId: ReturnType<typeof setTimeout> | null;
  isRunning: boolean;
  consecutiveFailures: number;
  circuitBroken: boolean;
  circuitBrokenAt: number | null;
  lastExecutionTime: number | null;
  inFlight: boolean;
  currentInterval: number;
}

// Environment-configurable defaults
const DEFAULT_IDLE_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS || '300000', 10); // 5 minutes
const DEFAULT_MAX_FAILURES = parseInt(process.env.NEXT_PUBLIC_CIRCUIT_MAX_FAILURES || '5', 10);
const DEFAULT_CIRCUIT_RESET_TIME = parseInt(process.env.NEXT_PUBLIC_CIRCUIT_RESET_MS || '60000', 10);
const DEFAULT_MAX_BACKOFF = parseInt(process.env.NEXT_PUBLIC_MAX_BACKOFF_MS || '300000', 10); // 5 minutes

/**
 * Singleton Polling Manager for enterprise-grade polling control
 */
export class PollingManager {
  private static instance: PollingManager;
  private pollers: Map<string, PollingState> = new Map();
  private isIdle: boolean = false;
  private isOnline: boolean = true;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimeout: number = DEFAULT_IDLE_TIMEOUT;
  private activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  /**
   * Initialize the polling manager (call once at app startup)
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;

    // Set up idle detection
    this.resetIdleTimer();
    this.activityEvents.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });

    // Set up online/offline detection
    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Set up visibility change detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.initialized = true;
    console.log('[PollingManager] Initialized with idle timeout:', this.idleTimeout, 'ms');
  }

  /**
   * Clean up event listeners (call on app unmount)
   */
  destroy(): void {
    if (typeof window === 'undefined') return;

    this.activityEvents.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // Stop all pollers
    this.pollers.forEach((_, key) => this.stop(key));
    this.pollers.clear();

    this.initialized = false;
  }

  /**
   * Register a new polling task
   */
  register(key: string, config: PollingConfig): void {
    if (this.pollers.has(key)) {
      console.warn(`[PollingManager] Poller '${key}' already registered, updating config`);
      this.stop(key);
    }

    this.pollers.set(key, {
      config: {
        pauseOnIdle: true,
        pauseWhenOffline: true,
        maxFailures: DEFAULT_MAX_FAILURES,
        circuitResetTime: DEFAULT_CIRCUIT_RESET_TIME,
        useBackoff: true,
        maxBackoffInterval: DEFAULT_MAX_BACKOFF,
        dedupeRequests: true,
        ...config,
      },
      timerId: null,
      isRunning: false,
      consecutiveFailures: 0,
      circuitBroken: false,
      circuitBrokenAt: null,
      lastExecutionTime: null,
      inFlight: false,
      currentInterval: config.interval,
    });
  }

  /**
   * Start a registered polling task
   */
  start(key: string): void {
    const state = this.pollers.get(key);
    if (!state) {
      console.error(`[PollingManager] Poller '${key}' not registered`);
      return;
    }

    if (state.isRunning) {
      return; // Already running
    }

    state.isRunning = true;
    this.scheduleNext(key);
    console.log(`[PollingManager] Started '${key}' with interval ${state.config.interval}ms`);
  }

  /**
   * Stop a polling task
   */
  stop(key: string): void {
    const state = this.pollers.get(key);
    if (!state) return;

    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
    state.isRunning = false;
    console.log(`[PollingManager] Stopped '${key}'`);
  }

  /**
   * Trigger an immediate execution (resets the timer)
   */
  triggerNow(key: string): void {
    const state = this.pollers.get(key);
    if (!state || !state.isRunning) return;

    // Clear existing timer
    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }

    // Execute immediately
    this.execute(key);
  }

  /**
   * Get current state of a poller (for debugging/monitoring)
   */
  getState(key: string): Readonly<PollingState> | undefined {
    return this.pollers.get(key);
  }

  /**
   * Check if system is currently idle
   */
  getIsIdle(): boolean {
    return this.isIdle;
  }

  /**
   * Check if system is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Private methods

  private handleActivity = (): void => {
    if (this.isIdle) {
      this.isIdle = false;
      console.log('[PollingManager] User active, resuming pollers');
      this.resumeAllPollers();
    }
    this.resetIdleTimer();
  };

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => {
      this.isIdle = true;
      console.log('[PollingManager] User idle, pausing eligible pollers');
      this.pauseIdlePollers();
    }, this.idleTimeout);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    console.log('[PollingManager] Network online, resuming pollers');
    this.resumeAllPollers();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    console.log('[PollingManager] Network offline, pausing eligible pollers');
    this.pauseOfflinePollers();
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // Reset idle timer when tab becomes visible
      this.handleActivity();
    }
  };

  private pauseIdlePollers(): void {
    this.pollers.forEach((state, key) => {
      if (state.config.pauseOnIdle && state.isRunning && state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
    });
  }

  private pauseOfflinePollers(): void {
    this.pollers.forEach((state, key) => {
      if (state.config.pauseWhenOffline && state.isRunning && state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
    });
  }

  private resumeAllPollers(): void {
    this.pollers.forEach((state, key) => {
      if (state.isRunning && !state.timerId) {
        const shouldResume =
          (!state.config.pauseOnIdle || !this.isIdle) &&
          (!state.config.pauseWhenOffline || this.isOnline);

        if (shouldResume) {
          this.scheduleNext(key);
        }
      }
    });
  }

  private scheduleNext(key: string): void {
    const state = this.pollers.get(key);
    if (!state || !state.isRunning) return;

    // Check if should be paused
    if ((state.config.pauseOnIdle && this.isIdle) ||
        (state.config.pauseWhenOffline && !this.isOnline)) {
      return;
    }

    // Check circuit breaker
    if (state.circuitBroken) {
      const timeSinceBroken = Date.now() - (state.circuitBrokenAt || 0);
      if (timeSinceBroken < (state.config.circuitResetTime || DEFAULT_CIRCUIT_RESET_TIME)) {
        // Still in circuit broken state, schedule check for when it resets
        state.timerId = setTimeout(() => {
          state.circuitBroken = false;
          state.consecutiveFailures = 0;
          state.currentInterval = state.config.interval;
          console.log(`[PollingManager] Circuit breaker reset for '${key}'`);
          this.scheduleNext(key);
        }, (state.config.circuitResetTime || DEFAULT_CIRCUIT_RESET_TIME) - timeSinceBroken);
        return;
      } else {
        // Circuit breaker time passed, reset
        state.circuitBroken = false;
        state.consecutiveFailures = 0;
        state.currentInterval = state.config.interval;
      }
    }

    state.timerId = setTimeout(() => {
      this.execute(key);
    }, state.currentInterval);
  }

  private async execute(key: string): Promise<void> {
    const state = this.pollers.get(key);
    if (!state || !state.isRunning) return;

    // Request deduplication
    if (state.config.dedupeRequests && state.inFlight) {
      console.log(`[PollingManager] Skipping '${key}' - request in flight`);
      this.scheduleNext(key);
      return;
    }

    state.inFlight = true;
    state.lastExecutionTime = Date.now();

    try {
      await state.config.fn();

      // Success - reset failures and interval
      state.consecutiveFailures = 0;
      state.currentInterval = state.config.interval;
    } catch (error) {
      state.consecutiveFailures++;
      console.error(`[PollingManager] '${key}' failed (${state.consecutiveFailures}/${state.config.maxFailures}):`, error);

      // Call error handler if provided
      if (state.config.onError && error instanceof Error) {
        state.config.onError(error);
      }

      // Check circuit breaker threshold
      if (state.consecutiveFailures >= (state.config.maxFailures || DEFAULT_MAX_FAILURES)) {
        state.circuitBroken = true;
        state.circuitBrokenAt = Date.now();
        console.warn(`[PollingManager] Circuit breaker triggered for '${key}'`);
      } else if (state.config.useBackoff) {
        // Exponential backoff
        state.currentInterval = Math.min(
          state.config.interval * Math.pow(2, state.consecutiveFailures),
          state.config.maxBackoffInterval || DEFAULT_MAX_BACKOFF
        );
        console.log(`[PollingManager] '${key}' backing off to ${state.currentInterval}ms`);
      }
    } finally {
      state.inFlight = false;
    }

    // Schedule next execution
    this.scheduleNext(key);
  }
}

// Export singleton instance
export const pollingManager = PollingManager.getInstance();

// React hook for easy integration
export function usePollingManager() {
  return pollingManager;
}
