'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import { Loader2, Mail, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { onboardingApi } from '../../../lib/api/onboarding';
import { analytics } from '../../../lib/analytics/posthog';

type VerificationState = 'loading' | 'verifying' | 'success' | 'error' | 'expired';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [email, setEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('No verification token provided');
      return;
    }

    // SECURITY: Remove token from URL immediately to prevent exposure in browser history,
    // referrer headers, and server logs. Use replaceState to avoid creating a history entry.
    if (typeof window !== 'undefined' && token) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;

    setState('loading');

    // First, get token info to display email
    try {
      const tokenInfo = await onboardingApi.getTokenInfo(token);

      if (!tokenInfo || !tokenInfo.valid) {
        setState('expired');
        setErrorMessage('This verification link has expired or is invalid');
        return;
      }

      setEmail(tokenInfo.email);

      // Now verify the token
      setState('verifying');
      const result = await onboardingApi.verifyByToken(token);

      if (result.verified) {
        setState('success');
        setEmail(result.email);

        // Track verification success
        analytics.onboarding.verificationSucceeded({
          email: result.email,
          method: 'link',
        });

        // Complete the onboarding session
        try {
          await onboardingApi.completeOnboarding(result.session_id);
        } catch (completeError) {
          console.error('Failed to complete onboarding:', completeError);
          // Continue anyway since verification was successful
        }
      } else {
        setState('error');
        setErrorMessage(result.message || 'Verification failed');

        // Track verification failure
        analytics.onboarding.verificationFailed(result.message || 'Verification failed', {
          email: tokenInfo.email,
          method: 'link',
        });
      }
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 animate-pulse shadow-sm">
              <Loader2 className="w-10 h-10 text-foreground-secondary animate-spin" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">
              {state === 'loading' ? 'Loading...' : 'Verifying Your Email'}
            </h2>
            <p className="body text-[var(--foreground-secondary)]">
              Please wait while we verify your email address
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6  shadow-sm">
              <CheckCircle className="w-10 h-10 text-foreground-secondary" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Email Verified!</h2>
            <div className="bg-card border border-border shadow-sm rounded-2xl p-4 mb-6">
              <p className="body text-[var(--foreground-secondary)] mb-2">
                Your email has been successfully verified
              </p>
              {email && (
                <p className="font-semibold text-[var(--primary)]">{email}</p>
              )}
            </div>
            <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50">
              <p className="text-sm font-medium text-foreground-secondary">
                You can close this tab and return to your onboarding tab to continue.
              </p>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6  shadow-sm">
              <AlertTriangle className="w-10 h-10 text-foreground-secondary" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Link Expired</h2>
            <div className="bg-card border border-border shadow-sm rounded-2xl p-4 mb-6">
              <p className="body text-[var(--foreground-secondary)]">
                This verification link has expired or has already been used.
              </p>
            </div>
            <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50">
              <p className="text-sm text-[var(--foreground-secondary)]">
                Please return to your onboarding tab to request a new verification email.
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6  shadow-sm">
              <XCircle className="w-10 h-10 text-foreground-secondary" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Verification Failed</h2>
            <div className="bg-card border border-border shadow-sm rounded-2xl p-4 mb-6">
              <p className="body text-[var(--foreground-secondary)]">
                We couldn&apos;t verify your email address.
              </p>
            </div>
            <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50 mb-8">
              <p className="text-sm text-foreground-secondary">
                {errorMessage || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              onClick={verifyToken}
              className="button-secondary w-full py-3 px-6 rounded-xl font-medium transition-all duration-300  flex items-center justify-center"
            >
              Try Again
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Page Header */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">Email Verification</h1>
          <p className="body-large text-[var(--foreground-secondary)]">Confirming your email address</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-card border border-border shadow-sm rounded-3xl p-12 max-w-lg mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">Email Verification</h1>
          <p className="body-large text-[var(--foreground-secondary)]">Confirming your email address</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-card border border-border shadow-sm rounded-3xl p-12 animate-fadeInUp max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 animate-pulse shadow-sm">
              <Loader2 className="w-10 h-10 text-foreground-secondary animate-spin" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Loading...</h2>
            <p className="body text-[var(--foreground-secondary)]">Please wait</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
