'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui';
import { Button } from '@workspace/ui';
import { Input } from '@workspace/ui';
import { Alert, AlertDescription } from '@workspace/ui';
import Header from '../../../components/Header';
import { Loader2, Mail, RefreshCw, Shield, CheckCircle, ExternalLink, PartyPopper, Gift, ArrowRight, Sparkles, Home, Store, Rocket, Clock, User } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/store/onboarding-store';
import { onboardingApi } from '../../../lib/api/onboarding';
import { analytics } from '../../../lib/analytics/posthog';
import { Confetti, FloralCelebration } from '../../../components/Confetti';

type VerificationMethod = 'otp' | 'link' | null;

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
        <div className="glass-strong rounded-3xl p-12 border border-[var(--border)]/20 animate-fadeInUp max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-pulse shadow-2xl">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h2 className="display-medium text-[var(--foreground)] mb-4">Loading...</h2>
            <p className="body text-[var(--foreground-secondary)]">Please wait...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Welcome page component for when no valid session exists
function WelcomePage({ email, idleCountdown }: { email?: string; idleCountdown: number }) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(true);

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

      {/* Celebration effects */}
      <Confetti active={showCelebration} duration={4000} pieceCount={100} />
      <FloralCelebration active={showCelebration} />

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[var(--apple-purple)]/20 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[var(--apple-pink)]/15 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--apple-blue)]/10 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Personalized Greeting */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-8 animate-fadeInUp">
            <Sparkles className="w-4 h-4 text-[var(--apple-yellow)]" />
            <span className="text-sm font-medium text-[var(--foreground-secondary)]">
              {greeting()}, {getFirstName(email)}
            </span>
          </div>

          <h1 className="display-large text-[var(--foreground)] mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[var(--apple-purple)] via-[var(--apple-pink)] to-[var(--apple-orange)] bg-clip-text text-transparent">
              Tesseract Hub
            </span>
          </h1>

          <p className="body-large text-[var(--foreground-secondary)] max-w-xl mx-auto mb-12 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Your journey to building an amazing online store starts here. We're thrilled to have you join our community of successful merchants.
          </p>
        </div>
      </div>

      {/* Welcome Cards */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Quick Start */}
          <div className="glass-strong rounded-3xl p-8 border border-[var(--border)]/20 hover:border-[var(--apple-blue)]/30 transition-all duration-300 hover:scale-105 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 shadow-lg">
              <Rocket className="w-7 h-7 text-white" />
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
          <div className="glass-strong rounded-3xl p-8 border border-[var(--border)]/20 hover:border-[var(--apple-purple)]/30 transition-all duration-300 hover:scale-105 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--apple-purple)] to-[var(--apple-pink)] flex items-center justify-center mb-6 shadow-lg">
              <Store className="w-7 h-7 text-white" />
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
          <div className="glass-strong rounded-3xl p-8 border border-[var(--border)]/20 hover:border-[var(--apple-green)]/30 transition-all duration-300 hover:scale-105 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--apple-green)] to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
            <h3 className="headline text-[var(--foreground)] mb-2">Get Support</h3>
            <p className="body text-[var(--foreground-secondary)] mb-6">
              Our team is here to help you succeed every step of the way.
            </p>
            <button
              onClick={() => window.open('mailto:support@tesserix.app', '_blank')}
              className="button-secondary w-full py-3 text-sm font-medium"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Idle Timer Notice */}
      {idleCountdown > 0 && idleCountdown < 60 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-strong rounded-full px-6 py-3 border border-[var(--border)]/20 animate-fadeInUp flex items-center gap-3">
          <Clock className="w-4 h-4 text-[var(--foreground-secondary)]" />
          <span className="text-sm text-[var(--foreground-secondary)]">
            Redirecting to home in {idleCountdown}s
          </span>
        </div>
      )}

      {/* Auto-redirect progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-[var(--border)]/20">
        <div
          className="h-full bg-gradient-to-r from-[var(--apple-purple)] to-[var(--apple-pink)] transition-all duration-1000 ease-linear"
          style={{ width: `${((IDLE_TIMEOUT_MS / 1000 - idleCountdown) / (IDLE_TIMEOUT_MS / 1000)) * 100}%` }}
        />
      </div>

      {/* Quick Action Button */}
      <div className="fixed bottom-8 right-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
        <button
          onClick={() => router.push('/')}
          className="glass-strong rounded-full p-4 border border-[var(--border)]/20 hover:border-[var(--apple-blue)]/30 transition-all duration-300 hover:scale-110 group shadow-xl"
        >
          <Home className="w-6 h-6 text-[var(--foreground-secondary)] group-hover:text-[var(--apple-blue)] transition-colors" />
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
    nextStep,
  } = useOnboardingStore();

  // Allow session ID from URL params or store
  const sessionId = searchParams?.get('session') || searchParams?.get('session_id') || storeSessionId;
  const emailFromParams = searchParams?.get('email');

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWelcomePage, setShowWelcomePage] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_TIMEOUT_MS / 1000);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasInitializedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Get email from store or URL params
  const email = contactDetails.email || emailFromParams || '';

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

  // Idle timer countdown for welcome page
  useEffect(() => {
    if (!showWelcomePage) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
      setIdleCountdown(remaining);

      if (remaining <= 0) {
        router.replace('/');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWelcomePage, router]);

  // Show welcome page instead of crashing when no valid session
  useEffect(() => {
    if (!email || !sessionId) {
      setShowWelcomePage(true);
    }
  }, [email, sessionId]);

  // Check verification method on mount and send verification
  useEffect(() => {
    // Handle case when page is visited directly without session
    if (!email || !sessionId || showWelcomePage) {
      return; // Will show welcome page via the effect above
    }

    // Prevent duplicate sends in React Strict Mode
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const initializeVerification = async () => {
      // First check which verification method is configured
      try {
        const methodResponse = await onboardingApi.getVerificationMethod();
        setVerificationMethod(methodResponse.method);

        // Then send the verification
        await sendVerification(methodResponse.method);
      } catch (error) {
        // Default to OTP if we can't determine the method
        console.error('Failed to get verification method:', error);
        setVerificationMethod('otp');
        await sendVerification('otp');
      }
    };

    initializeVerification();
  }, [contactDetails.email, sessionId, router, showWelcomePage]);

  const sendVerification = async (method: VerificationMethod) => {
    if (!contactDetails.email || !sessionId) {
      setError('Email not found. Please go back and complete the contact details step.');
      return;
    }

    setIsSendingInitial(true);
    try {
      const result = await onboardingApi.sendEmailVerification(sessionId, contactDetails.email);

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
        email: contactDetails.email,
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
              email: contactDetails.email,
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [codeExpiry, contactDetails.email]);

  // Listen for real-time verification events via SSE (Server-Sent Events)
  // This replaces polling with instant push notifications via NATS
  useEffect(() => {
    if (verificationMethod !== 'link' || !sessionId || !contactDetails.email || isVerified) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectSSE = () => {
      // Connect to the SSE endpoint via BFF proxy
      const sseUrl = `/api/onboarding/${sessionId}/events`;
      console.log('[SSE] Connecting to', sseUrl);

      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        console.log('[SSE] Connected to session events');
        reconnectAttempts = 0; // Reset on successful connection
      };

      // Listen for session.completed event (triggered when email is verified)
      eventSource.addEventListener('session.completed', (event) => {
        console.log('[SSE] Received session.completed event:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.verified || data.session_id === sessionId) {
            setIsVerified(true);
            setEmailVerified(true);
            setSuccess('Email verified successfully!');

            // Track verification success
            analytics.onboarding.verificationSucceeded({
              email: contactDetails.email,
              method: 'link',
            });

            // Close the SSE connection
            eventSource?.close();
          }
        } catch (error) {
          console.error('[SSE] Failed to parse event data:', error);
        }
      });

      // Also listen for session.verified event (alternative event name)
      eventSource.addEventListener('session.verified', (event) => {
        console.log('[SSE] Received session.verified event:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.verified || data.session_id === sessionId) {
            setIsVerified(true);
            setEmailVerified(true);
            setSuccess('Email verified successfully!');

            analytics.onboarding.verificationSucceeded({
              email: contactDetails.email,
              method: 'link',
            });

            eventSource?.close();
          }
        } catch (error) {
          console.error('[SSE] Failed to parse event data:', error);
        }
      });

      // Handle connection event (server sends this on connect)
      eventSource.addEventListener('connected', (event) => {
        console.log('[SSE] Connection confirmed:', event.data);
      });

      // Handle ping events (keepalive)
      eventSource.addEventListener('ping', () => {
        console.log('[SSE] Ping received');
      });

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        eventSource?.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts && !isVerified) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          setTimeout(connectSSE, delay);
        } else {
          console.log('[SSE] Max reconnect attempts reached, falling back to polling');
          // Fall back to polling if SSE fails
          startPollingFallback();
        }
      };
    };

    // Fallback polling function if SSE fails
    const startPollingFallback = () => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await onboardingApi.getVerificationStatus(sessionId, contactDetails.email);
          if (status.verified) {
            setIsVerified(true);
            setEmailVerified(true);
            setSuccess('Email verified successfully!');
            clearInterval(pollInterval);

            analytics.onboarding.verificationSucceeded({
              email: contactDetails.email,
              method: 'link',
            });
          }
        } catch (error) {
          console.log('[Polling] Checking verification status...');
        }
      }, 3000);

      // Store interval ID for cleanup
      return () => clearInterval(pollInterval);
    };

    // Start SSE connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Cleaning up connection');
      eventSource?.close();
    };
  }, [verificationMethod, sessionId, contactDetails.email, isVerified, setEmailVerified]);

  // Auto-redirect after verification success
  useEffect(() => {
    if (!isVerified) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to password setup
          const params = new URLSearchParams({ session: sessionId || '' });
          if (contactDetails.email) params.set('email', contactDetails.email);
          router.push(`/onboarding/setup-password?${params.toString()}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerified, sessionId, contactDetails.email, router]);

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

    if (!contactDetails.email) {
      setError('Email not found. Please go back and complete the contact details step.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onboardingApi.verifyEmail(sessionId, contactDetails.email, code);

      if (result.verified) {
        setEmailVerified(true);
        setSuccess('Email verified successfully!');
        nextStep();

        // Track verification success
        analytics.onboarding.verificationSucceeded({
          email: contactDetails.email,
        });

        // Complete the onboarding session
        try {
          await onboardingApi.completeOnboarding(sessionId);
        } catch (error) {
          console.error('Failed to complete onboarding:', error);
          // Continue anyway since verification was successful
        }

        // Redirect to admin portal welcome page
        // Note: Welcome page uses dev-admin since it's session-based, not tenant-specific
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
        const adminUrl = `https://dev-admin.${baseDomain}`;
        setTimeout(() => {
          window.location.href = `${adminUrl}/welcome/${sessionId}`;
        }, 1500);
      } else {
        const errorMsg = result.message || 'Invalid verification code. Please try again.';
        setError(errorMsg);

        // Track verification failure
        analytics.onboarding.verificationFailed(errorMsg, {
          email: contactDetails.email,
        });

        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      setError(errorMessage);

      // Track verification error
      analytics.onboarding.verificationFailed(errorMessage, {
        email: contactDetails.email,
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

    if (!contactDetails.email) {
      setError('Email not found. Please go back and complete the contact details step.');
      return;
    }

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const result = await onboardingApi.resendVerificationCode(sessionId, contactDetails.email);

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
        email: contactDetails.email,
        trigger: 'resend',
        method: verificationMethod || 'otp',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification. Please try again.';
      setError(errorMessage);

      // Track rate limit if detected
      if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
        analytics.onboarding.rateLimitHit({
          email: contactDetails.email,
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

  // Trigger celebration when verified
  useEffect(() => {
    if (isVerified) {
      setShowCelebration(true);
    }
  }, [isVerified]);

  // Render link-based verification UI
  const renderLinkVerification = () => {
    // Show verified state with celebration
    if (isVerified) {
      return (
        <div className="text-center relative">
          {/* Celebration badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[var(--apple-green)] to-emerald-500 rounded-full text-white text-sm font-medium flex items-center gap-2 animate-bounce shadow-lg">
            <PartyPopper className="w-4 h-4" />
            Verified!
          </div>

          {/* Success icon with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-[var(--apple-green)] blur-xl opacity-40 animate-pulse" />
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[var(--apple-green)] to-emerald-600 flex items-center justify-center mb-6 animate-scaleIn shadow-2xl relative">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2 animate-fadeInUp">
            Email Verified! 🎉
          </h2>
          <p className="text-lg text-[var(--foreground-secondary)] mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Welcome to Tesserix
          </p>

          {/* Email confirmation */}
          <div className="glass-subtle rounded-2xl p-4 mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <p className="body text-[var(--foreground-secondary)] mb-2">
              Your email has been successfully verified
            </p>
            <p className="font-semibold text-[var(--primary)]">{contactDetails.email || emailFromParams}</p>
          </div>

          {/* What's next section */}
          <div className="glass-subtle rounded-2xl p-6 mb-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
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
          <div className="glass-subtle border border-[var(--apple-green)]/30 rounded-2xl p-4 bg-[var(--apple-green)]/5 mb-6 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-center gap-2 text-[var(--apple-green)]">
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
              if (contactDetails.email) params.set('email', contactDetails.email);
              router.push(`/onboarding/setup-password?${params.toString()}`);
            }}
            className="apple-button w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center animate-glow"
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
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-float shadow-2xl">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h2 className="display-medium text-[var(--foreground)] mb-4">Check Your Email</h2>
        <div className="glass-subtle rounded-2xl p-4 mb-6">
          <p className="body text-[var(--foreground-secondary)] leading-relaxed">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-[var(--primary)] mt-2">{contactDetails.email}</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="glass-subtle border border-[var(--apple-red)]/30 rounded-2xl p-4 bg-[var(--apple-red)]/5 animate-scaleIn">
              <div className="flex items-center gap-2 text-[var(--apple-red)]">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="glass-subtle border border-[var(--apple-green)]/30 rounded-2xl p-4 bg-[var(--apple-green)]/5 animate-scaleIn">
              <div className="flex items-center gap-2 text-[var(--apple-green)]">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          <div className="glass-subtle rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ExternalLink className="w-5 h-5 text-[var(--primary)]" />
              <span className="body font-medium text-[var(--foreground)]">Click the link in your email</span>
            </div>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Open your email inbox and click on the verification link we sent you. The link will expire in 24 hours.
            </p>
          </div>

          <div className="glass-subtle rounded-2xl p-6">
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
              Didn't receive the email?
            </p>

            <button
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              className={`button-secondary w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center ${
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
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-float shadow-2xl">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h2 className="display-medium text-[var(--foreground)] mb-4">Verify Your Email</h2>
        <div className="glass-subtle rounded-2xl p-4 mb-6">
          <p className="body text-[var(--foreground-secondary)] leading-relaxed">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-[var(--primary)] mt-2">{contactDetails.email}</p>
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="glass-subtle border border-[var(--apple-red)]/30 rounded-2xl p-4 bg-[var(--apple-red)]/5 animate-scaleIn">
            <div className="flex items-center gap-2 text-[var(--apple-red)]">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="glass-subtle border border-[var(--apple-green)]/30 rounded-2xl p-4 bg-[var(--apple-green)]/5 animate-scaleIn">
            <div className="flex items-center gap-2 text-[var(--apple-green)]">
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
                className="w-16 h-16 text-center text-2xl font-bold rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20 transition-all duration-200 hover:border-[var(--primary)]/50 animate-scaleIn"
                style={{animationDelay: `${index * 0.1}s`}}
                disabled={isLoading}
              />
            ))}
          </div>

          <button
            onClick={handleManualVerify}
            disabled={isLoading || verificationCode.join('').length !== 6}
            className={`apple-button w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center ${
              (isLoading || verificationCode.join('').length !== 6) ? 'opacity-50 cursor-not-allowed' : 'animate-glow'
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
          <div className="glass-subtle rounded-2xl p-6">
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
              Didn't receive the code?
            </p>

            <button
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              className={`button-secondary w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center ${
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

          <div className="glass-subtle rounded-2xl p-4">
            <div className="flex items-center justify-center gap-2 text-[var(--foreground-tertiary)]">
              <Shield className="w-4 h-4" />
              {codeExpiry > 0 ? (
                <span className="text-sm">
                  Code expires in {Math.floor(codeExpiry / 60)}:{String(codeExpiry % 60).padStart(2, '0')}
                </span>
              ) : (
                <span className="text-sm text-[var(--apple-red)]">Code has expired</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Show welcome page if no valid session/email
  if (showWelcomePage) {
    return <WelcomePage email={emailFromParams || ''} idleCountdown={idleCountdown} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Celebration effects */}
      {showCelebration && (
        <>
          <Confetti active={showCelebration} duration={6000} pieceCount={200} />
          <FloralCelebration active={showCelebration} />
        </>
      )}

      {/* Page Header */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">
            {isVerified ? 'Account Verified!' : 'Email Verification'}
          </h1>
          <p className="body-large text-[var(--foreground-secondary)]">
            {isVerified ? 'Your journey with Tesserix begins now' : 'Secure your account with email verification'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[var(--apple-gray-5)] to-transparent rounded-full blur-3xl opacity-30 animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[var(--apple-gray-4)] to-transparent rounded-full blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}} />
          {isVerified && (
            <>
              <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-[var(--apple-green)]/20 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" />
              <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl opacity-40 animate-pulse" style={{animationDelay: '0.5s'}} />
            </>
          )}
        </div>

        <div className={`glass-strong rounded-3xl p-12 border animate-fadeInUp max-w-lg mx-auto ${
          isVerified
            ? 'border-[var(--apple-green)]/30 shadow-[0_0_60px_rgba(34,197,94,0.15)]'
            : 'border-[var(--border)]/20'
        }`}>
          {isSendingInitial || verificationMethod === null ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-pulse shadow-2xl">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
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
