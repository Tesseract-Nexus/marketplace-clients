'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import { Loader2, Mail, RefreshCw, Shield, CheckCircle, ExternalLink, Gift, ArrowRight, Sparkles, Home, Store, Rocket, Clock, User, Smartphone, Copy, Check, KeyRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useOnboardingStore } from '../../../lib/store/onboarding-store';
import { onboardingApi } from '../../../lib/api/onboarding';
import { analytics } from '../../../lib/analytics/posthog';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => isDev && console.log(...args);
const devError = (...args: unknown[]) => isDev && console.error(...args);

type VerificationMethod = 'otp' | 'link' | 'totp' | null;

// Idle timeout in milliseconds (5 minutes)
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

// Loading fallback for Suspense
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">Email Verification</h1>
          <p className="body-large text-[var(--foreground-secondary)]">Loading...</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-card border border-border shadow-sm rounded-3xl p-12 animate-fadeInUp max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 animate-pulse shadow-sm">
              <Loader2 className="w-10 h-10 text-foreground-secondary animate-spin" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Loading...</h2>
            <p className="body text-[var(--foreground-secondary)]">Please wait...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Congratulations page component for when onboarding is complete
interface CompletionData {
  tenant_slug?: string;
  business_name?: string;
  admin_url?: string;
  completed_at?: string;
}

