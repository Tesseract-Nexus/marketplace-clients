'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import { Loader2, Mail, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { onboardingApi } from '../../../lib/api/onboarding';
import { analytics } from '../../../lib/analytics/posthog';

type VerificationState = 'loading' | 'verifying' | 'success' | 'error' | 'expired';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [email, setEmail] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('No verification token provided');
      return;
    }

    verifyToken();
  }, [token]);

  // Auto-redirect to password setup after successful verification
  useEffect(() => {
    if (state !== 'success' || !sessionId || hasRedirected) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          // Prevent multiple redirects
          setHasRedirected(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, sessionId, hasRedirected]);

  // Handle the actual redirect in a separate effect to avoid issues
  useEffect(() => {
    if (hasRedirected && sessionId) {
      const params = new URLSearchParams({ session: sessionId });
      if (email) params.set('email', email);
      router.push(`/onboarding/setup-password?${params.toString()}`);
    }
  }, [hasRedirected, sessionId, email, router]);

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
      setSessionId(tokenInfo.session_id);

      // Now verify the token
      setState('verifying');
      const result = await onboardingApi.verifyByToken(token);

      if (result.verified) {
        setState('success');
        setEmail(result.email);
        setSessionId(result.session_id);

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

        // NOTE: Don't clear localStorage here - the session data is needed for:
        // 1. Password setup page to know the session context
        // 2. Success page to show tenant details
        // localStorage will be cleared when user starts a new onboarding flow
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

  const handleContinue = () => {
    if (sessionId) {
      // Redirect to password setup page with session info
      const params = new URLSearchParams({ session: sessionId });
      if (email) params.set('email', email);
      router.push(`/onboarding/setup-password?${params.toString()}`);
    } else {
      router.push('/onboarding');
    }
  };

  const handleReturnToOnboarding = () => {
    router.push('/onboarding');
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-pulse shadow-2xl">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
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
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-green)] to-emerald-600 flex items-center justify-center mb-6 animate-scaleIn shadow-2xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Email Verified!</h2>
            <div className="glass-subtle rounded-2xl p-4 mb-6">
              <p className="body text-[var(--foreground-secondary)] mb-2">
                Your email has been successfully verified
              </p>
              {email && (
                <p className="font-semibold text-[var(--primary)]">{email}</p>
              )}
            </div>
            <div className="glass-subtle border border-[var(--apple-green)]/30 rounded-2xl p-4 bg-[var(--apple-green)]/5 mb-8">
              <div className="flex items-center justify-center gap-2 text-[var(--apple-green)]">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {redirectCountdown > 0
                    ? `Redirecting to password setup in ${redirectCountdown}s...`
                    : 'Redirecting...'}
                </span>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="apple-button w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center animate-glow"
            >
              Set Up Your Password
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-yellow)] to-amber-600 flex items-center justify-center mb-6 animate-scaleIn shadow-2xl">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Link Expired</h2>
            <div className="glass-subtle rounded-2xl p-4 mb-6">
              <p className="body text-[var(--foreground-secondary)]">
                This verification link has expired or has already been used.
              </p>
            </div>
            <div className="glass-subtle border border-[var(--apple-yellow)]/30 rounded-2xl p-4 bg-[var(--apple-yellow)]/5 mb-8">
              <p className="text-sm text-[var(--foreground-secondary)]">
                Please return to the onboarding flow to request a new verification email.
              </p>
            </div>
            <button
              onClick={handleReturnToOnboarding}
              className="apple-button w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              Return to Onboarding
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-red)] to-red-700 flex items-center justify-center mb-6 animate-scaleIn shadow-2xl">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Verification Failed</h2>
            <div className="glass-subtle rounded-2xl p-4 mb-6">
              <p className="body text-[var(--foreground-secondary)]">
                We couldn't verify your email address.
              </p>
            </div>
            <div className="glass-subtle border border-[var(--apple-red)]/30 rounded-2xl p-4 bg-[var(--apple-red)]/5 mb-8">
              <p className="text-sm text-[var(--apple-red)]">
                {errorMessage || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={verifyToken}
                className="button-secondary w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                Try Again
              </button>
              <button
                onClick={handleReturnToOnboarding}
                className="apple-button w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                <Mail className="w-5 h-5 mr-2" />
                Return to Onboarding
              </button>
            </div>
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
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[var(--apple-gray-5)] to-transparent rounded-full blur-3xl opacity-30 animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[var(--apple-gray-4)] to-transparent rounded-full blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}} />
        </div>

        <div className="glass-strong rounded-3xl p-12 border border-[var(--border)]/20 animate-fadeInUp max-w-lg mx-auto">
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
        <div className="glass-strong rounded-3xl p-12 border border-[var(--border)]/20 animate-fadeInUp max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-pulse shadow-2xl">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
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
