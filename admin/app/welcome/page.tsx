'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import {
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Building2,
  Sparkles,
  Shield,
  Key,
  User,
  Loader2,
  ArrowRight,
  PartyPopper,
  Gift,
  Rocket,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { SocialLogin } from '@/components/SocialLogin';
import { Confetti, FloralCelebration } from '@/components/Confetti';

interface OnboardingData {
  businessName?: string;
  industry?: string;
  email?: string;
  firstName?: string;
  city?: string;
  country?: string;
  description?: string;
  progress?: number;
  // FIX-MEDIUM: Include timezone/currency/business_model so they aren't lost during account setup
  timezone?: string;
  currency?: string;
  businessModel?: string;
}

function getContactInfo(session: Record<string, any>): Record<string, any> {
  const contactArray = Array.isArray(session.contact_information) ? session.contact_information : [];
  return session.contact_info || session.contact_details || contactArray[0] || {};
}

function getBusinessInfo(session: Record<string, any>): Record<string, any> {
  return session.business_information || session.business_info || {};
}

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('sessionId') || searchParams?.get('session_id');
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Fetch onboarding data from API
  useEffect(() => {
    const fetchOnboardingData = async () => {
      // Log URL for debugging
      console.log('[Welcome] Current URL:', window.location.href);
      console.log('[Welcome] Search params:', window.location.search);
      console.log('[Welcome] Session ID from params:', sessionId);

      if (!sessionId) {
        setIsLoading(false);
        // Check if sessionId might be in a different format in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const altSessionId = urlParams.get('sessionId') || urlParams.get('session_id') || urlParams.get('session');
        console.log('[Welcome] Alternative session ID check:', altSessionId);

        if (altSessionId) {
          // Reload with proper sessionId
          window.location.href = `/welcome?sessionId=${altSessionId}`;
          return;
        }

        toast.error('Session Error', 'No session ID provided. Please restart the onboarding process.');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/onboarding/${sessionId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'Failed to fetch session data');
        }

        // Map backend response to local format
        const session = result.data || result;
        const business = getBusinessInfo(session);
        const contact = getContactInfo(session);
        setOnboardingData({
          businessName: business.business_name || session.businessName,
          industry: business.industry || session.industry,
          email: contact.email || session.email,
          firstName: contact.first_name || session.firstName,
          city: session.business_address?.city || session.address?.city || session.city,
          country: session.business_address?.country || session.address?.country || session.country,
          description: business.description || business.business_description || session.description,
          progress: 100,
          // FIX-MEDIUM: Extract timezone/currency/business_model from session
          timezone: session.store_setup?.timezone || session.default_timezone || session.timezone || 'UTC',
          currency: session.store_setup?.currency || session.default_currency || session.currency || 'USD',
          businessModel: session.store_setup?.business_model || session.business_model || session.businessModel || 'ONLINE_STORE',
        });
        setIsLoading(false);
        // Trigger celebration after data loads
        setShowCelebration(true);
      } catch (error) {
        console.error('Failed to fetch onboarding data:', error);
        setIsLoading(false);
        toast.error('Error', error instanceof Error ? error.message : 'Failed to load session data');
      }
    };

    fetchOnboardingData();
  }, [sessionId]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('weak');
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 4) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId) {
      toast.error('Session Error', 'No session ID. Please restart the onboarding process.');
      return;
    }

    if (password.length < 10) {
      toast.error('Weak Password', 'Password must be at least 10 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (passwordStrength === 'weak') {
      toast.error('Weak Password', 'Please choose a stronger password');
      return;
    }

    setIsSubmitting(true);

    try {
      // FIX-MEDIUM: Include timezone/currency/business_model in account-setup request
      // Previously these were omitted, causing tenant defaults to overwrite user's selections
      const response = await fetch(`/api/onboarding/${sessionId}/account-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          auth_method: 'password',
          timezone: onboardingData?.timezone || 'UTC',
          currency: onboardingData?.currency || 'USD',
          business_model: onboardingData?.businessModel || 'ONLINE_STORE',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Account setup failed');
      }

      // Extract admin URL from response - backend provides correct URL for both custom domains and subdomains
      const responseData = result.data || result;
      const adminUrl = responseData?.admin_url
        || responseData?.tenant?.admin_url
        || (() => {
          // Fallback: construct URL from tenant slug
          const tenantSlug = responseData?.tenant?.slug || responseData?.tenant_slug;
          const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com';
          return tenantSlug ? `https://${tenantSlug}-admin.${baseDomain}` : '/';
        })();

      toast.success('Account Created!', 'Welcome to mark8ly. Redirecting to your dashboard...');
      setTimeout(() => {
        window.location.href = adminUrl;
      }, 1500);
    } catch (error) {
      console.error('Account setup error:', error);
      setIsSubmitting(false);
      toast.error('Setup Failed', error instanceof Error ? error.message : 'Failed to complete account setup');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (!sessionId) {
      toast.error('Session Error', 'No session ID. Please restart the onboarding process.');
      return;
    }

    // Redirect to auth-bff OAuth flow with kc_idp_hint for the provider
    // After Google consent, auth-bff will redirect to /welcome/callback with a session cookie
    const authBffUrl = process.env.NEXT_PUBLIC_AUTH_BFF_URL || '';
    const callbackUrl = `/welcome/callback?sessionId=${sessionId}`;
    window.location.href = `${authBffUrl}/auth/login?kc_idp_hint=${provider}&returnTo=${encodeURIComponent(callbackUrl)}`;
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-destructive/100';
      case 'medium': return 'bg-warning';
      case 'strong': return 'bg-success';
    }
  };

  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return 'w-1/3';
      case 'medium': return 'w-2/3';
      case 'strong': return 'w-full';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading your account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center py-8">
      {/* Celebration effects */}
      {showCelebration && (
        <>
          <Confetti active={showCelebration} duration={6000} pieceCount={200} />
          <FloralCelebration active={showCelebration} />
        </>
      )}

      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/100/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-success/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl w-full">
        {/* Welcome Header with Celebration */}
        <div className="text-center mb-6 relative">
          {/* Celebration badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success rounded-full text-white text-sm font-medium mb-4 animate-bounce shadow-lg">
            <PartyPopper className="w-4 h-4" />
            Account Created Successfully!
          </div>

          {/* Success icon with glow */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-success blur-xl opacity-30 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-success shadow-lg shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-success mb-2">
            Welcome to mark8ly!
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Hi {onboardingData?.firstName || 'there'}, your journey begins now!
          </p>
          <p className="text-sm text-muted-foreground">
            Let's secure your account and get you started
          </p>
        </div>

        {/* Business Information Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Store Details</h2>
              <p className="text-xs text-muted-foreground">Your development store is ready</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-muted border border-border/50">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                Business Name
              </p>
              <p className="text-sm font-semibold text-foreground">
                {onboardingData?.businessName || 'Not provided'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted border border-border/50">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Industry
              </p>
              <p className="text-sm font-semibold text-foreground capitalize">
                {onboardingData?.industry || 'Not specified'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted border border-border/50">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Email
              </p>
              <p className="text-sm font-semibold text-foreground break-all">
                {onboardingData?.email || 'Not provided'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted border border-border/50">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                Location
              </p>
              <p className="text-sm font-semibold text-foreground">
                {onboardingData?.city && onboardingData?.country
                  ? `${onboardingData.city}, ${onboardingData.country}`
                  : 'Not provided'}
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-xl px-3 py-2 flex items-start gap-2 border border-primary/30/50">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Development Mode</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                No fees until you go live! Test all features.
              </p>
            </div>
          </div>
        </div>

        {/* Account Setup Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Complete Account Setup</h2>
              <p className="text-xs text-muted-foreground">Create a secure password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="pl-9 pr-10 h-10 text-sm bg-card border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className={`font-medium ${
                      passwordStrength === 'weak' ? 'text-destructive' :
                      passwordStrength === 'medium' ? 'text-warning' :
                      'text-success'
                    }`}>
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pl-9 pr-10 h-10 text-sm bg-card border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-muted rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-foreground mb-1.5">Requirements:</p>
              <ul className="text-[10px] text-muted-foreground space-y-0.5">
                <li className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${password.length >= 10 ? 'bg-success' : 'bg-border'}`} />
                  10+ characters
                </li>
                <li className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-success' : 'bg-border'}`} />
                  Uppercase letter
                </li>
                <li className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) ? 'bg-success' : 'bg-border'}`} />
                  Lowercase letter
                </li>
                <li className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-success' : 'bg-border'}`} />
                  Number
                </li>
              </ul>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword || passwordStrength === 'weak'}
              className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-2 mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs bg-white/80 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* Social Login */}
          <SocialLogin onLogin={handleSocialLogin} isLoading={isSubmitting} />

          {/* Security notice */}
          <div className="bg-muted rounded-xl px-3 py-2 border border-border mt-4">
            <p className="text-[10px] text-muted-foreground text-center">
              <Lock className="w-3 h-3 inline-block mr-1" aria-hidden="true" />We never store your social passwords. OAuth handled securely.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline font-medium">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
        </p>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 20s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
