'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import { Loader2, Lock, CheckCircle, XCircle, Eye, EyeOff, ArrowRight, Shield, Check } from 'lucide-react';
import { onboardingApi } from '../../../lib/api/onboarding';
import { useOnboardingStore } from '../../../lib/store/onboarding-store';
import { analytics } from '../../../lib/analytics/posthog';
import { authApi } from '../../../lib/api/auth';

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', check: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', check: (p: string) => /[0-9]/.test(p) },
];

type SetupState = 'input' | 'creating' | 'provisioning' | 'success' | 'error';
type AuthMethod = 'password' | 'google';

interface ProvisioningProgress {
  completed: number;
  total: number;
  percentage: number;
  steps: {
    certificate: boolean;
    gateway: boolean;
    admin_vs: boolean;
    storefront_vs: boolean;
    api_vs: boolean;
  };
}

function SetupPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  const emailParam = searchParams.get('email');

  const { setTenantResult, sessionId: storeSessionId, storeSetup, _hasHydrated } = useOnboardingStore();

  const [state, setState] = useState<SetupState>('input');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [provisioningProgress, setProvisioningProgress] = useState<ProvisioningProgress | null>(null);
  const [adminUrl, setAdminUrl] = useState('');

  // Use session from URL param or store
  const sessionId = sessionIdParam || storeSessionId;
  const email = emailParam || '';

  // Check password requirements
  const passwordChecks = PASSWORD_REQUIREMENTS.map(req => ({
    ...req,
    passed: req.check(password),
  }));
  const allRequirementsMet = passwordChecks.every(req => req.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  // Only allow submit after store has hydrated (so storeSetup values are available)
  const canSubmit = allRequirementsMet && passwordsMatch && _hasHydrated;

  // Only redirect if no session after hydration is complete
  useEffect(() => {
    if (_hasHydrated && !sessionId) {
      console.log('[SetupPassword] No session found after hydration, redirecting');
      router.push('/onboarding');
    }
  }, [_hasHydrated, sessionId, router]);

  // Poll for provisioning status
  const pollProvisioningStatus = async (slug: string, computedAdminUrl: string) => {
    const maxAttempts = 60; // Poll for up to 2 minutes (60 * 2 seconds)
    let attempts = 0;

    const poll = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/onboarding/${sessionId}/provisioning-status?slug=${slug}`);
        const data = await response.json();

        if (data.progress) {
          setProvisioningProgress(data.progress);
        }

        if (data.ready) {
          return true;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          console.warn('[Provisioning] Max attempts reached, proceeding anyway');
          return true; // Proceed even if timeout - VS might be ready
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        return poll();
      } catch (error) {
        console.error('[Provisioning] Poll error:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          return true; // Proceed on error after max attempts
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        return poll();
      }
    };

    const isReady = await poll();
    if (isReady) {
      setState('success');
      // Redirect to admin after a short delay
      setTimeout(() => {
        window.location.href = computedAdminUrl;
      }, 2000);
    }
  };

  // Handle Google OAuth login
  // This stores the session info in localStorage before redirect so we can complete
  // account setup after the OAuth callback
  const handleGoogleLogin = () => {
    // Store session info for after OAuth callback
    if (sessionId) {
      localStorage.setItem('onboarding_session_for_oauth', JSON.stringify({
        sessionId,
        email,
        timestamp: Date.now(),
      }));
    }
    // Redirect to Google OAuth - the callback will handle account creation
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || !sessionId) return;

    setState('creating');
    setErrorMessage('');

    try {
      // Log store setup values for debugging
      console.log('[SetupPassword] Store setup values:', {
        timezone: storeSetup?.timezone,
        currency: storeSetup?.currency,
        business_model: storeSetup?.business_model,
        _hasHydrated,
      });

      // Call account-setup endpoint to create tenant and user
      const accountSetupPayload = {
        password,
        auth_method: 'password',
        // Include store setup data for tenant configuration
        timezone: storeSetup?.timezone || 'UTC',
        currency: storeSetup?.currency || 'USD',
        business_model: storeSetup?.business_model || 'ONLINE_STORE',
      };
      console.log('[SetupPassword] Sending account setup with:', {
        timezone: accountSetupPayload.timezone,
        currency: accountSetupPayload.currency,
        business_model: accountSetupPayload.business_model,
      });

      const response = await fetch(`/api/onboarding/${sessionId}/account-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountSetupPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create account');
      }

      // Store tenant result in component state
      const tenantData = data.data;
      if (tenantData) {
        setTenantResult({
          tenant_id: tenantData.tenant_id,
          tenant_slug: tenantData.tenant_slug,
          business_name: tenantData.business_name,
        });
        setTenantSlug(tenantData.tenant_slug);
      }

      // Track success
      analytics.onboarding.completed({
        session_id: sessionId,
        tenant_id: tenantData?.tenant_id,
        tenant_slug: tenantData?.tenant_slug,
      });

      // Clear onboarding session from localStorage since onboarding is complete
      try {
        localStorage.removeItem('tenant-onboarding-store');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }

      // Build admin login URL
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
      let finalAdminUrl = tenantData?.admin_url ||
        `https://${tenantData?.tenant_slug}-admin.${baseDomain}`;

      // Try auto-login if tokens are available
      if (tenantData?.access_token && tenantData?.user_id) {
        try {
          const autoLoginResponse = await fetch('/api/auth/auto-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: tenantData.access_token,
              refresh_token: tenantData.refresh_token,
              expires_in: tenantData.expires_in,
              user_id: tenantData.user_id,
              email: email,
              tenant_id: tenantData.tenant_id,
              tenant_slug: tenantData.tenant_slug,
            }),
          });

          const autoLoginData = await autoLoginResponse.json();

          if (autoLoginData.success && autoLoginData.admin_url) {
            finalAdminUrl = autoLoginData.admin_url;
          }
        } catch (autoLoginError) {
          console.error('Auto-login failed, falling back to manual login:', autoLoginError);
          finalAdminUrl = `${finalAdminUrl}/login`;
        }
      } else {
        finalAdminUrl = `${finalAdminUrl}/login`;
      }

      // Store admin URL for later use
      setAdminUrl(finalAdminUrl);

      // Transition to provisioning state and poll for infrastructure readiness
      setState('provisioning');
      pollProvisioningStatus(tenantData?.tenant_slug, finalAdminUrl);

    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      analytics.onboarding.failed(error instanceof Error ? error.message : 'Account setup failed');
    }
  };

  const handleContinueToAdmin = () => {
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
    // Redirect to admin login page - user will login with credentials they just created
    const adminUrl = tenantSlug
      ? `https://${tenantSlug}-admin.${baseDomain}/login`
      : `https://dev-admin.${baseDomain}/login`;
    window.location.href = adminUrl;
  };

  // Show loading while store is hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-24 pb-8 px-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-white/5 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" />
                <p className="mt-4 text-gray-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (state) {
      case 'creating':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-pulse shadow-2xl">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Creating Your Account
            </h2>
            <p className="text-gray-500 dark:text-white/60">
              Setting up your store and dashboard...
            </p>
          </div>
        );

      case 'provisioning':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-2xl">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Setting Up Your Store
            </h2>
            <p className="text-gray-500 dark:text-white/60 mb-6">
              We're configuring your store infrastructure. This usually takes 10-15 minutes.
            </p>

            {/* Progress indicator */}
            {provisioningProgress && (
              <div className="max-w-xs mx-auto mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{provisioningProgress.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${provisioningProgress.percentage}%` }}
                  />
                </div>

                {/* Step indicators */}
                <div className="mt-4 space-y-2 text-left">
                  {[
                    { key: 'certificate', label: 'SSL Certificate' },
                    { key: 'gateway', label: 'Gateway Configuration' },
                    { key: 'admin_vs', label: 'Admin Dashboard' },
                    { key: 'storefront_vs', label: 'Storefront' },
                    { key: 'api_vs', label: 'API Endpoints' },
                  ].map((step) => {
                    const isComplete = provisioningProgress.steps[step.key as keyof typeof provisioningProgress.steps];
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-2 text-sm ${
                          isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Please wait while we finalize your store setup...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Account Created Successfully!
            </h2>
            <p className="text-gray-500 dark:text-white/60 mb-2">
              Your store dashboard is ready at:
            </p>
            {tenantSlug && (
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-6 break-all">
                https://{tenantSlug}-admin.{process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app'}
              </p>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Redirecting to your admin dashboard...
              </p>
            </div>
            <button
              onClick={handleContinueToAdmin}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              Go to Dashboard Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-6 shadow-2xl">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Setup Failed
            </h2>
            <p className="text-red-500 mb-8">{errorMessage}</p>
            <button
              onClick={() => setState('input')}
              className="w-full py-4 px-6 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Your Account
              </h2>
              <p className="text-gray-500 dark:text-white/60">
                Choose how you want to sign in to your store
              </p>
              {email && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">{email}</p>
              )}
            </div>

            {/* Social Login Option */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full h-14 flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google (Recommended)
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  or create a password
                </span>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full h-14 pl-12 pr-12 text-base bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-white/80 mb-3">Password Requirements</p>
                <div className="grid grid-cols-2 gap-2">
                  {passwordChecks.map((req) => (
                    <div
                      key={req.id}
                      className={`flex items-center gap-2 text-sm ${
                        req.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${req.passed ? 'opacity-100' : 'opacity-30'}`} />
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full h-14 pl-12 pr-12 text-base bg-gray-50 dark:bg-white/5 border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-500'
                          : 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                        : 'border-gray-200 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-sm text-red-500 mt-2">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full py-4 px-6 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  canSubmit
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
                }`}
              >
                Create Account with Password
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="pt-24 pb-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-white/5 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-white/5 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" />
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetupPasswordContent />
    </Suspense>
  );
}
