'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2, XCircle, RefreshCw, ArrowLeft, Sparkles, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { OTPInput } from '@/components/auth/OTPInput';
import { sendOTP, verifyOTP, resendOTP, getOTPStatus } from '@/lib/api/otp';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 4.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

// Resend cooldown in seconds
const RESEND_COOLDOWN = 60;
// Max resend attempts
const MAX_RESEND_ATTEMPTS = 5;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const getNavPath = useNavPath();

  // Get email from URL params
  const emailParam = searchParams.get('email');

  const [email] = useState(emailParam || '');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Resend state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Check if already verified or send initial OTP
  useEffect(() => {
    const initializeVerification = async () => {
      if (!email || !tenant?.slug || hasInitialized) return;
      setHasInitialized(true);

      // Check OTP status
      const status = await getOTPStatus(email, 'customer_email_verification');
      if (status.success && status.data.isVerified) {
        setIsVerified(true);
        setSuccessMessage('Your email has already been verified!');
        // Redirect after showing success
        setTimeout(() => {
          router.push(getNavPath('/account'));
        }, 2000);
        return;
      }

      // If there's a pending code, don't send a new one
      if (status.success && status.data.pendingCode) {
        setRemainingAttempts(status.data.attemptsLeft);
        setResendCooldown(RESEND_COOLDOWN);
        return;
      }

      // Send initial OTP
      setIsSending(true);
      try {
        const result = await sendOTP({
          email,
          purpose: 'customer_email_verification',
          businessName: tenant?.name || undefined,
          tenantSlug: tenant?.slug,
        });

        if (result.success) {
          setSuccessMessage('Verification code sent to your email');
          setResendCooldown(RESEND_COOLDOWN);
        } else {
          setError(result.message || 'Failed to send verification code');
        }
      } catch {
        setError('Failed to send verification code. Please try again.');
      } finally {
        setIsSending(false);
      }
    };

    initializeVerification();
  }, [email, tenant?.slug, tenant?.name, router, getNavPath, hasInitialized]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle OTP completion
  const handleOTPComplete = useCallback(async (code: string) => {
    if (!email || !tenant?.slug) return;

    setIsVerifying(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await verifyOTP({
        email,
        code,
        purpose: 'customer_email_verification',
      });

      if (result.success && result.verified) {
        setIsVerified(true);
        setSuccessMessage('Email verified successfully! Redirecting...');

        // Redirect to account page after verification
        setTimeout(() => {
          router.push(getNavPath('/account'));
        }, 2000);
      } else {
        setError(result.message || 'Invalid verification code');
        setRemainingAttempts(result.remainingAttempts ?? null);
        setOtp(''); // Clear OTP on error
      }
    } catch {
      setError('Verification failed. Please try again.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  }, [email, tenant?.slug, router, getNavPath]);

  // Handle resend
  const handleResend = async () => {
    if (resendCooldown > 0 || resendAttempts >= MAX_RESEND_ATTEMPTS || !email || !tenant?.slug) {
      return;
    }

    setIsSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await resendOTP({
        email,
        purpose: 'customer_email_verification',
        businessName: tenant?.name || undefined,
        tenantSlug: tenant?.slug,
      });

      if (result.success) {
        setResendAttempts((prev) => prev + 1);
        setResendCooldown(RESEND_COOLDOWN);
        setSuccessMessage('A new verification code has been sent to your email');
        setOtp(''); // Clear previous OTP
      } else {
        setError(result.message || 'Failed to resend verification code');
      }
    } catch {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? mins + ':' + secs.toString().padStart(2, '0') : secs + 's';
  };

  // No email provided
  if (!email) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            <TranslatedUIText text="Email Required" />
          </h1>
          <p className="text-muted-foreground mb-6">
            <TranslatedUIText text="Please register first to verify your email address." />
          </p>
          <Button variant="tenant-gradient" onClick={() => router.push(getNavPath('/register'))}>
            <TranslatedUIText text="Go to Register" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/5 via-background to-[var(--tenant-secondary)]/5" />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--tenant-primary)' }}
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 1.2 }}
        className="absolute bottom-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--tenant-secondary)' }}
      />

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute top-1/4 left-1/4"
      >
        <Sparkles className="h-5 w-5 text-tenant-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-1/3 right-1/4"
      >
        <Shield className="h-6 w-6 text-tenant-secondary" />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="bg-card/80 backdrop-blur-sm rounded-2xl border shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300"
        >
          <AnimatePresence mode="wait">
            {isVerified ? (
              // Success state
              <motion.div
                key="success"
                variants={successVariants}
                initial="hidden"
                animate="visible"
                className="text-center py-8"
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </motion.div>
                <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  <TranslatedUIText text="Email Verified!" />
                </h1>
                <p className="text-muted-foreground">
                  {successMessage || <TranslatedUIText text="Your email has been successfully verified." />}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <TranslatedUIText text="Redirecting to your account..." />
                </div>
              </motion.div>
            ) : (
              // Verification form
              <motion.div key="form">
                {/* Back link */}
                <motion.div variants={itemVariants} className="mb-6">
                  <Link
                    href={getNavPath('/register')}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <TranslatedUIText text="Back to registration" />
                  </Link>
                </motion.div>

                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-8">
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Mail className="h-8 w-8 text-tenant-primary" />
                  </motion.div>
                  <h1 className="text-2xl font-bold mb-2">
                    <TranslatedUIText text="Verify Your Email" />
                  </h1>
                  <p className="text-muted-foreground">
                    <TranslatedUIText text="We've sent a 6-digit code to" />
                  </p>
                  <p className="font-medium text-foreground mt-1">{email}</p>
                </motion.div>

                {/* Messages */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                    >
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {error}
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <span className="ml-auto text-xs">
                          {remainingAttempts} <TranslatedUIText text="attempts left" />
                        </span>
                      )}
                    </motion.div>
                  )}
                  {successMessage && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="mb-6 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* OTP Input */}
                <motion.div variants={itemVariants} className="mb-6">
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleOTPComplete}
                    disabled={isVerifying || isSending}
                    error={!!error}
                  />
                </motion.div>

                {/* Verify button (for manual submission) */}
                <motion.div variants={itemVariants} className="mb-6">
                  <Button
                    variant="tenant-gradient"
                    size="lg"
                    className="w-full"
                    disabled={otp.length !== 6 || isVerifying || isSending}
                    onClick={() => handleOTPComplete(otp)}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <TranslatedUIText text="Verifying..." />
                      </>
                    ) : (
                      <TranslatedUIText text="Verify Email" />
                    )}
                  </Button>
                </motion.div>

                {/* Resend section */}
                <motion.div variants={itemVariants} className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    <TranslatedUIText text="Didn't receive the code?" />
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resendCooldown > 0 || resendAttempts >= MAX_RESEND_ATTEMPTS || isSending}
                    onClick={handleResend}
                    className="text-tenant-primary hover:text-tenant-primary/80"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <TranslatedUIText text="Sending..." />
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        <span><TranslatedUIText text="Resend in" /> {formatCooldown(resendCooldown)}</span>
                      </>
                    ) : resendAttempts >= MAX_RESEND_ATTEMPTS ? (
                      <TranslatedUIText text="Maximum resend attempts reached" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        <TranslatedUIText text="Resend Code" />
                      </>
                    )}
                  </Button>

                  {resendAttempts > 0 && resendAttempts < MAX_RESEND_ATTEMPTS && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {MAX_RESEND_ATTEMPTS - resendAttempts} <TranslatedUIText text="resend attempts remaining" />
                    </p>
                  )}
                </motion.div>

                {/* Help text */}
                <motion.div variants={itemVariants} className="mt-8 pt-6 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    <TranslatedUIText text="Check your spam folder if you don't see the email." />
                    <br />
                    <TranslatedUIText text="The code expires in 2 hours." />
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
