'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export const dynamic = 'force-dynamic';

function CallbackContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('sessionId') || searchParams?.get('session_id');
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeOnboarding = async () => {
      if (!sessionId) {
        setError('No session ID provided. Please restart the onboarding process.');
        return;
      }

      try {
        let timezone = 'UTC';
        let currency = 'USD';
        let businessModel = 'ONLINE_STORE';

        try {
          const sessionResponse = await fetch(`/api/onboarding/${sessionId}`);
          const sessionResult = await sessionResponse.json();
          if (sessionResponse.ok) {
            const session = sessionResult.data || sessionResult;
            timezone = session.store_setup?.timezone || session.default_timezone || session.timezone || timezone;
            currency = session.store_setup?.currency || session.default_currency || session.currency || currency;
            businessModel = session.store_setup?.business_model || session.business_model || session.businessModel || businessModel;
          }
        } catch {
          // Continue with defaults if session fetch fails
        }

        // Call account-setup with google auth method
        // The user was already authenticated via Google OAuth through auth-bff,
        // and a BFF session cookie is set. The backend will find/create the user in Keycloak.
        const response = await fetch(`/api/onboarding/${sessionId}/account-setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_method: 'google',
            timezone,
            currency,
            business_model: businessModel,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'Account setup failed');
        }

        const responseData = result.data || result;
        const adminUrl = responseData?.admin_url
          || responseData?.tenant?.admin_url
          || (() => {
            const tenantSlug = responseData?.tenant?.slug || responseData?.tenant_slug;
            const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
            return tenantSlug ? `https://${tenantSlug}-admin.${baseDomain}` : '/';
          })();

        toast.success('Account Created!', 'Welcome to mark8ly. Redirecting to your dashboard...');
        setTimeout(() => {
          window.location.href = adminUrl;
        }, 1500);
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete account setup');
        toast.error('Setup Failed', err instanceof Error ? err.message : 'Failed to complete account setup');
      }
    };

    completeOnboarding();
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <p className="text-lg font-semibold text-destructive">Setup Failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a
            href={sessionId ? `/welcome?sessionId=${sessionId}` : '/'}
            className="text-sm text-primary hover:underline"
          >
            Go back and try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Completing your account setup...</p>
      </div>
    </div>
  );
}

export default function WelcomeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
