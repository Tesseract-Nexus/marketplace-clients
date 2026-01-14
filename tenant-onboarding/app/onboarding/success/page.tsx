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
  Heart,
  Users,
  Zap,
  Star,
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Play,
  Quote,
  TrendingUp,
  Award,
  Rocket,
} from 'lucide-react';
import { useOnboardingStore } from '../../../lib/store/onboarding-store';
import { analytics } from '../../../lib/analytics/posthog';
import { getTenantUrls } from '../../../lib/types/tenant';

export default function SuccessPage() {
  const router = useRouter();
  const {
    businessInfo,
    contactInfo,
    storeSetup,
    sessionId,
    tenantResult,
  } = useOnboardingStore();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

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
    contactFirstName: contactInfo?.first_name || 'there',
    contactEmail: contactInfo?.email || '',
    tenantId: tenantResult?.tenant_id,
  }), [tenantResult, businessInfo, contactInfo, storeSetup]);

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

    setTimeout(() => setShowConfetti(false), 4000);
  }, [hasHydrated, sessionId, tenantResult, router, tenantSetup]);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] relative overflow-hidden">
      {/* Subtle Background Gradient Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Confetti Celebration */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(30)].map((_, i) => {
            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
            return (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${colors[i % 5]} animate-confetti-fall`}
                style={{
                  left: `${(i * 3.33) % 100}%`,
                  animationDelay: `${(i * 0.1) % 2}s`,
                  animationDuration: `${3 + (i % 3)}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">

        {/* Hero Section - Premium Celebration */}
        <div className="text-center mb-16 sm:mb-24">
          {/* Success Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-8 animate-fade-in-up">
            <CheckCircle className="w-4 h-4" />
            Setup Complete
          </div>

          {/* Personalized Greeting */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight opacity-0 animate-fade-in-up [animation-delay:0.1s]">
            {getGreeting()}, {tenantSetup.contactFirstName}.
          </h1>

          {/* Welcome Message */}
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-4 opacity-0 animate-fade-in-up [animation-delay:0.2s]">
            <span className="font-semibold text-slate-900 dark:text-white">{tenantSetup.storeName}</span> is now live.
          </p>

          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up [animation-delay:0.3s]">
            Welcome to the Tesseract family. We're honored to be part of your journey.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up [animation-delay:0.4s]">
            <a
              href={realAdminUrl}
              className="group inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-slate-900/20 dark:shadow-white/20"
            >
              <LayoutDashboard className="w-5 h-5" />
              Enter Your Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              <Store className="w-5 h-5" />
              View your store
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Trust Indicators - Tesla Style */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-16 sm:mb-24 opacity-0 animate-fade-in-up [animation-delay:0.5s]">
          <div className="text-center p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">SSL Secured</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">256-bit encryption</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">Live Worldwide</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Global CDN</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">99.99% Uptime</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Always available</p>
          </div>
        </div>

        {/* Your Store URLs - Clean Card */}
        <div className="mb-16 sm:mb-24 opacity-0 animate-fade-in-up [animation-delay:0.6s]">
          <div className="bg-white dark:bg-white/5 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 flex items-center justify-center">
                <Store className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Store</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Bookmark these links</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Storefront URL */}
              <div className="group">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Customer Storefront</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3.5 border border-slate-200 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20 transition-colors">
                    <code className="text-sm font-mono text-slate-700 dark:text-slate-300">{storeUrl}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(storeUrl)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all hover:scale-105"
                    title="Copy URL"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all hover:scale-105"
                    title="Open Store"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Admin URL */}
              <div className="group">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Admin Dashboard</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3.5 border border-slate-200 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20 transition-colors">
                    <code className="text-sm font-mono text-slate-700 dark:text-slate-300">{adminUrl}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminUrl)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all hover:scale-105"
                    title="Copy URL"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                  <a
                    href={realAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all hover:scale-105"
                    title="Open Admin"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next - Journey Path */}
        <div className="mb-16 sm:mb-24 opacity-0 animate-fade-in-up [animation-delay:0.7s]">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">Your Next Steps</h2>
            <p className="text-slate-500 dark:text-slate-400">Everything you need to launch successfully</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: 'Add Products',
                description: 'Create your first product listing and start building your catalog',
                icon: ShoppingBag,
                time: '5 min',
                color: 'from-blue-500 to-indigo-600',
                url: `${realAdminUrl}/products/new`,
              },
              {
                step: 2,
                title: 'Set Up Payments',
                description: 'Connect Stripe or PayPal to start accepting payments securely',
                icon: TrendingUp,
                time: '3 min',
                color: 'from-emerald-500 to-teal-600',
                url: `${realAdminUrl}/settings/payments`,
              },
              {
                step: 3,
                title: 'Customize Design',
                description: 'Make your store uniquely yours with themes and branding',
                icon: Sparkles,
                time: '10 min',
                color: 'from-purple-500 to-pink-600',
                url: `${realAdminUrl}/settings/theme`,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.step}
                  href={item.url}
                  className="group relative bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full">{item.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                  <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-slate-300 dark:text-white/20 group-hover:text-slate-500 dark:group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Social Proof - Community */}
        <div className="mb-16 sm:mb-24 opacity-0 animate-fade-in-up [animation-delay:0.8s]">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white/10 dark:to-white/5 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
                <Heart className="w-4 h-4 text-rose-400" />
                You're in great company
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Join 10,000+ thriving merchants
              </h2>
              <p className="text-slate-300 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                From solo entrepreneurs to growing brands, Tesseract powers businesses of all sizes.
                You're now part of a community that's collectively processed over $500M in sales.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">10K+</p>
                  <p className="text-sm text-slate-400">Active Stores</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">$500M+</p>
                  <p className="text-sm text-slate-400">Sales Processed</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">150+</p>
                  <p className="text-sm text-slate-400">Countries</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mb-16 sm:mb-24 opacity-0 animate-fade-in-up [animation-delay:0.9s]">
          <div className="bg-white dark:bg-white/5 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-white/10 relative">
            <Quote className="absolute top-8 left-8 w-10 h-10 text-slate-200 dark:text-white/10" />
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl font-bold text-white">
                  S
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed mb-4 italic">
                  "Switching to Tesseract was the best decision for our business. The onboarding was seamless,
                  and we were selling within hours. Our sales increased 40% in the first month."
                </p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Sarah Chen</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Founder, Bloom & Wild Co.</p>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Help & Resources */}
        <div className="mb-16 opacity-0 animate-fade-in-up [animation-delay:1s]">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">We're Here For You</h2>
            <p className="text-slate-500 dark:text-slate-400">24/7 support from real humans who care about your success</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <a
              href="/docs"
              className="group bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Video Tutorials</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Step-by-step guides to master every feature</p>
            </a>

            <a
              href="/community"
              className="group bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Community</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Connect with other merchants and share insights</p>
            </a>

            <a
              href="/support"
              className="group bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Priority Support</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Real humans, not bots. Average response: 2 minutes</p>
            </a>
          </div>
        </div>

        {/* Final CTA - Warm Closing */}
        <div className="text-center opacity-0 animate-fade-in-up [animation-delay:1.1s]">
          <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 dark:from-emerald-500/20 dark:via-blue-500/20 dark:to-purple-500/20 rounded-3xl p-10 sm:p-14 border border-slate-200/50 dark:border-white/10">
            <Rocket className="w-12 h-12 text-slate-900 dark:text-white mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to make your first sale?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8">
              Your store is live and waiting. The world is ready to discover what you have to offer.
            </p>
            <a
              href={realAdminUrl}
              className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <LayoutDashboard className="w-5 h-5" />
              Start Building
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-slate-400 dark:text-slate-500">
          <p>Questions? Reach us anytime at <a href="mailto:support@tesserix.app" className="text-slate-600 dark:text-slate-300 hover:underline">support@tesserix.app</a></p>
        </div>
      </div>
    </div>
  );
}
