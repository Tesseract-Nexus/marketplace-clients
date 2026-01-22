'use client';

import { AlertCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PageErrorProps {
  /** Error message to display */
  message: string;
  /** Error title (optional) */
  title?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Variant: 'destructive' (red) or 'warning' (yellow) */
  variant?: 'destructive' | 'warning';
  /** Custom className */
  className?: string;
  /** Show as full page error */
  fullPage?: boolean;
}

/**
 * PageError - Consistent error state component
 *
 * Usage:
 * ```tsx
 * // Basic inline error with retry
 * {error && (
 *   <PageError
 *     message={error}
 *     onRetry={loadData}
 *     onDismiss={() => setError(null)}
 *   />
 * )}
 *
 * // Warning variant
 * <PageError
 *   message="Some data may be outdated"
 *   variant="warning"
 *   onRetry={refresh}
 * />
 *
 * // Full page error
 * if (error) return <PageError message={error} fullPage onRetry={loadData} />;
 * ```
 */
export function PageError({
  message,
  title,
  onRetry,
  onDismiss,
  variant = 'destructive',
  className,
  fullPage = false,
}: PageErrorProps) {
  const isDestructive = variant === 'destructive';
  const Icon = isDestructive ? AlertCircle : AlertTriangle;

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        isDestructive
          ? 'bg-destructive/10 border-destructive/30 dark:bg-destructive/20 dark:border-destructive'
          : 'bg-warning-muted border-warning/30 dark:bg-warning/20 dark:border-warning',
        className
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0 mt-0.5',
          isDestructive ? 'text-destructive dark:text-destructive' : 'text-warning dark:text-warning'
        )}
      />
      <div className="flex-1 min-w-0">
        {title && (
          <h3
            className={cn(
              'font-semibold text-sm',
              isDestructive ? 'text-destructive dark:text-destructive/50' : 'text-warning dark:text-warning/50'
            )}
          >
            {title}
          </h3>
        )}
        <p
          className={cn(
            'text-sm',
            title ? 'mt-1' : '',
            isDestructive ? 'text-destructive dark:text-destructive/70' : 'text-warning dark:text-warning'
          )}
        >
          {message}
        </p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className={cn(
              'mt-2 h-8 px-3',
              isDestructive
                ? 'text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-destructive/70 dark:hover:bg-destructive/30'
                : 'text-warning hover:text-warning hover:bg-warning-muted dark:text-warning dark:hover:bg-warning/30'
            )}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className={cn(
            'h-8 w-8 flex-shrink-0',
            isDestructive
              ? 'text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-destructive dark:hover:bg-destructive/30'
              : 'text-warning hover:text-warning hover:bg-warning-muted dark:text-warning dark:hover:bg-warning/30'
          )}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full">{content}</div>
      </div>
    );
  }

  return content;
}

/**
 * CardError - Error state within a Card component
 * Matches the Card styling used across the app
 */
export function CardError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn('border-destructive/50 bg-destructive/10', className)}>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-destructive text-sm flex-1">{message}</p>
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * EmptyState - No data state component
 * Use when there's no error but also no data
 */
export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  message,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {message && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default PageError;
