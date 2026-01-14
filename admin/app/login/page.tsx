'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Loader2, Mail, Lock, ArrowLeft, Building2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import {
  login,
  lookupTenants,
  directLogin,
  type TenantInfo,
  type DirectLoginResponse,
} from '@/lib/auth/auth-client';
import { getCurrentTenantSlug } from '@/lib/utils/tenant';
import { SocialLogin } from '@/components/SocialLogin';

type LoginStep = 'email' | 'tenant-select' | 'password' | 'mfa' | 'success';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Login flow state
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [mfaSession, setMfaSession] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  // Redirect authenticated users
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user) {
      const currentTenantSlug = getCurrentTenantSlug();
      if (currentTenantSlug) {
        window.location.href = '/';
        return;
      }
      router.replace('/welcome');
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Handle email submission - lookup tenants
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await lookupTenants(email);

      if (!result.success) {
        setError(result.message || 'Unable to look up account. Please try again.');
        setIsLoading(false);
        return;
      }

      const userTenants = result.data?.tenants || [];
      setTenants(userTenants);

      if (userTenants.length === 0) {
        // No tenants found - show generic message (don't reveal if email exists)
        setError('No account found. Please check your email or sign up.');
        setIsLoading(false);
        return;
      }

      // AUTO-SELECT: Try to detect tenant from subdomain (e.g., what-a-store-admin.tesserix.app)
      const detectedTenantSlug = getCurrentTenantSlug();
      if (detectedTenantSlug) {
        const matchingTenant = userTenants.find(t => t.slug === detectedTenantSlug);
        if (matchingTenant) {
          // Auto-select the tenant that matches the subdomain
          console.log(`[Login] Auto-selected tenant from subdomain: ${detectedTenantSlug}`);
          setSelectedTenant(matchingTenant);
          setStep('password');
          setIsLoading(false);
          return;
        } else {
          // User is on a tenant subdomain but doesn't have access to that tenant
          console.warn(`[Login] User ${email} does not have access to tenant: ${detectedTenantSlug}`);
          setError(`You don't have access to this organization. Please contact your administrator.`);
          setIsLoading(false);
          return;
        }
      }

      // No subdomain detected - use standard flow
      if (userTenants.length === 1) {
        // Single tenant - skip selection, go directly to password
        setSelectedTenant(userTenants[0]);
        setStep('password');
      } else {
        // Multiple tenants - show selection
        setStep('tenant-select');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tenant selection
  const handleTenantSelect = (tenant: TenantInfo) => {
    setSelectedTenant(tenant);
    setError(null);
    setStep('password');
  };

  // Handle password submission - direct login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setError(null);
    setRemainingAttempts(null);
    setLockedUntil(null);
    setIsLoading(true);

    try {
      const result: DirectLoginResponse = await directLogin(
        email,
        password,
        selectedTenant.slug,
        { rememberMe }
      );

      if (!result.success) {
        // Handle specific errors
        if (result.error === 'ACCOUNT_LOCKED') {
          setLockedUntil(result.locked_until || null);
          setError('Your account has been locked due to too many failed attempts.');
        } else if (result.error === 'RATE_LIMITED') {
          setError(`Too many attempts. Please try again in ${result.retry_after || 60} seconds.`);
        } else {
          setError(result.message || 'Invalid email or password.');
          if (result.remaining_attempts !== undefined) {
            setRemainingAttempts(result.remaining_attempts);
          }
        }
        setIsLoading(false);
        return;
      }

      // Check for MFA requirement
      if (result.mfa_required) {
        setMfaSession(result.mfa_session || null);
        setStep('mfa');
        setIsLoading(false);
        return;
      }

      // Success!
      setStep('success');

      // Redirect to dashboard or return URL
      setTimeout(() => {
        const returnTo = getCurrentTenantSlug() ? '/' : '/welcome';
        window.location.href = returnTo;
      }, 1000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    setError(null);
    setRemainingAttempts(null);
    setLockedUntil(null);

    if (step === 'password') {
      if (tenants.length > 1) {
        setStep('tenant-select');
      } else {
        setStep('email');
        setSelectedTenant(null);
      }
      setPassword('');
    } else if (step === 'tenant-select') {
      setStep('email');
      setSelectedTenant(null);
      setTenants([]);
    } else if (step === 'mfa') {
      setStep('password');
      setMfaCode('');
    }
  };

  // Handle OIDC flow (legacy/SSO)
  const handleOidcLogin = () => {
    const returnTo = getCurrentTenantSlug() ? '/' : '/welcome';
    login({ returnTo });
  };

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    const idpMap: Record<string, string> = {
      google: 'google',
      microsoft: 'microsoft',
      github: 'github',
      facebook: 'facebook',
    };
    const idpHint = idpMap[provider.toLowerCase()];
    const returnTo = getCurrentTenantSlug() ? '/' : '/welcome';
    const params = new URLSearchParams();
    params.set('returnTo', returnTo);
    if (idpHint) {
      params.set('kc_idp_hint', idpHint);
    }
    window.location.href = `/auth/login?${params.toString()}`;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/80">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render step-specific content
  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 shadow-lg shadow-primary/30 mb-3">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent mb-1">
                Tesseract Hub
              </h1>
              <p className="text-xs text-muted-foreground mb-3">Admin Portal</p>
              <h2 className="text-xl font-semibold text-foreground mb-1">Welcome Back</h2>
              <p className="text-xs text-muted-foreground">Enter your email to sign in</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-12"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-700 hover:via-violet-700 hover:to-purple-700 text-white shadow-lg shadow-primary/30 transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs bg-white/80 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <SocialLogin onLogin={handleSocialLogin} isLoading={isLoading} />
          </>
        );

      case 'tenant-select':
        return (
          <>
            <div className="text-center">
              <button
                onClick={handleBack}
                className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 shadow-lg shadow-primary/30 mb-3">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Select Organization</h2>
              <p className="text-xs text-muted-foreground">Choose which organization to sign in to</p>
              <p className="text-xs text-primary mt-1">{email}</p>
            </div>

            <div className="space-y-2">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left group"
                >
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {tenant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-primary rotate-180 transition-colors" />
                </button>
              ))}
            </div>
          </>
        );

      case 'password':
        return (
          <>
            <div className="text-center relative">
              <button
                onClick={handleBack}
                className="absolute -top-2 -left-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 shadow-lg shadow-primary/30 mb-3">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Enter Password</h2>
              <p className="text-xs text-muted-foreground">{email}</p>
              {selectedTenant && (
                <p className="text-xs text-primary font-medium mt-1">{selectedTenant.name}</p>
              )}
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12"
                    autoComplete="current-password"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => router.push('/auth/login?prompt=login')}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <span>{error}</span>
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <p className="text-xs mt-1">
                        {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                      </p>
                    )}
                    {lockedUntil && (
                      <p className="text-xs mt-1">
                        Locked until: {new Date(lockedUntil).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-700 hover:via-violet-700 hover:to-purple-700 text-white shadow-lg shadow-primary/30 transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Welcome back!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-4" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-20">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
          alt="Marketplace background"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/50 to-violet-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Animated elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Login card */}
      <div className="w-full max-w-md px-4 py-8 mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 space-y-5 animate-fade-in-up relative">
          {renderStepContent()}

          {/* Sign up link (only on email step) */}
          {step === 'email' && (
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                New to Tesseract?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/welcome')}
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-white/60 mt-4">
          &copy; 2026 Tesseract Hub. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-slow-zoom { animation: slow-zoom 30s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.7; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.9; }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float 10s ease-in-out infinite; animation-delay: 2s; }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}
