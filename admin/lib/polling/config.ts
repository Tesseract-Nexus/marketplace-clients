/**
 * Polling Configuration
 *
 * Enterprise-grade configuration for all polling intervals.
 * All values can be overridden via environment variables for runtime tuning.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_SESSION_CHECK_INTERVAL_MS: Session check interval (default: 300000 / 5 min)
 * - NEXT_PUBLIC_SESSION_REFRESH_THRESHOLD_S: Seconds before expiry to refresh (default: 300 / 5 min)
 * - NEXT_PUBLIC_WS_PING_INTERVAL_MS: WebSocket ping interval (default: 45000 / 45s)
 * - NEXT_PUBLIC_WS_RECONNECT_MAX_ATTEMPTS: Max WebSocket reconnect attempts (default: 10)
 * - NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS: Notification polling fallback (default: 60000 / 1 min)
 * - NEXT_PUBLIC_IDLE_TIMEOUT_MS: User idle timeout (default: 300000 / 5 min)
 * - NEXT_PUBLIC_VISIBILITY_DEBOUNCE_MS: Tab visibility debounce (default: 60000 / 1 min)
 * - NEXT_PUBLIC_CIRCUIT_MAX_FAILURES: Circuit breaker threshold (default: 5)
 * - NEXT_PUBLIC_CIRCUIT_RESET_MS: Circuit breaker reset time (default: 60000 / 1 min)
 */

// Helper to parse env with fallback
const parseEnvInt = (key: string, defaultValue: number): number => {
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (value) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return defaultValue;
};

/**
 * Session/Authentication Configuration
 */
export const SESSION_CONFIG = {
  /** How often to check if session needs refresh (ms) */
  CHECK_INTERVAL: parseEnvInt('NEXT_PUBLIC_SESSION_CHECK_INTERVAL_MS', 300000), // 5 minutes

  /** Start refreshing this many seconds before session expiry */
  REFRESH_THRESHOLD: parseEnvInt('NEXT_PUBLIC_SESSION_REFRESH_THRESHOLD_S', 300), // 5 minutes

  /** Minimum time between visibility-triggered checks (ms) */
  VISIBILITY_DEBOUNCE: parseEnvInt('NEXT_PUBLIC_VISIBILITY_DEBOUNCE_MS', 60000), // 1 minute

  /** Whether to use smart scheduling (schedules exactly when needed vs fixed interval) */
  USE_SMART_SCHEDULING: true,
} as const;

/**
 * WebSocket Configuration
 */
export const WEBSOCKET_CONFIG = {
  /** Ping interval to keep connection alive (ms) - must be < load balancer timeout */
  PING_INTERVAL: parseEnvInt('NEXT_PUBLIC_WS_PING_INTERVAL_MS', 45000), // 45 seconds

  /** Maximum reconnection attempts before giving up */
  MAX_RECONNECT_ATTEMPTS: parseEnvInt('NEXT_PUBLIC_WS_RECONNECT_MAX_ATTEMPTS', 10),

  /** Base delay for exponential backoff reconnection (ms) */
  RECONNECT_BASE_DELAY: 1000, // 1 second

  /** Maximum backoff delay (ms) */
  RECONNECT_MAX_DELAY: 30000, // 30 seconds

  /** Time to wait before enabling polling fallback (ms) */
  FALLBACK_TIMEOUT: parseEnvInt('NEXT_PUBLIC_WS_FALLBACK_TIMEOUT_MS', 5000), // 5 seconds
} as const;

/**
 * Notification Polling Configuration (fallback when WebSocket unavailable)
 */
export const NOTIFICATION_CONFIG = {
  /** Polling interval when WebSocket is unavailable (ms) */
  POLL_INTERVAL: parseEnvInt('NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS', 60000), // 1 minute (increased from 30s)

  /** Whether to use polling fallback */
  ENABLE_FALLBACK: true,
} as const;

