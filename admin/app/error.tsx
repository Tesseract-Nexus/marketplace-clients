'use client';

import { useEffect } from 'react';
import { ErrorState, detectErrorType } from '@/components/ui/error-state';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry, LogRocket)
    console.error('Application error:', error);
  }, [error]);

  const errorType = detectErrorType(error);

  // Build detailed error info for debugging
  const errorDetails = [
    error.name && error.name !== 'Error' ? `Type: ${error.name}` : null,
    `Message: ${error.message}`,
    error.digest ? `ID: ${error.digest}` : null,
  ].filter(Boolean).join('\n');

  return (
    <div className="min-h-screen bg-background">
      <ErrorState
        type={errorType}
        title="Something went wrong"
        description={error.message || 'An unexpected error occurred while loading this page.'}
        showRetryButton
        showHomeButton
        onRetry={reset}
        details={process.env.NODE_ENV === 'development' ? errorDetails : undefined}
        code={error.digest}
        showSuggestions
      />
    </div>
  );
}
