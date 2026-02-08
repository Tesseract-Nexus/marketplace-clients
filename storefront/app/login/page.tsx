'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles, Smartphone, Shield, ArrowLeft, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { initiateLogin, getSession, directLogin, verifyMfa, DirectAuthResponse, checkDeactivatedAccount, reactivateAccount, authenticateWithPasskey, isPasskeySupported } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const { login, updateCustomer, setLoading, isLoading, isAuthenticated } = useAuthStore();
  const { mergeGuestCart } = useCartStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Passkey state
  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaSession, setMfaSession] = useState('');
  const [mfaMethods, setMfaMethods] = useState<string[]>([]);
  const [activeMfaMethod, setActiveMfaMethod] = useState<'totp' | 'email'>('email');
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [mfaError, setMfaError] = useState('');
  const [isMfaVerifying, setIsMfaVerifying] = useState(false);
  const mfaCodeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reactivation state
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [reactivateData, setReactivateData] = useState<{
    daysUntilPurge?: number;
    purgeDate?: string;
  } | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  // Fetch full customer profile (phone, dateOfBirth, etc.) from customers-service
  // and merge into auth store. Called after successful login since AuthSessionProvider's
  // fetchCustomerProfile won't re-run after client-side navigation (hasCheckedSession ref).
  const fetchAndUpdateProfile = async (tenantId?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (tenantId) headers['X-Tenant-ID'] = tenantId;
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
        headers,
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.success && result.data) {
        updateCustomer({
          phone: result.data.phone,
          dateOfBirth: result.data.dateOfBirth,
          country: result.data.country,
          countryCode: result.data.countryCode,
          totalOrders: result.data.totalOrders,
          totalSpent: result.data.totalSpent,
          ...(result.data.firstName && { firstName: result.data.firstName }),
          ...(result.data.lastName && { lastName: result.data.lastName }),
          ...(result.data.createdAt && { createdAt: result.data.createdAt }),
        });
      }
    } catch (err) {
      console.warn('[LoginPage] Failed to fetch customer profile:', err);
    }
  };

  // Wait for Zustand store to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check if passkeys are supported on mount
  useEffect(() => {
    setIsPasskeyAvailable(isPasskeySupported());
  }, []);

  // Redirect to account if already authenticated (after hydration)
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      setIsRedirecting(true);
      router.replace(getNavPath('/account'));
    }
  }, [isHydrated, isAuthenticated, router, getNavPath]);

  // Show loading state while checking authentication or redirecting
  if (!isHydrated || isRedirecting) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
          <p className="text-muted-foreground">
            {isRedirecting ? <TranslatedUIText text="Redirecting to your account..." /> : <TranslatedUIText text="Loading..." />}
          </p>
        </div>
      </div>
    );
  }

  const handleSocialLogin = (provider: string) => {
    // Use auth-bff OIDC flow with Keycloak IDP hint for social login
    const returnTo = getNavPath('/account');
    // Pass tenant context for multi-tenant authentication
    initiateLogin({
      returnTo,
      provider,
      tenantId: tenant?.id,
      tenantSlug: tenant?.slug,
    });
  };

  const handlePasskeyLogin = async () => {
    setError('');
    setIsPasskeyLoading(true);

    try {
      const result = await authenticateWithPasskey();

      if (result.success && result.authenticated && result.user) {
        login({
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name || '',
          lastName: result.user.last_name || '',
          phone: '',
          createdAt: new Date().toISOString(),
          tenantId: result.user.tenant_id,
        });

        await fetchAndUpdateProfile(result.user.tenant_id);
        router.push(getNavPath('/account'));
      } else if (result.error === 'CANCELLED') {
        // User cancelled — do nothing
      } else {
        setError(result.message || 'Passkey authentication failed.');
      }
    } catch {
      setError('Passkey authentication failed. Please try again.');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Use direct login (custom UI with Keycloak backend)
    // This validates credentials via auth-bff without redirecting to Keycloak UI
    try {
      if (!tenant?.slug) {
        setError('Unable to determine store. Please try again.');
        setLoading(false);
        return;
      }

      const result = await directLogin(email, password, tenant.slug, { rememberMe });

      if (result.success && result.authenticated) {
        // Login successful - update auth store with user info
        if (result.user) {
          login({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || '',
            lastName: result.user.last_name || '',
            phone: '',
            createdAt: new Date().toISOString(),
            tenantId: result.user.tenant_id,
          });
          await fetchAndUpdateProfile(result.user.tenant_id);
        }

        // Note: Cart merging happens server-side via session cookies
        // The mergeGuestCart API call would require tenantId, storefrontId, customerId, accessToken
        // but direct auth uses HTTP-only cookies, so we skip explicit cart merge here
        // The next cart load will sync with the authenticated session

        // Redirect to account page
        router.push(getNavPath('/account'));
      } else if (result.mfa_required) {
        // MFA required - show MFA verification UI
        setMfaSession(result.mfa_session || '');
        setMfaMethods(result.mfa_methods || ['email']);
        // Default to TOTP if available, otherwise email
        const defaultMethod = result.mfa_methods?.includes('totp') ? 'totp' : 'email';
        setActiveMfaMethod(defaultMethod as 'totp' | 'email');
        setMfaStep(true);
        setMfaCode(['', '', '', '', '', '']);
        setMfaError('');
        setLoading(false);
        // Auto-focus first code input after render
        setTimeout(() => mfaCodeRefs.current[0]?.focus(), 100);
      } else {
        // Login failed - check if account is deactivated
        if (result.error === 'INVALID_CREDENTIALS' || result.error === 'ACCOUNT_DEACTIVATED') {
          // Check for deactivated account
          const deactivatedCheck = await checkDeactivatedAccount(email, tenant.slug);
          if (deactivatedCheck.is_deactivated && deactivatedCheck.can_reactivate) {
            // Show reactivation dialog
            setReactivateData({
              daysUntilPurge: deactivatedCheck.days_until_purge,
              purgeDate: deactivatedCheck.purge_date,
            });
            setShowReactivateDialog(true);
            setLoading(false);
            return;
          }
        }

        // Show error message
        setError(result.message || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle account reactivation
  const handleReactivate = async () => {
    if (!tenant?.slug) return;

    setIsReactivating(true);
    setReactivateError(null);

    try {
      const result = await reactivateAccount(email, password, tenant.slug);

      if (result.success) {
        // Account reactivated! Now log them in
        setShowReactivateDialog(false);
        setReactivateData(null);

        // Attempt login again
        const loginResult = await directLogin(email, password, tenant.slug, { rememberMe });

        if (loginResult.success && loginResult.authenticated && loginResult.user) {
          login({
            id: loginResult.user.id,
            email: loginResult.user.email,
            firstName: loginResult.user.first_name || '',
            lastName: loginResult.user.last_name || '',
            phone: '',
            createdAt: new Date().toISOString(),
            tenantId: loginResult.user.tenant_id,
          });

          await fetchAndUpdateProfile(loginResult.user.tenant_id);
          // Cart merge handled by session cookies - see handleSubmit comment
          router.push(getNavPath('/account'));
        } else {
          setError('Account reactivated but login failed. Please try logging in again.');
        }
      } else {
        setReactivateError(result.message || 'Failed to reactivate account. Please check your password.');
      }
    } catch {
      setReactivateError('An unexpected error occurred. Please try again.');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleMfaCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...mfaCode];
    newCode[index] = value;
    setMfaCode(newCode);
    if (value && index < 5) {
      mfaCodeRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaCodeRefs.current[index - 1]?.focus();
    }
  };

  const handleMfaVerify = async () => {
    const codeStr = mfaCode.join('');
    if (codeStr.length !== 6) return;

    setMfaError('');
    setIsMfaVerifying(true);

    try {
      const result = await verifyMfa(mfaSession, codeStr, activeMfaMethod);

      if (result.success && result.authenticated) {
        if (result.user) {
          login({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || '',
            lastName: result.user.last_name || '',
            phone: '',
            createdAt: new Date().toISOString(),
            tenantId: result.user.tenant_id,
          });
          await fetchAndUpdateProfile(result.user.tenant_id);
        }
        router.push(getNavPath('/account'));
      } else {
        setMfaError(result.message || 'Invalid code. Please try again.');
        setMfaCode(['', '', '', '', '', '']);
        setTimeout(() => mfaCodeRefs.current[0]?.focus(), 50);
      }
    } catch {
      setMfaError('Verification failed. Please try again.');
      setMfaCode(['', '', '', '', '', '']);
      setTimeout(() => mfaCodeRefs.current[0]?.focus(), 50);
    }
    setIsMfaVerifying(false);
  };

  const handleMfaBack = () => {
    setMfaStep(false);
    setMfaSession('');
    setMfaMethods([]);
    setActiveMfaMethod('email');
    setMfaCode(['', '', '', '', '', '']);
    setMfaError('');
    setLoading(false);
  };

  const switchMfaMethod = (method: 'totp' | 'email') => {
    setActiveMfaMethod(method);
    setMfaCode(['', '', '', '', '', '']);
    setMfaError('');
    setTimeout(() => mfaCodeRefs.current[0]?.focus(), 50);
  };

  // MFA Step UI
  if (mfaStep) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/5 via-background to-[var(--tenant-secondary)]/5" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-md relative z-10"
        >
          <motion.div
            variants={itemVariants}
            className="bg-card/80 backdrop-blur-sm rounded-2xl border shadow-xl p-8"
          >
            <motion.div variants={itemVariants} className="text-center mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {activeMfaMethod === 'totp' ? (
                  <Smartphone className="h-8 w-8 text-tenant-primary" />
                ) : (
                  <Shield className="h-8 w-8 text-tenant-primary" />
                )}
              </motion.div>
              <h1 className="text-2xl font-bold">
                <TranslatedUIText text="Verify Your Identity" />
              </h1>
              <p className="text-muted-foreground mt-2">
                {activeMfaMethod === 'totp' ? (
                  <TranslatedUIText text="Enter the 6-digit code from your authenticator app" />
                ) : (
                  <TranslatedUIText text="Enter the verification code sent to your email" />
                )}
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {mfaError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mb-4"
                >
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {mfaError}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="space-y-6">
              {/* 6-digit code input */}
              <div className="flex justify-center gap-2">
                {mfaCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { mfaCodeRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleMfaCodeChange(index, e.target.value)}
                    onKeyDown={e => handleMfaCodeKeyDown(index, e)}
                    className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-border bg-background text-foreground focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20 transition-all"
                    disabled={isMfaVerifying}
                  />
                ))}
              </div>

              {/* Verify button */}
              <Button
                onClick={handleMfaVerify}
                variant="tenant-gradient"
                size="lg"
                className="w-full"
                disabled={isMfaVerifying || mfaCode.join('').length !== 6}
              >
                {isMfaVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <TranslatedUIText text="Verifying..." />
                  </>
                ) : (
                  <TranslatedUIText text="Verify Code" />
                )}
              </Button>

              {/* Method switcher */}
              {mfaMethods.length > 1 && (
                <div className="text-center">
                  {activeMfaMethod === 'totp' ? (
                    <button
                      onClick={() => switchMfaMethod('email')}
                      className="text-sm text-tenant-primary hover:underline"
                    >
                      <TranslatedUIText text="Use email verification instead" />
                    </button>
                  ) : (
                    <button
                      onClick={() => switchMfaMethod('totp')}
                      className="text-sm text-tenant-primary hover:underline"
                    >
                      <TranslatedUIText text="Use authenticator app instead" />
                    </button>
                  )}
                </div>
              )}

              {/* Backup code hint for TOTP */}
              {activeMfaMethod === 'totp' && (
                <p className="text-xs text-center text-muted-foreground">
                  <TranslatedUIText text="You can also use a backup code in place of the authenticator code" />
                </p>
              )}

              {/* Back button */}
              <button
                onClick={handleMfaBack}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <TranslatedUIText text="Back to login" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decorations with animation */}
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
        transition={{ delay: 1 }}
        className="absolute bottom-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--tenant-secondary)' }}
      />

      {/* Decorative sparkles */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-1/4 left-1/4"
      >
        <Sparkles className="h-6 w-6 text-tenant-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute bottom-1/3 right-1/4"
      >
        <Sparkles className="h-4 w-4 text-tenant-secondary" />
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
          {/* Header with icon animation */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Lock className="h-8 w-8 text-tenant-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              <TranslatedUIText text="Welcome Back" />
            </h1>
            <p className="text-muted-foreground mt-2">
              <TranslatedUIText text="Sign in to your account to continue" />
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                >
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email"><TranslatedUIText text="Email Address" /></Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password"><TranslatedUIText text="Password" /></Label>
                <Link
                  href={getNavPath('/forgot-password')}
                  className="text-sm text-tenant-primary hover:underline transition-all hover:text-[var(--tenant-primary-dark)]"
                >
                  <TranslatedUIText text="Forgot password?" />
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                  required
                  autoComplete="current-password"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </motion.button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="data-[state=checked]:bg-tenant-primary data-[state=checked]:border-tenant-primary"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                <TranslatedUIText text="Remember me for 30 days" />
              </Label>
            </motion.div>

            <motion.div variants={itemVariants}>
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
                    <TranslatedUIText text="Signing in..." />
                  </>
                ) : (
                  <TranslatedUIText text="Sign In" />
                )}
              </Button>
            </motion.div>
          </form>

          {isPasskeyAvailable && (
            <motion.div variants={itemVariants} className="mt-5">
              <div className="relative flex items-center gap-4 my-1">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  <TranslatedUIText text="or" />
                </span>
                <Separator className="flex-1" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full mt-3"
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading || isLoading}
              >
                {isPasskeyLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4 mr-2" />
                )}
                <TranslatedUIText text="Sign in with passkey" />
              </Button>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-6">
            <SocialLogin onLogin={handleSocialLogin} isLoading={isLoading} mode="login" />
          </motion.div>

          <motion.p variants={itemVariants} className="text-center mt-6 text-sm text-muted-foreground">
            <TranslatedUIText text="Don't have an account?" />{' '}
            <Link
              href={getNavPath('/register')}
              className="text-tenant-primary font-medium hover:underline transition-all"
            >
              <TranslatedUIText text="Create one" />
            </Link>
          </motion.p>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-center mt-6 text-xs text-muted-foreground"
        >
          <TranslatedUIText text="By signing in, you agree to our" />{' '}
          <Link href={getNavPath('/terms')} className="underline hover:text-foreground transition-colors">
            <TranslatedUIText text="Terms of Service" />
          </Link>{' '}
          <TranslatedUIText text="and" />{' '}
          <Link href={getNavPath('/privacy')} className="underline hover:text-foreground transition-colors">
            <TranslatedUIText text="Privacy Policy" />
          </Link>
        </motion.p>
      </motion.div>

      {/* Reactivation Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <TranslatedUIText text="Reactivate Your Account" />
            </DialogTitle>
            <DialogDescription>
              <TranslatedUIText text="Your account was deactivated. Would you like to reactivate it?" />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <TranslatedUIText text="Your account data has been preserved." />
                {reactivateData?.daysUntilPurge && (
                  <>
                    {' '}
                    <TranslatedUIText text="You have" />{' '}
                    <span className="font-medium text-foreground">{reactivateData.daysUntilPurge}</span>{' '}
                    <TranslatedUIText text="days left to reactivate before your data is permanently deleted." />
                  </>
                )}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              <TranslatedUIText text="Click 'Reactivate' to restore your account and log in with the password you entered." />
            </p>

            {reactivateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {reactivateError}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReactivateDialog(false);
                setReactivateData(null);
                setReactivateError(null);
              }}
              disabled={isReactivating}
            >
              <TranslatedUIText text="Cancel" />
            </Button>
            <Button
              className="btn-tenant-primary"
              onClick={handleReactivate}
              disabled={isReactivating}
            >
              {isReactivating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <TranslatedUIText text="Reactivating..." />
                </>
              ) : (
                <TranslatedUIText text="Reactivate My Account" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
