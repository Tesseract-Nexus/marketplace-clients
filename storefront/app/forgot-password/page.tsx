'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { directRequestPasswordReset } from '@/lib/api/auth';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export default function ForgotPasswordPage() {
  const { tenant, settings } = useTenant();
  const getNavPath = useNavPath();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!tenant?.slug) {
      setError('Store configuration error. Please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await directRequestPasswordReset(email, tenant.slug);

      // Always show success message (security: don't reveal if email exists)
      setSuccess(true);
    } catch (err) {
      // Still show success for security (don't reveal if email exists)
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl border shadow-lg p-8">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: `${settings.primaryColor}15` }}
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                <TranslatedUIText text="Check Your Email" />
              </h1>
              <p className="text-muted-foreground">
                <TranslatedUIText text="If an account exists with this email, you will receive a password reset link shortly." />
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                <TranslatedUIText text="The link will expire in 1 hour." />
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="tenant-gradient"
                className="w-full"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
              >
                <TranslatedUIText text="Send Another Link" />
              </Button>

              <Link href={getNavPath('/login')} className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <TranslatedUIText text="Back to Sign In" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border shadow-lg p-8">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: `${settings.primaryColor}15` }}
            >
              <Mail className="h-8 w-8 text-tenant-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              <TranslatedUIText text="Forgot Password?" />
            </h1>
            <p className="text-muted-foreground mt-2">
              <TranslatedUIText text="Enter your email and we'll send you a link to reset your password" />
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                <TranslatedUIText text="Email Address" />
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="tenant-gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <TranslatedUIText text="Sending..." />
                </>
              ) : (
                <TranslatedUIText text="Send Reset Link" />
              )}
            </Button>
          </form>

          <Link
            href={getNavPath('/login')}
            className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <TranslatedUIText text="Back to Sign In" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