function CongratulationsPage({ completionData, idleCountdown }: { completionData: CompletionData; idleCountdown: number }) {
  const router = useRouter();

  const handleGoToLogin = () => {
    // Clear the completion flag
    localStorage.removeItem('onboarding_completed');
    if (completionData.admin_url) {
      window.location.href = `${completionData.admin_url}/login`;
    } else if (completionData.tenant_slug) {
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.app';
      window.location.href = `https://${completionData.tenant_slug}-admin.${baseDomain}/login`;
    }
  };

  const handleStartNew = () => {
    // Clear the completion flag and go to onboarding
    localStorage.removeItem('onboarding_completed');
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <Header />

      {/* Celebration background */}
      <div className="absolute inset-0 -z-10 bg-warm-50" />

      {/* Main Content */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Celebration Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-8 animate-fadeInUp">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Onboarding Complete!
            </span>
          </div>

          {/* Big Checkmark */}
          <div className="w-24 h-24 mx-auto rounded-full bg-warm-100 flex items-center justify-center mb-8 animate-bounce shadow-lg">
            <CheckCircle className="w-12 h-12 text-foreground-secondary" />
          </div>

          <h1 className="display-large text-[var(--foreground)] mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Congratulations! 🎉
          </h1>

          <p className="body-large text-[var(--foreground-secondary)] max-w-xl mx-auto mb-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Your store has been successfully created and is ready to go!
          </p>

          {/* Show admin URL - use custom domain if available, otherwise fallback to subdomain */}
          {(completionData.admin_url || completionData.tenant_slug) && (
            <p className="text-lg font-semibold text-primary mb-8 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              {completionData.admin_url
                ? completionData.admin_url.replace(/^https?:\/\//, '')
                : `${completionData.tenant_slug}-admin.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.app'}`}
            </p>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="max-w-2xl mx-auto px-6 pb-8">
        <div className="bg-card border border-border rounded-3xl p-8 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          {/* What's Next */}
          <h3 className="headline text-[var(--foreground)] mb-6 flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Your Store is Ready!
          </h3>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-[var(--foreground-secondary)]">Store infrastructure provisioned</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-[var(--foreground-secondary)]">Admin dashboard configured</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-[var(--foreground-secondary)]">Storefront ready for customization</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleGoToLogin}
            className="apple-button w-full py-4 text-lg font-medium transition-all duration-300 flex items-center justify-center mb-4"
          >
            Go to Admin Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>

          <button
            onClick={handleStartNew}
            className="button-secondary w-full py-3 text-sm font-medium"
          >
            Create Another Store
          </button>
        </div>
      </div>

      {/* Idle Timer Notice */}
      {idleCountdown > 0 && idleCountdown < 60 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-sm rounded-full px-6 py-3 animate-fadeInUp flex items-center gap-3">
          <Clock className="w-4 h-4 text-[var(--foreground-secondary)]" />
          <span className="text-sm text-[var(--foreground-secondary)]">
            Redirecting to home in {idleCountdown}s
          </span>
        </div>
      )}

      {/* Auto-redirect progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-[var(--border)]/20">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${((IDLE_TIMEOUT_MS / 1000 - idleCountdown) / (IDLE_TIMEOUT_MS / 1000)) * 100}%` }}
        />
      </div>

      {/* Quick Action Button */}
      <div className="fixed bottom-8 right-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
        <button
          onClick={() => {
            localStorage.removeItem('onboarding_completed');
            router.push('/');
          }}
          className="bg-card border border-border shadow-sm rounded-full p-4 hover:border-warm-300 transition-colors group"
        >
          <Home className="w-6 h-6 text-[var(--foreground-secondary)] group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
}

// Welcome page component for when no valid session exists
function WelcomePage({ email, idleCountdown }: { email?: string; idleCountdown: number }) {
  const router = useRouter();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFirstName = (emailStr?: string) => {
    if (!emailStr) return 'there';
    const name = emailStr.split('@')[0];
    // Capitalize first letter, handle common email patterns
    const cleanName = name.replace(/[._-]/g, ' ').split(' ')[0];
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <Header />

      {/* Minimal background */}
      <div className="absolute inset-0 -z-10 bg-warm-50" />

      {/* Main Content */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Personalized Greeting */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-8">
            <Sparkles className="w-4 h-4 text-foreground-secondary" />
            <span className="text-sm font-medium text-[var(--foreground-secondary)]">
              {greeting()}, {getFirstName(email)}
            </span>
          </div>

          <h1 className="display-large text-[var(--foreground)] mb-6">
            Welcome to{' '}
            <span className="text-foreground">
              mark8ly
            </span>
          </h1>

          <p className="body-large text-[var(--foreground-secondary)] max-w-xl mx-auto mb-12">
            Your journey to building an amazing online store starts here. We're thrilled to have you join our community of successful merchants.
          </p>
        </div>
      </div>

      {/* Welcome Cards */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Quick Start */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mb-6">
              <Rocket className="w-7 h-7 text-foreground-secondary" />
            </div>
            <h3 className="headline text-[var(--foreground)] mb-2">Quick Start</h3>
            <p className="body text-[var(--foreground-secondary)] mb-6">
              Set up your store in minutes with our guided onboarding process.
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="apple-button w-full py-3 text-sm font-medium"
            >
              Start Onboarding
            </button>
          </div>

          {/* Card 2: Features */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mb-6">
              <Store className="w-7 h-7 text-foreground-secondary" />
            </div>
            <h3 className="headline text-[var(--foreground)] mb-2">Explore Features</h3>
            <p className="body text-[var(--foreground-secondary)] mb-6">
              Discover powerful tools to grow your e-commerce business.
            </p>
            <button
              onClick={() => router.push('/')}
              className="button-secondary w-full py-3 text-sm font-medium"
            >
              Learn More
            </button>
          </div>

          {/* Card 3: Support */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mb-6">
              <User className="w-7 h-7 text-foreground-secondary" />
            </div>
            <h3 className="headline text-[var(--foreground)] mb-2">Get Support</h3>
            <p className="body text-[var(--foreground-secondary)] mb-6">
              Our team is here to help you succeed every step of the way.
            </p>
            <button
              onClick={() => window.open('mailto:support@mark8ly.app', '_blank')}
              className="button-secondary w-full py-3 text-sm font-medium"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Idle Timer Notice */}
      {idleCountdown > 0 && idleCountdown < 60 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-sm rounded-full px-6 py-3 animate-fadeInUp flex items-center gap-3">
          <Clock className="w-4 h-4 text-[var(--foreground-secondary)]" />
          <span className="text-sm text-[var(--foreground-secondary)]">
            Redirecting to home in {idleCountdown}s
          </span>
        </div>
      )}

      {/* Auto-redirect progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-[var(--border)]/20">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${((IDLE_TIMEOUT_MS / 1000 - idleCountdown) / (IDLE_TIMEOUT_MS / 1000)) * 100}%` }}
        />
      </div>

      {/* Quick Action Button */}
      <div className="fixed bottom-8 right-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
        <button
          onClick={() => router.push('/')}
          className="bg-card border border-border shadow-sm rounded-full p-4 hover:border-warm-300 transition-colors group"
        >
          <Home className="w-6 h-6 text-[var(--foreground-secondary)] group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
}

// Main page wrapper with Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    sessionId: storeSessionId,
    contactDetails,
    setEmailVerified,
    _hasHydrated,
    rehydrateSensitiveData,
  } = useOnboardingStore();

  // Allow session ID from URL params or store
  const sessionId = searchParams?.get('session') || searchParams?.get('session_id') || storeSessionId;
  const emailFromParams = searchParams?.get('email');

  // Track if we're waiting for rehydration
  const [isRehydrating, setIsRehydrating] = useState(!_hasHydrated);

  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSendingInitial, setIsSendingInitial] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiry, setCodeExpiry] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [showWelcomePage, setShowWelcomePage] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_TIMEOUT_MS / 1000);

  // TOTP Authenticator App state
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [selectedMfaMethod, setSelectedMfaMethod] = useState<'email' | 'totp' | null>(null);
  const [totpSetupSession, setTotpSetupSession] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpManualKey, setTotpManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [totpConfirmed, setTotpConfirmed] = useState(false);
  const [backupCodesAcknowledged, setBackupCodesAcknowledged] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [isTotpVerifying, setIsTotpVerifying] = useState(false);
  const [totpError, setTotpError] = useState('');

  const totpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasInitializedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // State for email fetched directly from session API (more reliable than store)
  const [fetchedEmail, setFetchedEmail] = useState<string>('');

  // Get email from URL params first (most reliable), then store, then fetched
  const email = emailFromParams || contactDetails.email || fetchedEmail || '';

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleCountdown(IDLE_TIMEOUT_MS / 1000);
  }, []);

  // Track user activity to reset idle timer
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [resetIdleTimer]);

  // Idle timer countdown for welcome/congratulations pages
  useEffect(() => {
    if (!showWelcomePage && !showCongratulations) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
      setIdleCountdown(remaining);

      if (remaining <= 0) {
        // Clear completion flag before redirect
        localStorage.removeItem('onboarding_completed');
        router.replace('/');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWelcomePage, showCongratulations, router]);

  // Wait for rehydration to complete before checking session data
  // Add safety timeout to prevent indefinite loading
  useEffect(() => {
    // Safety timeout: if rehydration takes too long, proceed anyway
    // This prevents the page from being stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isRehydrating) {
        devLog('[Verify] Rehydration timeout - proceeding with available data');
        setIsRehydrating(false);
      }
    }, 3000); // 3 second timeout

    if (!_hasHydrated) {
      setIsRehydrating(true);
      return () => clearTimeout(timeoutId);
    }

    // If we have URL params, we don't need to wait for store rehydration
    if (emailFromParams && sessionId) {
      devLog('[Verify] Email available from URL params, skipping store rehydration');
      setIsRehydrating(false);
      return () => clearTimeout(timeoutId);
    }

    // If we have a sessionId but no email from store or URL, trigger rehydration
    if (sessionId && !contactDetails.email && !emailFromParams) {
      rehydrateSensitiveData().finally(() => {
        setIsRehydrating(false);
      });
    } else {
      setIsRehydrating(false);
    }

    return () => clearTimeout(timeoutId);
  }, [_hasHydrated, sessionId, contactDetails.email, emailFromParams, rehydrateSensitiveData, isRehydrating]);

  // Track if email fetch has been attempted (to avoid showing welcome page prematurely)
  const [emailFetchAttempted, setEmailFetchAttempted] = useState(false);

  // Robust email fetching: directly fetch from session API if email is not available
  // This is more reliable than depending on store rehydration
  useEffect(() => {
    // Skip if we already have email from URL params or store
    if (emailFromParams || contactDetails.email || fetchedEmail) {
      setEmailFetchAttempted(true);
      return;
    }

    // Skip if no session ID
    if (!sessionId) {
      setEmailFetchAttempted(true);
      return;
    }

    // Skip if still rehydrating (give store a chance first)
    if (isRehydrating) {
      return;
    }

    devLog('[Verify] Email not found in URL or store, fetching from session API');

    const fetchEmailFromSession = async () => {
      try {
        const session = await onboardingApi.getOnboardingSession(sessionId);
        // Handle both legacy (contact_details/contact_info) and new (contact_information array) formats
        const sessionEmail = session.contact_details?.email
          || session.contact_info?.email
          || session.contact_information?.[0]?.email;
        if (sessionEmail) {
          devLog('[Verify] Email fetched from session API:', sessionEmail);
          setFetchedEmail(sessionEmail);
        } else {
          devLog('[Verify] No email found in session API response');
        }
      } catch (error) {
        devError('[Verify] Failed to fetch email from session API:', error);
      } finally {
        setEmailFetchAttempted(true);
      }
    };

    fetchEmailFromSession();
  }, [sessionId, emailFromParams, contactDetails.email, fetchedEmail, isRehydrating]);

  // Show congratulations or welcome page after rehydration and email fetch complete
  useEffect(() => {
    // Wait for rehydration to complete
    if (isRehydrating) return;

    // Wait for email fetch attempt to complete (gives session API a chance)
    if (!emailFetchAttempted) return;

    // Check if onboarding was just completed (show congratulations)
    try {
      const completedData = localStorage.getItem('onboarding_completed');
      if (completedData) {
        const parsed = JSON.parse(completedData) as CompletionData;
        // Only show if completed recently (within 30 minutes)
        if (parsed.completed_at) {
          const completedAt = new Date(parsed.completed_at);
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          if (completedAt > thirtyMinutesAgo) {
            setCompletionData(parsed);
            setShowCongratulations(true);
            devLog('[Verify] Showing congratulations page for completed onboarding');
            return;
          } else {
            // Completion data is stale, remove it
            localStorage.removeItem('onboarding_completed');
          }
        }
      }
    } catch (e) {
      devError('[Verify] Failed to check completion data:', e);
    }

    // Check for valid session: need sessionId AND email from any source
    // Include fetchedEmail which may be populated from direct session API call
    const hasValidSession = sessionId && (emailFromParams || contactDetails.email || fetchedEmail);
    if (!hasValidSession) {
      devLog('[Verify] No valid session, showing welcome page');
      setShowWelcomePage(true);
    } else if (showWelcomePage) {
      // If we now have a valid session (e.g., email was fetched), hide welcome page
      devLog('[Verify] Valid session found, hiding welcome page');
      setShowWelcomePage(false);
    }
  }, [isRehydrating, emailFetchAttempted, sessionId, emailFromParams, contactDetails.email, fetchedEmail, showWelcomePage]);

  // Check verification method on mount — show method selector
  useEffect(() => {
    // Wait for rehydration to complete
    if (isRehydrating) return;

    // Handle case when page is visited directly without session
    if (!email || !sessionId || showWelcomePage) {
      return; // Will show welcome page via the effect above
    }

    // Prevent duplicate init in React Strict Mode
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // Show method selector so user can choose email OTP or authenticator app
    setShowMethodSelector(true);
  }, [isRehydrating, email, sessionId, router, showWelcomePage]);

  const sendVerification = async (method: VerificationMethod) => {
    if (!email || !sessionId) {
      setError('Email not found. Please go back and complete the contact details step.');
      return;
    }

    setIsSendingInitial(true);
    try {
      const result = await onboardingApi.sendEmailVerification(sessionId, email);

      if (method === 'link') {
        setLinkSent(true);
        setSuccess('Verification link sent to your email');
      } else {
        setCodeExpiry(result.expires_in_seconds);
        setSuccess('Verification code sent to your email');
        // Focus first input for OTP
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }

      // Track verification sent
      analytics.onboarding.verificationCodeSent({
        email: email,
        trigger: 'initial',
        method: method || 'otp',
      });
    } catch (error) {
      setError('Failed to send verification email. Please try resending.');
    } finally {
      setIsSendingInitial(false);
    }
  };

  // Handle resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle code expiry timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (codeExpiry > 0) {
      interval = setInterval(() => {
        setCodeExpiry(prev => {
          if (prev <= 1) {
            setError('Verification code has expired. Please request a new one.');

            // Track code expiry
            analytics.onboarding.codeExpired({
              email: email,
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [codeExpiry, email]);

  // Listen for real-time verification events via SSE (Server-Sent Events)
  // This replaces polling with instant push notifications via NATS
  useEffect(() => {
    if (verificationMethod !== 'link' || !sessionId || !email || isVerified) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectSSE = () => {
      // Connect to the SSE endpoint via BFF proxy
      const sseUrl = `/api/onboarding/${sessionId}/events`;
      devLog('[SSE] Connecting to', sseUrl);

      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        devLog('[SSE] Connected to session events');
        reconnectAttempts = 0; // Reset on successful connection
      };

      // Listen for session.completed event (triggered when email is verified)
      eventSource.addEventListener('session.completed', (event) => {
        devLog('[SSE] Received session.completed event:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.verified || data.session_id === sessionId) {
            setIsVerified(true);
            setEmailVerified(true);
            setSuccess('Email verified successfully!');

            // Track verification success
            analytics.onboarding.verificationSucceeded({
              email: email,
              method: 'link',
            });

            // Close the SSE connection
            eventSource?.close();
          }
        } catch (error) {
          devError('[SSE] Failed to parse event data:', error);
        }
      });

      // Also listen for session.verified event (alternative event name)
      eventSource.addEventListener('session.verified', (event) => {
        devLog('[SSE] Received session.verified event:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.verified || data.session_id === sessionId) {
            setIsVerified(true);
            setEmailVerified(true);
            setSuccess('Email verified successfully!');

            analytics.onboarding.verificationSucceeded({
              email: email,
              method: 'link',
            });

            eventSource?.close();
          }
        } catch (error) {
          devError('[SSE] Failed to parse event data:', error);
        }
      });

      // Handle connection event (server sends this on connect)
      eventSource.addEventListener('connected', (event) => {
        devLog('[SSE] Connection confirmed:', event.data);
      });

      // Handle ping events (keepalive)
      eventSource.addEventListener('ping', () => {
        devLog('[SSE] Ping received');
      });

      eventSource.onerror = (error) => {
        devError('[SSE] Connection error:', error);
        eventSource?.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts && !isVerified) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          setTimeout(connectSSE, delay);
        } else {
          devLog('[SSE] Max reconnect attempts reached, falling back to polling');
          // Fall back to polling if SSE fails
          startPollingFallback();
        }
      };
    };

    // Fallback polling function if SSE fails
    const startPollingFallback = () => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await onboardingApi.getVerificationStatus(sessionId, email);
          if (status.is_verified) {
            setIsVerified(true);
            setEmailVerified(true);
            setSuccess('Email verified successfully!');
            clearInterval(pollInterval);

            analytics.onboarding.verificationSucceeded({
              email: email,
              method: 'link',
            });
          }
        } catch (error) {
          devLog('[Polling] Checking verification status...');
        }
      }, 3000);

      // Store interval ID for cleanup
      return () => clearInterval(pollInterval);
    };

    // Start SSE connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      devLog('[SSE] Cleaning up connection');
      eventSource?.close();
    };
  }, [verificationMethod, sessionId, email, isVerified, setEmailVerified]);

  // Auto-redirect after verification success
  useEffect(() => {
    if (!isVerified) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to password setup
          const params = new URLSearchParams({ session: sessionId || '' });
          if (email) params.set('email', email);
          router.push(`/onboarding/setup-password?${params.toString()}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerified, sessionId, email, router]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerification(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerification = async (code: string) => {
    if (!sessionId) {
      setError('No active session. Please restart the onboarding process.');
      return;
    }

    if (!email) {
      setError('Email not found. Please go back and complete the contact details step.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onboardingApi.verifyEmail(sessionId, email, code);

      if (result.verified) {
        setEmailVerified(true);
        setIsVerified(true);
        setSuccess('Email verified successfully!');

        // Track verification success
        analytics.onboarding.verificationSucceeded({
          email: email,
          method: verificationMethod || 'otp',
        });
      } else {
        const errorMsg = result.message || 'Invalid verification code. Please try again.';
        setError(errorMsg);

        // Track verification failure
        analytics.onboarding.verificationFailed(errorMsg, {
          email: email,
        });

        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      setError(errorMessage);

      // Track verification error
      analytics.onboarding.verificationFailed(errorMessage, {
        email: email,
      });

      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (!sessionId) {
      setError('No active session. Please restart the onboarding process.');
      return;
    }

    if (!email) {
      setError('Email not found. Please go back and complete the contact details step.');
      return;
    }

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const result = await onboardingApi.resendVerificationCode(sessionId, email);

      if (verificationMethod === 'link') {
        setLinkSent(true);
        setSuccess('Verification link sent successfully!');
      } else {
        setCodeExpiry(result.expires_in_seconds);
        setSuccess('Verification code sent successfully!');
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }

      setResendCooldown(60); // 1 minute cooldown

      // Track resend verification
      analytics.onboarding.verificationCodeSent({
        email: email,
        trigger: 'resend',
        method: verificationMethod || 'otp',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification. Please try again.';
      setError(errorMessage);

      // Track rate limit if detected
      if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
        analytics.onboarding.rateLimitHit({
          email: email,
          action: 'resend_verification',
        });
      }
    }

    setIsResending(false);
  };

  const handleManualVerify = () => {
    const code = verificationCode.join('');
    if (code.length === 6) {
      handleVerification(code);
    }
  };

  // Handle method selection
  const handleSelectMethod = async (method: 'email' | 'totp') => {
    setSelectedMfaMethod(method);
    setShowMethodSelector(false);

    if (method === 'email') {
      // Send email OTP
      try {
        const methodResponse = await onboardingApi.getVerificationMethod();
        setVerificationMethod(methodResponse.method);
        await sendVerification(methodResponse.method);
      } catch {
        setVerificationMethod('otp');
        await sendVerification('otp');
      }
    } else {
      // Initiate TOTP setup
      setVerificationMethod('totp');
      try {
        const result = await onboardingApi.initiateTotpSetup(sessionId!, email);
        setTotpSetupSession(result.setup_session);
        setTotpUri(result.totp_uri);
        setTotpManualKey(result.manual_entry_key);
        setBackupCodes(result.backup_codes);
      } catch (error) {
        setTotpError('Failed to set up authenticator. Please try again.');
        devError('TOTP setup failed:', error);
      }
    }
  };

  // Handle TOTP code input
  const handleTotpInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...totpCode];
    newCode[index] = value;
    setTotpCode(newCode);

    if (value && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(d => d !== '') && newCode.join('').length === 6) {
      handleTotpVerification(newCode.join(''));
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !totpCode[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleTotpVerification = async (code: string) => {
    if (!totpSetupSession || !sessionId) return;

    setIsTotpVerifying(true);
    setTotpError('');

    try {
      const result = await onboardingApi.confirmTotpSetup(totpSetupSession, code, sessionId);
      if (result.success) {
        setTotpConfirmed(true);
      } else {
        setTotpError(result.message || 'Invalid code. Please try again.');
        setTotpCode(['', '', '', '', '', '']);
        totpInputRefs.current[0]?.focus();
      }
    } catch (error) {
      setTotpError('Verification failed. Please try again.');
      setTotpCode(['', '', '', '', '', '']);
      totpInputRefs.current[0]?.focus();
    }

    setIsTotpVerifying(false);
  };

  const handleBackupCodesAcknowledged = () => {
    setBackupCodesAcknowledged(true);
    setEmailVerified(true);
    setIsVerified(true);
    setSuccess('Authenticator app verified successfully!');
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    });
  };

  // Render method selector
  const renderMethodSelector = () => (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 shadow-sm">
        <Shield className="w-10 h-10 text-foreground-secondary" />
      </div>
      <h2 className="display-medium text-[var(--foreground)] mb-4">Verify Your Identity</h2>
      <p className="body text-[var(--foreground-secondary)] mb-8">
        Choose how you'd like to verify your email address
      </p>

      <div className="space-y-4">
        {/* Email OTP Option */}
        <button
          onClick={() => handleSelectMethod('email')}
          className="w-full bg-card border-2 border-border hover:border-[var(--primary)]/50 rounded-2xl p-6 text-left transition-all duration-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0 group-hover:bg-warm-200 transition-colors">
              <Mail className="w-6 h-6 text-foreground-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-1">Email Verification Code</h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                We'll send a 6-digit code to <span className="font-medium">{email}</span>
              </p>
            </div>
          </div>
        </button>

        {/* Authenticator App Option */}
        <button
          onClick={() => handleSelectMethod('totp')}
          className="w-full bg-card border-2 border-border hover:border-[var(--primary)]/50 rounded-2xl p-6 text-left transition-all duration-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0 group-hover:bg-warm-200 transition-colors">
              <Smartphone className="w-6 h-6 text-foreground-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-1">Authenticator App</h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Use Google Authenticator, Authy, or any TOTP app for enhanced security
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Render TOTP setup (QR code + code input)
  const renderTotpSetup = () => (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 shadow-sm">
        <Smartphone className="w-10 h-10 text-foreground-secondary" />
      </div>
      <h2 className="display-medium text-[var(--foreground)] mb-2">Set Up Authenticator</h2>
      <p className="body text-[var(--foreground-secondary)] mb-6">
        Scan this QR code with your authenticator app
      </p>

      {totpError && (
        <div className="bg-card border border-warm-200 rounded-2xl p-4 bg-warm-50 mb-6">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">{totpError}</span>
          </div>
        </div>
      )}

      {/* QR Code */}
      {totpUri && (
        <div className="bg-white rounded-2xl p-6 inline-block mb-6 border border-border">
          <QRCodeSVG value={totpUri} size={200} level="M" />
        </div>
      )}

      {/* Manual Entry Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowManualKey(!showManualKey)}
          className="text-sm text-[var(--primary)] hover:underline"
        >
          {showManualKey ? 'Hide manual entry key' : "Can't scan? Enter key manually"}
        </button>
        {showManualKey && totpManualKey && (
          <div className="mt-3 bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-[var(--foreground-secondary)] mb-2">Manual entry key:</p>
            <code className="text-sm font-mono font-semibold text-[var(--foreground)] break-all">
              {totpManualKey}
            </code>
          </div>
        )}
      </div>

      {/* TOTP Code Input */}
      <div className="space-y-6">
        <p className="text-sm text-[var(--foreground-secondary)]">
          Enter the 6-digit code from your authenticator app
        </p>
        <div className="flex justify-center gap-3">
          {totpCode.map((digit, index) => (
            <input
              key={index}
              ref={el => { totpInputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleTotpInputChange(index, e.target.value)}
              onKeyDown={e => handleTotpKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20 transition-all duration-200"
              disabled={isTotpVerifying}
            />
          ))}
        </div>

        <button
          onClick={() => handleTotpVerification(totpCode.join(''))}
          disabled={isTotpVerifying || totpCode.join('').length !== 6}
          className={`apple-button w-full py-4 text-lg font-medium transition-all duration-300 flex items-center justify-center ${
            (isTotpVerifying || totpCode.join('').length !== 6) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isTotpVerifying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <KeyRound className="w-5 h-5 mr-2" />
              Verify Code
            </>
          )}
        </button>

        {/* Back to method selector */}
        <button
          onClick={() => {
            setShowMethodSelector(true);
            setVerificationMethod(null);
            setTotpSetupSession('');
            setTotpUri('');
            setTotpManualKey('');
            setTotpCode(['', '', '', '', '', '']);
            setTotpError('');
          }}
          className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          Use a different verification method
        </button>
      </div>
    </div>
  );

  // Render backup codes display
  const renderBackupCodes = () => (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 shadow-sm">
        <KeyRound className="w-10 h-10 text-foreground-secondary" />
      </div>
      <h2 className="display-medium text-[var(--foreground)] mb-2">Save Your Backup Codes</h2>
      <p className="body text-[var(--foreground-secondary)] mb-6">
        These codes can be used to access your account if you lose your authenticator device. Each code can only be used once.
      </p>

      {/* Backup Codes Grid */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="font-mono text-sm font-semibold text-[var(--foreground)] bg-warm-50 rounded-xl py-2 px-3 text-center"
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopyBackupCodes}
        className="button-secondary w-full py-3 px-6 rounded-xl font-medium mb-6 flex items-center justify-center gap-2"
      >
        {copiedBackupCodes ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy All Codes
          </>
        )}
      </button>

      {/* Warning */}
      <div className="bg-card border border-warm-200 rounded-2xl p-4 bg-warm-50 mb-6">
        <p className="text-sm text-foreground-secondary font-medium">
          Store these codes in a safe place. You won't be able to see them again.
        </p>
      </div>

      {/* Acknowledge & Continue */}
      <button
        onClick={handleBackupCodesAcknowledged}
        className="apple-button w-full py-4 text-lg font-medium transition-all duration-300 flex items-center justify-center"
      >
        I've Saved These Codes — Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  // Render link-based verification UI
  const renderLinkVerification = () => {
    // Show verified state with celebration
    if (isVerified) {
      return (
        <div className="text-center relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-warm-100 flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle className="w-12 h-12 text-foreground-secondary" />
          </div>

          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2 animate-fadeInUp">
            Email Verified! 🎉
          </h2>
          <p className="text-lg text-[var(--foreground-secondary)] mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Welcome to mark8ly
          </p>

          {/* Email confirmation */}
          <div className="bg-card border border-border shadow-sm rounded-2xl p-4 mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <p className="body text-[var(--foreground-secondary)] mb-2">
              Your email has been successfully verified
            </p>
            <p className="font-semibold text-[var(--primary)]">{email}</p>
          </div>

          {/* What's next section */}
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6 mb-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-[var(--primary)]" />
              What's Next?
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-secondary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">1</div>
                <span>Set up your secure password</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-secondary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/60 text-white flex items-center justify-center text-xs font-bold">2</div>
                <span>Access your admin dashboard</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-secondary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/40 text-white flex items-center justify-center text-xs font-bold">3</div>
                <span>Start building your store</span>
              </div>
            </div>
          </div>

          {/* Redirect countdown */}
          <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50 mb-6 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-center gap-2 text-foreground-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                {redirectCountdown > 0
                  ? `Continuing to password setup in ${redirectCountdown}s...`
                  : 'Redirecting...'}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => {
              const params = new URLSearchParams({ session: sessionId || '' });
              if (email) params.set('email', email);
              router.push(`/onboarding/setup-password?${params.toString()}`);
            }}
            className="apple-button w-full py-4 text-lg font-medium transition-all duration-300  flex items-center justify-center "
          >
            Continue to Set Password
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      );
    }

    // Show waiting for verification state
    return (
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 shadow-sm">
          <Mail className="w-10 h-10 text-foreground-secondary" />
        </div>
        <h2 className="display-medium text-[var(--foreground)] mb-4">Check Your Email</h2>
        <div className="bg-card border border-border shadow-sm rounded-2xl p-4 mb-6">
          <p className="body text-[var(--foreground-secondary)] leading-relaxed">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-[var(--primary)] mt-2">{email}</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50 ">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50 ">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ExternalLink className="w-5 h-5 text-[var(--primary)]" />
              <span className="body font-medium text-[var(--foreground)]">Click the link in your email</span>
            </div>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Open your email inbox and click on the verification link we sent you. The link will expire in 24 hours.
            </p>
          </div>

          <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
              Didn't receive the email?
            </p>

            <button
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              className={`button-secondary w-full py-3 px-6 rounded-xl font-medium transition-all duration-300  flex items-center justify-center ${
                (isResending || resendCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Verification Link'
                  }
                </>
              )}
            </button>
          </div>

          <div className="text-sm text-[var(--foreground-tertiary)]">
            <p>Make sure to check your spam folder if you don't see the email.</p>
          </div>
        </div>
      </div>
    );
  };

  // Render OTP-based verification UI
  const renderOTPVerification = () => (
    <>
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 shadow-sm">
          <Mail className="w-10 h-10 text-foreground-secondary" />
        </div>
        <h2 className="display-medium text-[var(--foreground)] mb-4">Verify Your Email</h2>
        <div className="bg-card border border-border shadow-sm rounded-2xl p-4 mb-6">
          <p className="body text-[var(--foreground-secondary)] leading-relaxed">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-[var(--primary)] mt-2">{email}</p>
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50 ">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-card border border-border shadow-sm border border-warm-200 rounded-2xl p-4 bg-warm-50 ">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="flex justify-center gap-3">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-16 h-16 text-center text-2xl font-bold rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20 transition-all duration-200 hover:border-[var(--primary)]/50 "
                style={{animationDelay: `${index * 0.1}s`}}
                disabled={isLoading}
              />
            ))}
          </div>

          <button
            onClick={handleManualVerify}
            disabled={isLoading || verificationCode.join('').length !== 6}
            className={`apple-button w-full py-4 text-lg font-medium transition-all duration-300  flex items-center justify-center ${
              (isLoading || verificationCode.join('').length !== 6) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Verify Email
              </>
            )}
          </button>
        </div>

        <div className="text-center space-y-6">
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
              Didn't receive the code?
            </p>

            <button
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              className={`button-secondary w-full py-3 px-6 rounded-xl font-medium transition-all duration-300  flex items-center justify-center ${
                (isResending || resendCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'
                  }
                </>
              )}
            </button>
          </div>

          <div className="bg-card border border-border shadow-sm rounded-2xl p-4">
            <div className="flex items-center justify-center gap-2 text-[var(--foreground-tertiary)]">
              <Shield className="w-4 h-4" />
              {codeExpiry > 0 ? (
                <span className="text-sm">
                  Code expires in {Math.floor(codeExpiry / 60)}:{String(codeExpiry % 60).padStart(2, '0')}
                </span>
              ) : (
                <span className="text-sm text-foreground-secondary">Code has expired</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Show loading state while rehydrating
  if (isRehydrating) {
    return <VerifyEmailLoading />;
  }

  // Show congratulations page if onboarding was just completed
  if (showCongratulations && completionData) {
    return <CongratulationsPage completionData={completionData} idleCountdown={idleCountdown} />;
  }

  // Show welcome page if no valid session/email
  if (showWelcomePage) {
    return <WelcomePage email={emailFromParams || ''} idleCountdown={idleCountdown} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Page Header */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">
            {isVerified ? 'Account Verified!' : 'Email Verification'}
          </h1>
          <p className="body-large text-[var(--foreground-secondary)]">
            {isVerified ? 'Your journey with mark8ly begins now' : 'Secure your account with email verification'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className={`bg-card border border-border shadow-sm rounded-3xl p-12 animate-fadeInUp max-w-lg mx-auto ${
          isVerified ? 'border-warm-300' : 'border-border'
        }`}>
          {showMethodSelector ? (
            renderMethodSelector()
          ) : verificationMethod === 'totp' && !totpConfirmed ? (
            renderTotpSetup()
          ) : verificationMethod === 'totp' && totpConfirmed && !backupCodesAcknowledged ? (
            renderBackupCodes()
          ) : isSendingInitial || verificationMethod === null ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 animate-pulse shadow-sm">
                <Loader2 className="w-10 h-10 text-foreground-secondary animate-spin" />
              </div>
              <h2 className="display-medium text-[var(--foreground)] mb-4">Sending Verification</h2>
              <p className="body text-[var(--foreground-secondary)]">Please wait...</p>
            </div>
          ) : verificationMethod === 'link' ? (
            renderLinkVerification()
          ) : (
            renderOTPVerification()
          )}
        </div>
      </div>
    </div>
  );
}
