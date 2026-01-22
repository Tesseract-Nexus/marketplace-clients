'use client';

import React from 'react';
import { LucideIcon, ShieldX, AlertTriangle, Lock, FileX, ServerCrash, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorType =
  | 'access_denied'
  | 'not_found'
  | 'forbidden'
  | 'server_error'
  | 'permission_denied'
  | 'custom';

interface ErrorStateConfig {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
}

const ERROR_CONFIGS: Record<Exclude<ErrorType, 'custom'>, ErrorStateConfig> = {
  access_denied: {
    icon: ShieldX,
    iconBgColor: 'bg-error-muted dark:bg-error/20',
    iconColor: 'text-error',
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource.',
  },
  permission_denied: {
    icon: Lock,
    iconBgColor: 'bg-warning-muted dark:bg-warning/20',
    iconColor: 'text-warning',
    title: 'Permission Required',
    description: 'You need additional permissions to view this content.',
  },
  not_found: {
    icon: FileX,
    iconBgColor: 'bg-muted dark:bg-sidebar',
    iconColor: 'text-muted-foreground',
    title: 'Not Found',
    description: 'The resource you\'re looking for doesn\'t exist or has been moved.',
  },
  forbidden: {
    icon: Lock,
    iconBgColor: 'bg-error-muted dark:bg-error/20',
    iconColor: 'text-error',
    title: 'Forbidden',
    description: 'You are not authorized to access this area.',
  },
  server_error: {
    icon: ServerCrash,
    iconBgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary',
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again later.',
  },
};

interface ErrorStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  actions?: ErrorStateAction[];
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  compact?: boolean;
  code?: string;
}

export function ErrorState({
  type = 'access_denied',
  title,
  description,
  icon,
  iconBgColor,
  iconColor,
  actions = [],
  showHomeButton = false,
  showRetryButton = false,
  onRetry,
  onGoHome,
  className,
  compact = false,
  code,
}: ErrorStateProps) {
  const config = type !== 'custom' ? ERROR_CONFIGS[type] : null;

  const IconComponent = icon || config?.icon || AlertTriangle;
  const finalIconBgColor = iconBgColor || config?.iconBgColor || 'bg-muted';
  const finalIconColor = iconColor || config?.iconColor || 'text-muted-foreground';
  const finalTitle = title || config?.title || 'Error';
  const finalDescription = description || config?.description || 'An error occurred.';

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (compact) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 px-6',
        className
      )}>
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mb-4',
          finalIconBgColor
        )}>
          <IconComponent className={cn('h-7 w-7', finalIconColor)} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">{finalTitle}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">{finalDescription}</p>
        {code && (
          <p className="mt-2 text-xs text-muted-foreground/60 font-mono">
            Error code: {code}
          </p>
        )}
        {(actions.length > 0 || showRetryButton || showHomeButton) && (
          <div className="flex items-center gap-2 mt-4">
            {showRetryButton && (
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            )}
            {showHomeButton && (
              <Button size="sm" variant="ghost" onClick={handleGoHome}>
                <Home className="h-3.5 w-3.5 mr-1.5" />
                Home
              </Button>
            )}
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                >
                  {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-[60vh] flex items-center justify-center p-8',
      className
    )}>
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
            finalIconBgColor
          )}>
            <IconComponent className={cn('h-10 w-10', finalIconColor)} />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">{finalTitle}</h2>
          <p className="text-muted-foreground mb-2">{finalDescription}</p>

          {code && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-2">
              Error code: {code}
            </p>
          )}

          {(actions.length > 0 || showRetryButton || showHomeButton) && (
            <div className="space-y-3 mt-8">
              {showRetryButton && (
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white shadow-lg"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {showHomeButton && (
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={handleGoHome}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              )}
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    className={cn(
                      'w-full h-12',
                      action.variant === 'default' && 'bg-primary hover:bg-primary/90 text-white shadow-lg'
                    )}
                    onClick={action.onClick}
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            If you believe this is an error, please contact{' '}
            <a href="mailto:support@tesserix.app" className="text-primary hover:underline">
              support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
