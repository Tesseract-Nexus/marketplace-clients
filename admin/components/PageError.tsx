'use client';

import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

interface PageErrorProps {
  /** Error message to display */
  error: string | null;
  /** Optional title (defaults to "Error") */
  title?: string;
  /** Callback to dismiss the error */
  onDismiss?: () => void;
  /** Callback for retry action */
  onRetry?: () => void;
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
 * Automatically detects permission errors and displays a full styled error state.
 *
 * Usage:
 * ```tsx
 * <PageError
 *   error={error}
 *   onDismiss={() => setError(null)}
 *   onRetry={loadData}
 * />
 * ```
 *
 * Position this component:
 * 1. AFTER PageHeader
 * 2. BEFORE any stats cards, filters, or main content
 */
export function PageError({
  error,
  title = 'Error',
  onDismiss,
  onRetry,
  className,
}: PageErrorProps) {
  if (!error) return null;

  // For permission errors, show the full styled error state
  if (isPermissionError(error)) {
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

  // For regular errors, show the inline error banner
  return (
    <div
      className={cn(
        'bg-error-muted border border-error/20 rounded-lg p-4 flex items-start gap-3',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-error">{title}</h3>
        <p className="text-error-muted-foreground text-sm mt-1">{error}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="p-1.5 h-auto rounded-lg hover:bg-error/10 text-error transition-colors"
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
            className="p-1.5 h-auto rounded-lg hover:bg-error/10 text-error transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default PageError;
