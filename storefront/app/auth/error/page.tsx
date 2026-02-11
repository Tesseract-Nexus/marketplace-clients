'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  token_exchange_failed: {
    title: 'Authentication Failed',
    description: 'We couldn\'t complete the sign-in process. This may be a temporary issue.',
  },
  invalid_state: {
    title: 'Session Expired',
    description: 'Your login session has expired. Please try signing in again.',
  },
  access_denied: {
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource.',
  },
  invalid_request: {
    title: 'Invalid Request',
    description: 'The login request was invalid. Please try again.',
  },
  server_error: {
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again later.',
  },
  temporarily_unavailable: {
    title: 'Service Unavailable',
    description: 'The authentication service is temporarily unavailable. Please try again later.',
  },
  callback_error: {
    title: 'Login Error',
    description: 'Something went wrong during the login process. Please try again.',
  },
  default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during sign-in. Please try again.',
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode = searchParams.get('error') || 'default';
  const errorDescription = searchParams.get('error_description');

  const errorInfo = (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES['default'])!;

  const handleTryAgain = () => {
    router.push('/login');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border shadow-xl p-8 space-y-6">
          {/* Error icon */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {errorDescription || errorInfo.description}
            </p>
          </div>

          {/* Error code */}
          {errorCode !== 'default' && (
            <p className="text-xs text-center text-muted-foreground/60 font-mono">
              Error code: {errorCode}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleTryAgain}
              className="w-full h-11"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Help text */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
