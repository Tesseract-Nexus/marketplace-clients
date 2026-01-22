/**
 * Structured Logger Utility
 * Provides environment-aware logging with log levels
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Debug message', { data });
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only log warnings and errors
// In development, log everything
const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message), ...args);
    }
  },

  /**
   * Info level logging - only in development
   */
  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message), ...args);
    }
  },

  /**
   * Warning level logging - always logged
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  /**
   * Error level logging - always logged
   */
  error: (message: string, ...args: unknown[]): void => {
    // Errors are always logged regardless of log level
    console.error(formatMessage('error', message), ...args);
  },
};

export default logger;
