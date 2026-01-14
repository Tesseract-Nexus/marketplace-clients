/**
 * Enterprise Polling Infrastructure
 *
 * This module provides production-grade polling capabilities with:
 * - Circuit breaker pattern
 * - Idle detection
 * - Network awareness
 * - Request deduplication
 * - Exponential backoff
 * - Environment-configurable intervals
 *
 * @example
 * ```typescript
 * import { pollingManager, SESSION_CONFIG, CACHE_TIMES } from '@/lib/polling';
 *
 * // Use configuration
 * const interval = SESSION_CONFIG.CHECK_INTERVAL;
 *
 * // Use polling manager
 * pollingManager.initialize();
 * pollingManager.register('my-task', {
 *   fn: myAsyncFunction,
 *   interval: 60000,
 * });
 * pollingManager.start('my-task');
 * ```
 */

// Export configuration
export {
  SESSION_CONFIG,
  WEBSOCKET_CONFIG,
  NOTIFICATION_CONFIG,
  IDLE_CONFIG,
  CIRCUIT_BREAKER_CONFIG,
  REACT_QUERY_CONFIG,
  CACHE_TIMES,
  AUTO_REFRESH_CONFIG,
  getAllConfig,
} from './config';

// Export polling manager
export {
  PollingManager,
  pollingManager,
  usePollingManager,
  type PollingConfig,
} from './polling-manager';
