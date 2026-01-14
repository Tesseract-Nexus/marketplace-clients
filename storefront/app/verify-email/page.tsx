'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { verifyEmail, sendVerificationEmail } from '@/lib/api/verification';

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const { customer, accessToken, setCustomer } = useAuthStore();

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    if (!tenant) return;

    const verify = async () => {
      try {
        const result = await verifyEmail(tenant.id, tenant.storefrontId, token);
        setStatus('success');

        // Update the customer in auth store if logged in
        if (customer && result.customer.id === customer.id) {
          setCustomer({ ...customer, emailVerified: true });
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    };

    verify();
  }, [token, tenant, customer, setCustomer]);

  const handleResendEmail = async () => {
    if (!tenant || !customer || !accessToken) return;

    setIsResending(true);
    setError(null);

    try {
      await sendVerificationEmail(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        accessToken
      );
      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
            <p className="text-muted-foreground mb-6">
              Your email has been successfully verified. You can now access all features of your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="btn-tenant-primary">
                <Link href={getNavPath('/checkout')}>
                  Continue to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={getNavPath('/account')}>Go to Account</Link>
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6"
            >
              <X className="h-10 w-10 text-red-600 dark:text-red-400" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-2">
              {error || 'We could not verify your email. The link may have expired or is invalid.'}
            </p>
            {customer && accessToken && (
              <div className="mt-6">
                {resendSuccess ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span>Verification email sent!</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="btn-tenant-primary"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send New Verification Email
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href={getNavPath('/')}>Go Home</Link>
              </Button>
            </div>
          </>
        )}

        {status === 'no-token' && (
          <>
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a verification link to your email address. Click the link in the email to verify your account.
            </p>
            {customer && accessToken && (
              <div className="mb-6">
                {resendSuccess ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span>Verification email sent to {customer.email}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Didn't receive the email?
                    </p>
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending}
                      variant="outline"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
            <Button asChild variant="outline">
              <Link href={getNavPath('/')}>Go Home</Link>
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
