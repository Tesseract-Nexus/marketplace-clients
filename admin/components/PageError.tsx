'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, ErrorType, detectErrorType } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

interface PageErrorProps {
  /** Error message to display (supports null for conditional rendering) */
  error: string | null;
  /** Optional title */
  title?: string;
  /** Callback to dismiss the error */
  onDismiss?: () => void;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Variant: 'error' (red) or 'warning' (yellow) */
  variant?: 'error' | 'warning';
  /** Additional CSS classes */
  className?: string;
  /** Show full screen error state instead of inline banner */
  fullScreen?: boolean;
  /** Technical details for debugging */
  details?: string;
  /** Custom suggestions to show */
  suggestions?: string[];
}

/**
 * Check if the error message indicates a permission/access error
 */
function isPermissionError(error: string): boolean {
  const permissionPatterns = [
    'admin portal access required',
    'access denied',
    'permission denied',
    'forbidden',
    'not authorized',
    'unauthorized',
    'insufficient permissions',
    'access required',
  ];
  const lowerError = error.toLowerCase();
  return permissionPatterns.some(pattern => lowerError.includes(pattern));
}

/**
 * Check if the error is a network-related error
 */
function isNetworkError(error: string): boolean {
  const networkPatterns = [
    'network',
    'fetch',
    'failed to fetch',
    'connection',
    'offline',
    'econnrefused',
    'dns',
  ];
  const lowerError = error.toLowerCase();
  return networkPatterns.some(pattern => lowerError.includes(pattern));
}

/**
 * Get appropriate error type and title based on error message
 */
function getErrorInfo(error: string): { type: ErrorType; title: string } {
  const lowerError = error.toLowerCase();

  if (isPermissionError(error)) {
    return { type: 'permission_denied', title: 'Access Restricted' };
  }
  if (isNetworkError(error)) {
    return { type: 'network_error', title: 'Connection Problem' };
  }
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return { type: 'timeout', title: 'Request Timed Out' };
  }
  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return { type: 'not_found', title: 'Not Found' };
  }
  if (lowerError.includes('login') || lowerError.includes('session') || lowerError.includes('authenticate')) {
    return { type: 'requires_auth', title: 'Authentication Required' };
  }

  return { type: 'server_error', title: 'Something Went Wrong' };
}

/**
 * Standardized page-level error component for consistent error display across all pages.
 *
 * Features:
 * - Automatically detects permission errors and displays full styled error state
 * - Supports error and warning variants
 * - Handles null internally (no need for conditional rendering)
 *
 * Usage:
 * ```tsx
 * <PageError
 *   error={error}
 *   onDismiss={() => setError(null)}
 *   onRetry={loadData}
 * />
 *
 * // Warning variant
 * <PageError
 *   error="Some data may be outdated"
 *   variant="warning"
 *   onRetry={refresh}
 * />
 * ```
 *
 * Position this component:
 * 1. AFTER PageHeader
 * 2. BEFORE any stats cards, filters, or main content
 */
export function PageError({
  error,
  title,
  onDismiss,
  onRetry,
  variant = 'error',
  className,
  fullScreen = false,
  details,
  suggestions,
}: PageErrorProps) {
  if (!error) return null;

  const isWarning = variant === 'warning';
  const Icon = isWarning ? AlertTriangle : AlertCircle;

  // For full screen errors or critical errors (permission/network), show the full styled error state
  const errorInfo = getErrorInfo(error);
  const shouldShowFullScreen = fullScreen || (!isWarning && (
    isPermissionError(error) ||
    isNetworkError(error) ||
    error.toLowerCase().includes('critical')
  ));

  if (shouldShowFullScreen) {
    return (
      <ErrorState
        type={errorInfo.type}
        title={title || errorInfo.title}
        description={error}
        showRetryButton={!!onRetry}
        showHomeButton={true}
        onRetry={onRetry}
        className={className}
        details={details}
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
  }

  // For regular errors/warnings, show the inline banner with optional suggestions
  const inlineTitle = title || (isWarning ? undefined : errorInfo.title);

  // Get contextual hint based on error type
  const getContextualHint = (): string | null => {
    if (isWarning) return null;
    const lowerError = error.toLowerCase();
    if (lowerError.includes('load') || lowerError.includes('fetch')) {
      return 'Try refreshing or check your connection';
    }
    if (lowerError.includes('save') || lowerError.includes('update')) {
      return 'Your changes may not have been saved';
    }
    if (lowerError.includes('delete')) {
      return 'The item may not have been deleted';
    }
    return null;
  };

  const hint = suggestions?.[0] || getContextualHint();

  return (
    <div
      className={cn(
        'rounded-lg p-4 flex items-start gap-3 border',
        isWarning
          ? 'bg-warning-muted border-warning/30'
          : 'bg-error-muted border-error/20',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0 mt-0.5',
          isWarning ? 'text-warning' : 'text-error'
        )}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        {inlineTitle && (
          <h3 className={cn(
            'font-semibold text-sm',
            isWarning ? 'text-warning' : 'text-error'
          )}>
            {inlineTitle}
          </h3>
        )}
        <p className={cn(
          'text-sm',
          inlineTitle ? 'mt-1' : '',
          isWarning ? 'text-warning-foreground' : 'text-error-muted-foreground'
        )}>
          {error}
        </p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {hint}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className={cn(
              'p-1.5 h-auto rounded-lg transition-colors',
              isWarning
                ? 'hover:bg-warning/10 text-warning'
                : 'hover:bg-error/10 text-error'
            )}
            aria-label="Retry"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className={cn(
              'p-1.5 h-auto rounded-lg transition-colors',
              isWarning
                ? 'hover:bg-warning/10 text-warning'
                : 'hover:bg-error/10 text-error'
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default PageError;
