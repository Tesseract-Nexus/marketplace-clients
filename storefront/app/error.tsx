'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-8 animate-in fade-in duration-500">
      {/* Error Icon */}
      <div className="relative">
        <div className="w-28 h-28 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10">
          <AlertTriangle className="h-14 w-14 text-red-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
          !
        </div>
      </div>

      {/* Error Message */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="text-muted-foreground max-w-[500px] mx-auto text-base">
          We apologize for the inconvenience. An unexpected error has occurred while processing your request.
        </p>

        {/* Error ID for support */}
        {error.digest && (
          <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full inline-block">
            Error ID: <span className="font-mono">{error.digest}</span>
          </p>
        )}

        {/* Dev-only error details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-muted/50 dark:bg-muted/30 rounded-xl text-left overflow-auto max-w-2xl mx-auto max-h-48 text-xs font-mono border">
            <p className="font-bold text-red-600 dark:text-red-400 mb-1">{error.name}: {error.message}</p>
            <pre className="mt-2 text-muted-foreground whitespace-pre-wrap">{error.stack}</pre>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={() => reset()}
          variant="tenant-primary"
          size="lg"
          className="font-semibold gap-2 min-w-[140px]"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button
          variant="tenant-outline"
          size="lg"
          onClick={() => window.history.back()}
          className="font-semibold gap-2 min-w-[140px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Button
          variant="tenant-ghost"
          size="lg"
          onClick={() => window.location.href = '/'}
          className="font-semibold gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>

      {/* Help Text */}
      <p className="text-sm text-muted-foreground">
        If this problem persists, please{' '}
        <a href="/contact" className="text-tenant-primary hover:underline">
          contact support
        </a>
      </p>
    </div>
  );
}
