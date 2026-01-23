'use client';

import React, { useState } from 'react';
import { LucideIcon, ShieldX, AlertTriangle, Lock, FileX, ServerCrash, RefreshCw, ArrowLeft, Home, Wifi, WifiOff, Clock, ChevronDown, ChevronUp, Copy, Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorType =
  | 'access_denied'
  | 'not_found'
  | 'forbidden'
  | 'server_error'
  | 'permission_denied'
  | 'network_error'
  | 'timeout'
  | 'requires_auth'
  | 'custom';

interface ErrorStateConfig {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  suggestions?: string[];
}

const ERROR_CONFIGS: Record<Exclude<ErrorType, 'custom'>, ErrorStateConfig> = {
  access_denied: {
    icon: ShieldX,
    iconBgColor: 'bg-error-muted dark:bg-error/20',
    iconColor: 'text-error',
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource.',
    suggestions: [
      'Verify you\'re logged in with the correct account',
      'Contact your administrator to request access',
      'Check if your session has expired',
    ],
  },
  permission_denied: {
    icon: Lock,
    iconBgColor: 'bg-warning-muted dark:bg-warning/20',
    iconColor: 'text-warning',
    title: 'Permission Required',
    description: 'You need additional permissions to view this content.',
    suggestions: [
      'Ask your administrator to grant you access',
      'You may need a higher role to view this area',
    ],
  },
  not_found: {
    icon: FileX,
    iconBgColor: 'bg-muted dark:bg-sidebar',
    iconColor: 'text-muted-foreground',
    title: 'Not Found',
    description: 'The resource you\'re looking for doesn\'t exist or has been moved.',
    suggestions: [
      'Check the URL for typos',
      'The item may have been deleted',
      'Try searching for it in the dashboard',
    ],
  },
  forbidden: {
    icon: Lock,
    iconBgColor: 'bg-error-muted dark:bg-error/20',
    iconColor: 'text-error',
    title: 'Forbidden',
    description: 'You are not authorized to access this area.',
    suggestions: [
      'This area is restricted to specific roles',
      'Contact your administrator for access',
    ],
  },
  server_error: {
    icon: ServerCrash,
    iconBgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary',
    title: 'Something Went Wrong',
    description: 'We encountered an unexpected error while processing your request.',
    suggestions: [
      'Try refreshing the page',
      'Wait a moment and try again',
      'If the problem persists, contact support',
    ],
  },
  network_error: {
    icon: WifiOff,
    iconBgColor: 'bg-warning-muted dark:bg-warning/20',
    iconColor: 'text-warning',
    title: 'Connection Problem',
    description: 'Unable to connect to the server. Please check your internet connection.',
    suggestions: [
      'Check your internet connection',
      'Try disabling VPN if you\'re using one',
      'The server may be temporarily unavailable',
    ],
  },
  timeout: {
    icon: Clock,
    iconBgColor: 'bg-warning-muted dark:bg-warning/20',
    iconColor: 'text-warning',
    title: 'Request Timed Out',
    description: 'The server took too long to respond.',
    suggestions: [
      'Try again in a few moments',
      'The server may be experiencing high load',
      'Check your network connection',
    ],
  },
  requires_auth: {
    icon: Lock,
    iconBgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary',
    title: 'Authentication Required',
    description: 'You need to be logged in to access this area.',
    suggestions: [
      'Please log in to continue',
      'Your session may have expired',
    ],
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
  /** Technical details shown in expandable section */
  details?: string;
  /** Custom suggestions to show */
  suggestions?: string[];
  /** Show default suggestions based on error type */
  showSuggestions?: boolean;
}

// Helper to detect error type from error message
export function detectErrorType(error: string | Error | unknown): ErrorType {
  const message = error instanceof Error ? error.message : String(error || '');
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('failed to fetch')) {
    return 'network_error';
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'timeout';
  }
  if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized') || lowerMessage.includes('not authenticated')) {
    return 'requires_auth';
  }
  if (lowerMessage.includes('403') || lowerMessage.includes('forbidden') || lowerMessage.includes('access denied')) {
    return 'access_denied';
  }
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return 'not_found';
  }
  if (lowerMessage.includes('permission')) {
    return 'permission_denied';
  }
  return 'server_error';
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
  details,
  suggestions,
  showSuggestions = true,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = type !== 'custom' ? ERROR_CONFIGS[type] : null;

  const IconComponent = icon || config?.icon || AlertTriangle;
  const finalIconBgColor = iconBgColor || config?.iconBgColor || 'bg-muted';
  const finalIconColor = iconColor || config?.iconColor || 'text-muted-foreground';
  const finalTitle = title || config?.title || 'Error';
  const finalDescription = description || config?.description || 'An error occurred.';
  const finalSuggestions = suggestions || (showSuggestions ? config?.suggestions : undefined);

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

  const handleCopyDetails = async () => {
    const detailsText = [
      `Error: ${finalTitle}`,
      `Message: ${finalDescription}`,
      code ? `Code: ${code}` : null,
      details ? `Details: ${details}` : null,
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(detailsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
      <div className="max-w-lg w-full">
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

          {/* Suggestions */}
          {finalSuggestions && finalSuggestions.length > 0 && (
            <div className="mt-6 bg-muted/50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                What you can try
              </div>
              <ul className="space-y-1.5">
                {finalSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(actions.length > 0 || showRetryButton || showHomeButton) && (
            <div className="space-y-3 mt-6">
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

          {/* Technical Details (expandable) */}
          {details && (
            <div className="mt-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>
              {showDetails && (
                <div className="mt-3 bg-muted rounded-lg p-3 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Error Details</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleCopyDetails}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-all overflow-auto max-h-32">
                    {details}
                  </pre>
                </div>
              )}
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
