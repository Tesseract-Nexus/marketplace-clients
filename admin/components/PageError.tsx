'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
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
}: PageErrorProps) {
  if (!error) return null;

  const isWarning = variant === 'warning';
  const Icon = isWarning ? AlertTriangle : AlertCircle;

  // For permission errors (non-warning), show the full styled error state
  if (!isWarning && isPermissionError(error)) {
    return (
      <ErrorState
        type="permission_denied"
        title="Access Restricted"
        description={error}
        showRetryButton={!!onRetry}
        showHomeButton={true}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // For regular errors/warnings, show the inline banner
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
        {title && (
          <h3 className={cn(
            'font-semibold text-sm',
            isWarning ? 'text-warning' : 'text-error'
          )}>
            {title}
          </h3>
        )}
        <p className={cn(
          'text-sm',
          title ? 'mt-1' : '',
          isWarning ? 'text-warning-foreground' : 'text-error-muted-foreground'
        )}>
          {error}
        </p>
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
