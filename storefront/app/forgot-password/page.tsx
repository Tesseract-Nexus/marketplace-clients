'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { initiateForgotPassword } from '@/lib/api/auth';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export default function ForgotPasswordPage() {
  const { tenant, settings } = useTenant();
  const getNavPath = useNavPath();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      // Redirect to Keycloak's password reset flow
      // This will take the user to Keycloak where they can reset their password
      const returnTo = getNavPath('/login');
      // Pass tenant context for multi-tenant authentication
      initiateForgotPassword({
        returnTo,
        email: email || undefined,
        tenantId: tenant?.id,
        tenantSlug: tenant?.slug,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate password reset');
      setIsLoading(false);
    }
  };

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
              <TranslatedUIText text="Enter your email and we'll help you reset your password" />
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
                  <TranslatedUIText text="Redirecting..." />
                </>
              ) : (
                <TranslatedUIText text="Reset Password" />
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
