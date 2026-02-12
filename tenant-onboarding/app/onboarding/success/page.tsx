'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Copy,
  Sparkles,
  Store,
  Globe,
  Shield,
  Users,
  Zap,
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Play,
  TrendingUp,
  Award,
  Rocket,
} from 'lucide-react';
import { useOnboardingStore } from '../../../lib/store/onboarding-store';
import { analytics } from '../../../lib/analytics/posthog';
import { useAnalytics } from '../../../lib/analytics/openpanel';
import { getTenantUrls } from '../../../lib/types/tenant';

export default function SuccessPage() {
  const router = useRouter();
  const {
    businessInfo,
    contactDetails,
    storeSetup,
    sessionId,
    tenantResult,
    resetOnboarding,
  } = useOnboardingStore();

  const opAnalytics = useAnalytics();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasCleanedUp, setHasCleanedUp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Derive tenant URLs
  const tenantUrls = useMemo(() => {
    const slug = tenantResult?.tenant_slug ||
      storeSetup.subdomain ||
      businessInfo.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      'your-store';
    return getTenantUrls(slug);
  }, [tenantResult, storeSetup.subdomain, businessInfo.business_name]);

  // Tenant setup derived from real data
  const tenantSetup = useMemo(() => ({
    storeName: tenantResult?.business_name || businessInfo.business_name || 'Your Store',
    slug: tenantResult?.tenant_slug ||
      storeSetup.subdomain ||
      businessInfo.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      'your-store',
    contactFirstName: contactDetails?.first_name || 'there',
    contactEmail: contactDetails?.email || '',
    tenantId: tenantResult?.tenant_id,
  }), [tenantResult, businessInfo, contactDetails, storeSetup]);

  const storeUrl = tenantUrls.storefrontUrl;
  const adminUrl = tenantUrls.adminUrl;
  // Use admin_url from backend if available, otherwise use computed adminUrl
  const realAdminUrl = tenantResult?.admin_url || adminUrl;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!sessionId && !tenantResult) {
      router.push('/onboarding');
      return;
    }

    analytics.onboarding.completed({
      session_id: sessionId || 'unknown',
      business_name: tenantSetup.storeName,
      tenant_id: tenantSetup.tenantId,
      tenant_slug: tenantSetup.slug,
    });
    opAnalytics.onboardingCompleted({
      sessionId: sessionId || 'unknown',
      tenantId: tenantSetup.tenantId,
      tenantSlug: tenantSetup.slug,
    });

  }, [hasHydrated, sessionId, tenantResult, router, tenantSetup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear onboarding data from localStorage after success page loads
  // This ensures fresh start for next onboarding
  useEffect(() => {
    if (!hasHydrated || hasCleanedUp) return;

    // Wait 3 seconds to ensure analytics are tracked and page is displayed
    const cleanupTimer = setTimeout(() => {
      console.log('[Success] Clearing onboarding data from localStorage');
      resetOnboarding();
      setHasCleanedUp(true);
    }, 3000);

    return () => clearTimeout(cleanupTimer);
  }, [hasHydrated, hasCleanedUp, resetOnboarding]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get time of day for personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Minimal background */}
      <div className="absolute inset-0 -z-10 bg-warm-50" />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">

        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-24">
          {/* Success Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-sm font-medium mb-8">
            <CheckCircle className="w-4 h-4" />
            Setup Complete
          </div>

          {/* Personalized Greeting */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            {getGreeting()}, {tenantSetup.contactFirstName}.
          </h1>

          {/* Welcome Message */}
          <p className="text-xl sm:text-2xl text-foreground-secondary max-w-3xl mx-auto mb-4">
            <span className="font-semibold text-foreground">{tenantSetup.storeName}</span> is now live.
          </p>

          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10">
            Your admin and storefront links are ready below.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={realAdminUrl}
              className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-colors shadow-sm"
            >
              <LayoutDashboard className="w-5 h-5" />
              Enter Your Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors font-medium"
            >
              <Store className="w-5 h-5" />
              View your store
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-16 sm:mb-24">
          <div className="text-center p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-foreground-secondary" />
            </div>
            <p className="font-semibold text-foreground">SSL Secured</p>
            <p className="text-sm text-foreground-secondary">256-bit encryption</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-foreground-secondary" />
            </div>
            <p className="font-semibold text-foreground">Live Worldwide</p>
            <p className="text-sm text-foreground-secondary">Global CDN</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-foreground-secondary" />
            </div>
            <p className="font-semibold text-foreground">99.99% Uptime</p>
            <p className="text-sm text-foreground-secondary">Always available</p>
          </div>
        </div>

        {/* Your Store URLs - Clean Card */}
        <div className="mb-16 sm:mb-24">
          <div className="bg-card rounded-3xl p-8 sm:p-10 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                <Store className="w-5 h-5 text-foreground-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Your Store</h2>
                <p className="text-sm text-foreground-secondary">Bookmark these links</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Storefront URL */}
              <div className="group">
                <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3 block">Customer Storefront</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-warm-50 rounded-xl px-4 py-3.5 border border-warm-200 group-hover:border-warm-300 transition-colors">
                    <code className="text-sm font-mono text-foreground">{storeUrl}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(storeUrl)}
                    className="p-3.5 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-sage-600" /> : <Copy className="w-4 h-4 text-foreground-tertiary" />}
                  </button>
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
                    title="Open Store"
                  >
                    <ExternalLink className="w-4 h-4 text-foreground-tertiary" />
                  </a>
                </div>
              </div>

              {/* Admin URL */}
              <div className="group">
                <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3 block">Admin Dashboard</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-warm-50 rounded-xl px-4 py-3.5 border border-warm-200 group-hover:border-warm-300 transition-colors">
                    <code className="text-sm font-mono text-foreground">{adminUrl}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminUrl)}
                    className="p-3.5 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-sage-600" /> : <Copy className="w-4 h-4 text-foreground-tertiary" />}
                  </button>
                  <a
                    href={realAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
                    title="Open Admin"
                  >
                    <ExternalLink className="w-4 h-4 text-foreground-tertiary" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next - Journey Path */}
        <div className="mb-16 sm:mb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Next steps</h2>
            <p className="text-foreground-secondary">Complete these in under 20 minutes</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: 'Add Products',
                description: 'Create your first listing and start your catalog',
                icon: ShoppingBag,
                time: '5 min',
                url: `${realAdminUrl}/products/new`,
              },
              {
                step: 2,
                title: 'Set Up Payments',
                description: 'Connect Stripe or PayPal to accept payments',
                icon: TrendingUp,
                time: '3 min',
                url: `${realAdminUrl}/settings/payments`,
              },
              {
                step: 3,
                title: 'Customize Design',
                description: 'Set your theme, logo, and brand colors',
                icon: Sparkles,
                time: '10 min',
                url: `${realAdminUrl}/settings/theme`,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.step}
                  href={item.url}
                  className="group relative bg-card rounded-2xl p-6 border border-border hover:border-warm-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-foreground-secondary" />
                    </div>
                    <span className="text-xs font-medium text-foreground-tertiary bg-warm-100 px-2.5 py-1 rounded-full">{item.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{item.description}</p>
                  <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-foreground-tertiary group-hover:text-foreground-secondary group-hover:translate-x-1 transition-all" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Help & Resources */}
        <div className="mb-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Help when you need it</h2>
            <p className="text-foreground-secondary">Support and resources to keep you moving</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <a
              href="/docs"
              className="group bg-card rounded-2xl p-6 border border-border hover:border-warm-300 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Play className="w-7 h-7 text-foreground-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Video tutorials</h3>
              <p className="text-sm text-foreground-secondary">Short, practical walkthroughs</p>
            </a>

            <a
              href="/community"
              className="group bg-card rounded-2xl p-6 border border-border hover:border-warm-300 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-foreground-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Community</h3>
              <p className="text-sm text-foreground-secondary">Learn from other merchants</p>
            </a>

            <a
              href="/support"
              className="group bg-card rounded-2xl p-6 border border-border hover:border-warm-300 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-foreground-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Priority support</h3>
              <p className="text-sm text-foreground-secondary">Fast responses from real humans</p>
            </a>
          </div>
        </div>

        {/* Final CTA - Warm Closing */}
        <div className="text-center">
          <div className="bg-card rounded-3xl p-10 sm:p-14 border border-border">
            <Rocket className="w-12 h-12 text-foreground-secondary mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready for your first sale?
            </h2>
            <p className="text-foreground-secondary max-w-xl mx-auto mb-8">
              Your store is live—start building now.
            </p>
            <a
              href={realAdminUrl}
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-colors shadow-sm"
            >
              <LayoutDashboard className="w-5 h-5" />
              Start Building
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-foreground-tertiary">
          <p>
            Questions? <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mark8ly.com'}`} className="text-foreground-secondary hover:underline">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mark8ly.com'}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
