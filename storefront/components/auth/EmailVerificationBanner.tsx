'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { sendVerificationEmail } from '@/lib/api/verification';

interface EmailVerificationBannerProps {
  onVerified?: () => void;
  variant?: 'banner' | 'inline';
}

export function EmailVerificationBanner({
  onVerified,
  variant = 'banner',
}: EmailVerificationBannerProps) {
  const { tenant } = useTenant();
  const { customer, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if email is already verified or user is not logged in
  if (!customer || !isAuthenticated || customer.emailVerified || isDismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    if (!tenant) return;

    setIsLoading(true);
    setError(null);

    try {
      await sendVerificationEmail(
        tenant.id,
        tenant.storefrontId,
        customer.id
      );
      setIsSent(true);
      setTimeout(() => setIsSent(false), 5000); // Reset after 5 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Verify your email to complete checkout
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              A verification link was sent to <strong>{customer.email}</strong>
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                onClick={handleResendEmail}
                disabled={isLoading || isSent}
                className="btn-tenant-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : isSent ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Email Sent!
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
      >
        <div className="container-tenant py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-medium">Please verify your email.</span>{' '}
                  Check your inbox at <strong>{customer.email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs text-red-600">{error}</span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendEmail}
                disabled={isLoading || isSent}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSent ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Sent
                  </>
                ) : (
                  'Resend'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
                className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