/**
 * User Activity/Idle Configuration
 */
export const IDLE_CONFIG = {
  /** Time of inactivity before user is considered idle (ms) */
  TIMEOUT: parseEnvInt('NEXT_PUBLIC_IDLE_TIMEOUT_MS', 300000), // 5 minutes

  /** Events that reset the idle timer */
  ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const,

  /** Whether to pause polling when user is idle */
  PAUSE_POLLING_ON_IDLE: true,
} as const;

/**
 * Circuit Breaker Configuration
 */
export const CIRCUIT_BREAKER_CONFIG = {
  /** Number of consecutive failures before circuit breaks */
  MAX_FAILURES: parseEnvInt('NEXT_PUBLIC_CIRCUIT_MAX_FAILURES', 5),

  /** Time to wait before attempting to close circuit (ms) */
  RESET_TIME: parseEnvInt('NEXT_PUBLIC_CIRCUIT_RESET_MS', 60000), // 1 minute

  /** Whether to use exponential backoff on failures */
  USE_BACKOFF: true,

  /** Maximum backoff interval (ms) */
  MAX_BACKOFF: parseEnvInt('NEXT_PUBLIC_MAX_BACKOFF_MS', 300000), // 5 minutes
} as const;

/**
 * React Query Configuration
 */
export const REACT_QUERY_CONFIG = {
  /** Default stale time for queries (ms) */
  STALE_TIME: parseEnvInt('NEXT_PUBLIC_QUERY_STALE_TIME_MS', 120000), // 2 minutes

  /** Garbage collection time for unused queries (ms) */
  GC_TIME: parseEnvInt('NEXT_PUBLIC_QUERY_GC_TIME_MS', 600000), // 10 minutes

  /** Number of retry attempts */
  RETRY_ATTEMPTS: 3,

  /** Whether to refetch on window focus */
  REFETCH_ON_WINDOW_FOCUS: false,

  /** Whether to refetch on network reconnect */
  REFETCH_ON_RECONNECT: true,
} as const;

/**
 * Data-specific cache times (for React Query)
 */
export const CACHE_TIMES = {
  /** Real-time data - never cache */
  REALTIME: 0,

  /** Frequently changing data (orders, inventory) */
  VOLATILE: 30000, // 30 seconds

  /** User-specific data (preferences, cart) */
  USER_DATA: 60000, // 1 minute

  /** Standard data (products, customers) */
  STANDARD: 120000, // 2 minutes

  /** Semi-static data (categories, tags) */
  SEMI_STATIC: 300000, // 5 minutes

  /** Static data (settings, configurations) */
  STATIC: 900000, // 15 minutes

  /** Rarely changing data (branding, themes) */
  IMMUTABLE: 3600000, // 1 hour
} as const;

/**
 * Inventory/Dashboard Auto-Refresh Configuration
 */
export const AUTO_REFRESH_CONFIG = {
  /** Available refresh intervals */
  INTERVALS: {
    OFF: 0,
    '10s': 10000,
    '30s': 30000,
    '1m': 60000,
    '5m': 300000,
  } as const,

  /** Default refresh interval */
  DEFAULT_INTERVAL: '5m' as const,

  /** Routes where auto-refresh is allowed */
  ALLOWED_ROUTES: ['/'],
} as const;

/**
 * Get all configuration as a single object (useful for debugging)
 */
export function getAllConfig() {
  return {
    session: SESSION_CONFIG,
    websocket: WEBSOCKET_CONFIG,
    notification: NOTIFICATION_CONFIG,
    idle: IDLE_CONFIG,
    circuitBreaker: CIRCUIT_BREAKER_CONFIG,
    reactQuery: REACT_QUERY_CONFIG,
    cacheTimes: CACHE_TIMES,
    autoRefresh: AUTO_REFRESH_CONFIG,
  };
}

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('[PollingConfig] Loaded configuration:', getAllConfig());
}
