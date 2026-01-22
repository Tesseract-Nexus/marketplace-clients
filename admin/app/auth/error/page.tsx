'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
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
    description: 'You don\'t have permission to access this application.',
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

  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;

  const handleTryAgain = () => {
    router.push('/login');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <div className="text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-3">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-1">
          Tesseract Hub
        </h1>
        <p className="text-xs text-muted-foreground mb-6">Admin Portal</p>
      </div>

      {/* Error icon and message */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{errorInfo.title}</h2>
          <p className="text-sm text-muted-foreground">
            {errorDescription || errorInfo.description}
          </p>
        </div>

        {/* Error code for debugging */}
        {errorCode !== 'default' && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Error code: {errorCode}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handleTryAgain}
          className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="w-full h-12 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>

      {/* Help text */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          If the problem persists, please contact{' '}
          <a href="mailto:support@tesserix.app" className="text-primary hover:underline">
            support@tesserix.app
          </a>
        </p>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-20">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Animated elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-destructive/100/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Error card */}
      <div className="w-full max-w-md px-4 py-8 mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 space-y-5 animate-fade-in-up">
          <Suspense fallback={<LoadingFallback />}>
            <AuthErrorContent />
          </Suspense>
        </div>

        <p className="text-center text-[10px] text-white/60 mt-4">
          &copy; 2026 Tesseract Hub. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}
