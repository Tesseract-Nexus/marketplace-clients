'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../../../../components/Header';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../../../lib/store/onboarding-store';
import { safeRedirect, registerValidatedCustomDomain } from '../../../../lib/utils/safe-redirect';

function CallbackContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const email = searchParams.get('email') || '';

  const { storeSetup, setTenantResult, _hasHydrated } = useOnboardingStore();

  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [adminUrl, setAdminUrl] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;

    const completeSetup = async () => {
      if (!sessionId) {
        setState('error');
        setErrorMessage('No session ID provided. Please restart the onboarding process.');
        return;
      }

      try {
        // Resolve store setup from local persisted state first, then backend session as fallback.
        // This prevents timezone/currency from defaulting when local storage is missing in OAuth callback.
        let resolvedTimezone = storeSetup?.timezone;
        let resolvedCurrency = storeSetup?.currency;
        let resolvedBusinessModel = storeSetup?.business_model;

        if (!resolvedTimezone || !resolvedCurrency || !resolvedBusinessModel) {
          const sessionResponse = await fetch(`/api/onboarding/${sessionId}`);
          if (sessionResponse.ok) {
            const sessionJson = await sessionResponse.json().catch(() => null);
            const sessionStoreSetup = sessionJson?.data?.store_setup || {};
            resolvedTimezone = resolvedTimezone || sessionStoreSetup.timezone;
            resolvedCurrency = resolvedCurrency || sessionStoreSetup.currency;
            resolvedBusinessModel = resolvedBusinessModel || sessionStoreSetup.business_model;
          }
        }

        const response = await fetch(`/api/onboarding/${sessionId}/account-setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_method: 'google',
            timezone: resolvedTimezone || 'UTC',
            currency: resolvedCurrency || 'USD',
            business_model: resolvedBusinessModel || 'ONLINE_STORE',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to create account');
        }

        const tenantData = data.data;
        if (tenantData) {
          setTenantResult({
            tenant_id: tenantData.tenant_id,
            tenant_slug: tenantData.tenant_slug,
            business_name: tenantData.business_name,
            user_id: tenantData.user_id || '',
            email: tenantData.email || email,
            admin_url: tenantData.admin_url || '',
            message: data.message || 'Account created successfully',
          });
          setTenantSlug(tenantData.tenant_slug || '');
        }

        // Build admin login URL
        // Use /auth/login (not /login) to force a fresh OAuth flow on the admin domain.
        // The onboarding auth-bff session has NO roles (user didn't exist in staff-service
        // when Google SSO completed). Routing through /auth/login creates a new session
        // with proper roles since the user now exists. Keycloak SSO session makes this seamless.
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com';
        let loginUrl: string;
        if (tenantData?.admin_url) {
          loginUrl = `${tenantData.admin_url}/auth/login`;
          try {
            const urlObj = new URL(tenantData.admin_url);
            const hostname = urlObj.hostname;
            if (!hostname.endsWith(baseDomain) && !hostname.includes('localhost')) {
              const parts = hostname.split('.');
              if (parts.length >= 2) {
                registerValidatedCustomDomain(parts.slice(-2).join('.'));
              }
            }
          } catch {}
        } else {
          loginUrl = `https://${tenantData?.tenant_slug}-admin.${baseDomain}/auth/login`;
        }

        setAdminUrl(loginUrl);

        // Clear onboarding session
        try {
          localStorage.removeItem('tenant-onboarding-store');
          localStorage.removeItem('onboarding_session_for_oauth');
          localStorage.setItem('onboarding_completed', JSON.stringify({
            tenant_slug: tenantData?.tenant_slug,
            business_name: tenantData?.business_name,
            admin_url: tenantData?.admin_url,
            completed_at: new Date().toISOString(),
          }));
        } catch {}

        setState('success');

        // Auto-redirect after delay
        setTimeout(() => {
          safeRedirect(loginUrl, '/');
        }, 3000);
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        setState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to complete account setup');
      }
    };

    completeSetup();
  }, [sessionId, _hasHydrated]);

  return (
    <div className="min-h-screen bg-warm-50">
      <Header />
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-warm-200 p-8">
            {state === 'loading' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 animate-pulse shadow-sm">
                  <Loader2 className="w-10 h-10 text-foreground-secondary animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Creating Your Account
                </h2>
                <p className="text-foreground-tertiary">
                  Setting up your store with Google...
                </p>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-6 shadow-sm animate-bounce">
                  <CheckCircle className="w-10 h-10 text-foreground-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Account Created Successfully!
                </h2>
                {tenantSlug && (
                  <p className="text-lg font-semibold text-terracotta-600 mb-6 break-all">
                    https://{tenantSlug}-admin.{process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com'}
                  </p>
                )}
                <div className="bg-warm-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-terracotta-600 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Redirecting to login page...
                  </p>
                </div>
                <button
                  onClick={() => adminUrl && safeRedirect(adminUrl, '/')}
                  className="w-full py-4 px-6 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Go to Login Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-destructive flex items-center justify-center mb-6 shadow-sm">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Setup Failed
                </h2>
                <p className="text-red-500 mb-8">{errorMessage}</p>
                <a
                  href={sessionId ? `/onboarding/setup-password?session=${sessionId}&email=${encodeURIComponent(email)}` : '/onboarding'}
                  className="w-full inline-block py-4 px-6 bg-warm-100 hover:bg-warm-200 text-foreground font-semibold rounded-xl transition-colors text-center"
                >
                  Go Back and Try Again
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetupPasswordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-warm-50">
        <Header />
        <div className="pt-24 pb-8 px-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-warm-200 p-8">
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-terracotta-600" />
                <p className="mt-4 text-foreground-tertiary">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
