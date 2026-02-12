'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowRight,
  ChevronDown,
  Check,
  Globe,
  Menu,
  X,
  Star,
  Shield,
  Zap,
  Clock,
  CreditCard,
  Package,
  BarChart3,
  Users,
  Headphones,
  LucideIcon,
} from 'lucide-react';

import { Footer } from '../components/Footer';
import { useAuthStore } from '../lib/store/auth-store';
import { detectLocation, type LocationData } from '../lib/api/location';

// Icon mapping for dynamic icons from database
const iconMap: Record<string, LucideIcon> = {
  Package,
  CreditCard,
  BarChart3,
  Headphones,
  Users,
  Shield,
  Zap,
  Clock,
  Star,
  Check,
};

// Fallback content (used if API fails)
const fallbackFeatures = [
  {
    title: 'Make It Yours',
    description: 'Beautiful themes you can customize to match your brand. No design skills needed.',
    iconName: 'Package',
  },
  {
    title: 'Sell Everywhere',
    description: 'Accept payments from customers around the world in their preferred currency.',
    iconName: 'CreditCard',
  },
  {
    title: 'Know Your Numbers',
    description: 'Simple analytics that help you understand what\'s working and what\'s not.',
    iconName: 'BarChart3',
  },
  {
    title: 'We\'ve Got Your Back',
    description: 'Real humans ready to help when you need it. No chatbots, just friendly support.',
    iconName: 'Headphones',
  },
];

const fallbackTrustBadges = [
  { iconName: 'Users', label: 'No Developer Needed' },
  { iconName: 'Shield', label: 'SSL Secured' },
  { iconName: 'Zap', label: '99.9% Uptime' },
  { iconName: 'Clock', label: '24/7 Support' },
];

const fallbackPricingPlans: Array<{
  name: string; slug: string; price: string; currency?: string; billingCycle?: string;
  tagline?: string; trialDays?: number; featured?: boolean;
  features: Array<{ feature: string }>;
  regionalPricing?: Array<{ countryCode: string; price: string; currency: string }>;
}> = [
  {
    name: 'Free Trial',
    slug: 'free-trial',
    price: '0',
    currency: 'INR',
    billingCycle: 'monthly',
    trialDays: 365,
    featured: false,
    tagline: 'Get started risk-free',
    features: [
      { feature: 'Unlimited products' },
      { feature: 'Mobile-responsive storefront' },
      { feature: 'Payment processing' },
      { feature: 'Order management' },
      { feature: '24/7 human support' },
    ],
  },
  {
    name: 'Professional',
    slug: 'professional',
    price: '499',
    currency: 'INR',
    billingCycle: 'monthly',
    featured: true,
    tagline: 'Everything you need to grow',
    features: [
      { feature: 'Sell as many products as you want' },
      { feature: 'Use your own domain name' },
      { feature: 'Looks great on phones' },
      { feature: 'Accept cards, UPI, and wallets' },
      { feature: 'Analytics dashboard' },
      { feature: 'No transaction fees from us' },
      { feature: 'Real humans ready to help, 24/7' },
    ],
  },
];

const fallbackFaqs = [
  {
    question: 'I\'m not very technical. Can I still use this?',
    answer: 'Absolutely. We built this for people who want to focus on their business, not on learning software. If you can use email, you can use mark8ly. And if you get stuck, we\'re here to help—no judgment, just friendly guidance.',
  },
  {
    question: 'What happens after the free period?',
    answer: 'After your free period, simple flat pricing kicks in. No hidden fees, no transaction costs from us, no surprises. And you can cancel anytime.',
  },
  {
    question: 'Are there transaction fees or payment processing fees?',
    answer: 'You\'ll pay standard payment processing fees (around 2% for UPI, 2-3% for cards). But unlike other platforms, we don\'t take an extra cut. Your money is your money.',
  },
  {
    question: 'What if I decide this isn\'t for me?',
    answer: 'Cancel anytime, no questions asked. You can even export all your data—products, customers, orders—and take it with you. No hard feelings.',
  },
  {
    question: 'How many products can I add?',
    answer: 'As many as you want. Unlimited products, unlimited photos, unlimited everything. We\'re not in the business of nickel-and-diming you.',
  },
  {
    question: 'I already have a store on Shopify. Can I switch?',
    answer: 'Yes, and it\'s easier than you might think. We can import your products and customer data automatically. Most stores are fully migrated within a day.',
  },
  {
    question: 'What if I get stuck or need help?',
    answer: 'Just reach out. Our support team is made up of real people who actually want to help you succeed. Average response time is under 4 hours.',
  },
  {
    question: 'Do I need to hire a developer to set this up?',
    answer: 'Not at all. That\'s the whole point. You can set up your entire store yourself—customize the design, add products, configure payments—all without writing a single line of code. Save the ₹50,000+ you\'d spend on a developer and put it back into your business.',
  },
];

const fallbackTestimonials: Array<{ quote: string; name: string; role: string; company?: string; initials: string }> = [
  {
    quote: "I spent months trying to figure out Shopify. With mark8ly, I had my store up in an afternoon. It just... works.",
    name: "Sarah Chen",
    role: "Founder",
    company: "BloomBox",
    initials: "SC",
  },
  {
    quote: "The onboarding was so smooth I thought I must be missing something. Nope—it really is that simple. My store was live the same day.",
    name: "Marcus Rivera",
    role: "Owner",
    company: "Craft & Co",
    initials: "MR",
  },
  {
    quote: "Finally, an e-commerce platform that doesn't make me feel stupid. Clean, fast, and the support team actually responds.",
    name: "Emily Tran",
    role: "Founder",
    company: "Luna Candles",
    initials: "ET",
  },
];

// Demo dashboard metrics (can be replaced with API data)
const demoMetrics = {
  revenue: {
    INR: 103750,
    default: 1350,
  },
  orders: 284,
  visitors: '3.2K',
  newOrder: {
    INR: 7400,
    default: 96,
  },
};

// Rating data (can be replaced with API data)
const ratingData = {
  rating: 4.9,
  reviewCount: 150,
};

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  AUD: 'A$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SGD: 'S$',
  NZD: 'NZ$',
};

// Types for API response
interface HomeContentResponse {
  data: {
    faqs: Array<{ question: string; answer: string }>;
    features: Array<{ title: string; description: string; iconName: string }>;
    testimonials: Array<{ quote: string; name: string; role: string; company?: string; initials: string }>;
    trustBadges: Array<{ label: string; iconName: string }>;
    paymentPlans: Array<{
      name: string;
      slug: string;
      price: string;
      currency?: string;
      billingCycle?: string;
      tagline?: string;
      description?: string;
      trialDays?: number;
      featured?: boolean;
      features: Array<{ feature: string }>;
      regionalPricing?: Array<{ countryCode: string; price: string; currency: string }>;
    }>;
  };
}

export default function Home() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated, user } = useAuthStore();

  // Fetch content from API
  const { data: contentData } = useSWR<HomeContentResponse>('/api/content/home', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // Detect user's location for localized pricing
  const { data: userLocation } = useSWR<LocationData>(
    'user-location',
    () => detectLocation(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
      onError: () => {},
    }
  );

  const userCountry = userLocation?.country || null;
  const userCurrency = userLocation?.currency || null;
  const isContentLoading = !contentData;

  // Use API data with fallback to hardcoded content
  const features = contentData?.data?.features?.length ? contentData.data.features : fallbackFeatures;
  const trustBadges = contentData?.data?.trustBadges?.length ? contentData.data.trustBadges : fallbackTrustBadges;
  const faqs = contentData?.data?.faqs?.length ? contentData.data.faqs : fallbackFaqs;
  const testimonials = contentData?.data?.testimonials?.length ? contentData.data.testimonials : fallbackTestimonials;
  // Extract pricing info from payment plans (always falls back so hero text is stable)
  const allPlans = contentData?.data?.paymentPlans?.length
    ? contentData.data.paymentPlans
    : fallbackPricingPlans;
  const freePlan = allPlans.find(
    (p) => parseFloat(p.price) === 0 || p.slug === 'free-trial' || p.slug === 'free'
  );
  const paidPlans = allPlans.filter((p) => parseFloat(p.price) > 0);
  const cheapestPaid = paidPlans.length > 0
    ? paidPlans.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b)
    : null;

  // Format price with location-based regional pricing
  const formatPlanPrice = (plan: typeof allPlans[number] | undefined, fallback = '$0'): string => {
    if (!plan) return fallback;
    if (parseFloat(plan.price) <= 0) {
      const symbol = userCurrency ? (CURRENCY_SYMBOLS[userCurrency] || '$') : '$';
      return `${symbol}0`;
    }
    // 1. Try regional pricing matching user's country
    if (userCountry && plan.regionalPricing?.length) {
      const regional = plan.regionalPricing.find((r) => r.countryCode === userCountry);
      if (regional) {
        const amount = Math.round(parseFloat(regional.price));
        const sym = CURRENCY_SYMBOLS[regional.currency] || regional.currency + ' ';
        return `${sym}${regional.currency === 'INR' ? amount.toLocaleString('en-IN') : amount.toLocaleString()}`;
      }
    }
    // 2. Try regional pricing matching user's currency
    if (userCurrency && plan.regionalPricing?.length) {
      const regional = plan.regionalPricing.find((r) => r.currency === userCurrency);
      if (regional) {
        const amount = Math.round(parseFloat(regional.price));
        const sym = CURRENCY_SYMBOLS[regional.currency] || regional.currency + ' ';
        return `${sym}${regional.currency === 'INR' ? amount.toLocaleString('en-IN') : amount.toLocaleString()}`;
      }
    }
    // 3. Fall back to plan's own currency
    const price = Math.round(parseFloat(plan.price));
    const currency = plan.currency || 'INR';
    const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
    const formatted = currency === 'INR' ? price.toLocaleString('en-IN') : price.toLocaleString();
    return `${symbol}${formatted}`;
  };

  const getBillingLabel = (plan: typeof allPlans[number]): string => {
    if (parseFloat(plan.price) <= 0) return '';
    if (plan.billingCycle === 'yearly') return '/year';
    if (plan.billingCycle === 'one_time') return ' one-time';
    return '/month';
  };

  const trialMonths = freePlan?.trialDays ? Math.round(freePlan.trialDays / 30) : 12;
  const cheapestPrice = cheapestPaid ? formatPlanPrice(cheapestPaid) : '';
  const pricingTagline = freePlan?.tagline || `${trialMonths} months free, then ${cheapestPrice}/mo`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.onboardingComplete) {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, user, router]);


  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background border-b border-border ${
        scrolled ? 'shadow-sm' : ''
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src="/icon-192.png"
              alt="mark8ly icon"
              className="h-9 w-auto object-contain"
              style={{ marginRight: '0px' }}
            />
            <span className="text-[1.375rem] font-serif font-medium tracking-[-0.015em] text-foreground-secondary">mark8ly</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonial" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">Stories</a>
            <a href="/presentation" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">Demo</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/onboarding')}
              className="hidden sm:block bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Start Free
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <nav className="max-w-5xl mx-auto px-6 py-4 space-y-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-foreground-secondary hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-foreground-secondary hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonial" onClick={() => setMobileMenuOpen(false)} className="block text-foreground-secondary hover:text-foreground transition-colors">Stories</a>
              <a href="/presentation" onClick={() => setMobileMenuOpen(false)} className="block text-foreground-secondary hover:text-foreground transition-colors">Demo</a>
              <div className="pt-4 border-t border-border space-y-3">
                <button
                  onClick={() => { router.push('/onboarding'); setMobileMenuOpen(false); }}
                  className="w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Start Free
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 reveal-once">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-sage-50 text-sage-700 text-sm font-medium border border-sage-200 mb-6 gap-2">
              <span className="flex h-2 w-2 rounded-full bg-sage-500 animate-pulse" aria-hidden="true" />
              <span>{pricingTagline}</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6 leading-[1.05] text-foreground">
              Your online store,
              <br />
              <span className="text-foreground-secondary">ready this afternoon</span>
            </h1>
            <p className="text-xl text-foreground-secondary max-w-xl mb-8 leading-relaxed">
              Set up your store in under an hour—no developer needed. Skip the ₹50,000+ customization costs and do it yourself. Just you, your products, and customers ready to buy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
              <button
                onClick={() => router.push('/onboarding')}
                className="group bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-medium hover:bg-primary-hover transition-all hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                Start Your Free Year
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="/presentation"
                className="px-6 py-4 rounded-xl text-base font-medium text-foreground-secondary hover:text-foreground hover:bg-warm-50 transition-all border border-warm-200"
              >
                See how it works
              </a>
            </div>
            <p className="text-sm text-foreground-tertiary mb-8">
              No credit card required. Cancel anytime.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-foreground-tertiary">
              {trustBadges.map((badge, i) => {
                const BadgeIcon = iconMap[badge.iconName] || Shield;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <BadgeIcon className="w-4 h-4" />
                    <span>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative" role="img" aria-label="Preview of mark8ly admin dashboard showing revenue, orders, visitors, and a sales growth chart">
            {/* Dashboard mockup */}
            <div className="rounded-2xl border border-warm-200 bg-white shadow-lg p-5 transform hover:scale-[1.02] transition-transform duration-300" aria-hidden="true">
              {/* Browser bar */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-warm-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-warm-200" />
                  <div className="w-3 h-3 rounded-full bg-warm-200" />
                  <div className="w-3 h-3 rounded-full bg-warm-200" />
                </div>
                <div className="flex-1 h-6 bg-warm-50 rounded-md mx-4" />
              </div>
              {/* Dashboard content */}
              <div className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-sage-50 border border-sage-100">
                    <div className="text-xs text-sage-600 mb-1">Revenue</div>
                    <div className="text-lg font-semibold text-foreground">
                      {(CURRENCY_SYMBOLS[userCurrency || 'INR'] || '₹')}
                      {(!userCurrency || userCurrency === 'INR'
                        ? demoMetrics.revenue.INR.toLocaleString('en-IN')
                        : demoMetrics.revenue.default.toLocaleString()
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-warm-50 border border-warm-100">
                    <div className="text-xs text-warm-600 mb-1">Orders</div>
                    <div className="text-lg font-semibold text-foreground">{demoMetrics.orders}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-warm-50 border border-warm-100">
                    <div className="text-xs text-warm-600 mb-1">Visitors</div>
                    <div className="text-lg font-semibold text-foreground">{demoMetrics.visitors}</div>
                  </div>
                </div>
                {/* Chart placeholder */}
                <div className="h-32 rounded-xl bg-gradient-to-t from-sage-100/50 to-transparent border border-warm-100 flex items-end p-4 gap-2">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 bg-sage-400/60 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
                {/* Product rows */}
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-warm-50/50">
                      <div className="w-10 h-10 rounded-lg bg-warm-200" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-warm-200 rounded mb-1" />
                        <div className="h-2 w-16 bg-warm-100 rounded" />
                      </div>
                      <div className="h-3 w-12 bg-sage-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating notification - new order */}
            <div className="absolute -bottom-4 -left-4 p-4 rounded-xl bg-white border border-warm-200 shadow-lg" aria-hidden="true">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-sage-600" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">New order</div>
                  <div className="text-sm font-medium text-foreground">
                    {(CURRENCY_SYMBOLS[userCurrency || 'INR'] || '₹')}
                    {(!userCurrency || userCurrency === 'INR'
                      ? demoMetrics.newOrder.INR.toLocaleString('en-IN')
                      : demoMetrics.newOrder.default.toLocaleString()
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Floating rating badge */}
            <div className="absolute -top-4 -right-4 p-3 rounded-xl bg-white border border-warm-200 shadow-lg" aria-hidden="true">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-xs text-foreground-tertiary mt-1">{ratingData.rating} rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-t border-warm-200 reveal-once">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-4 text-foreground">
              Everything you need,
              <br />
              <span className="text-foreground-secondary">nothing you don&apos;t</span>
            </h2>
            <p className="text-lg text-foreground-secondary">
              We built the tools that matter and left out the complexity that doesn&apos;t.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = iconMap[feature.iconName] || Package;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-xl bg-white border border-warm-200 shadow-sm hover:shadow-md hover:border-warm-300 transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-200">
                    <Icon className="w-6 h-6 text-warm-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{feature.title}</h3>
                  <p className="text-foreground-secondary leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-warm-200 reveal-once">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-4 text-foreground">
              Simple, honest pricing
            </h2>
            <p className="text-lg text-foreground-secondary">
              {freePlan
                ? `Start free. Stay free for ${trialMonths} months. Then one flat price.`
                : 'One flat price. No surprises.'}
            </p>
          </div>

          {/* Location indicator */}
          {userLocation?.country_name && (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-tertiary mb-6">
              <Globe className="w-4 h-4" />
              <span>Prices shown for {userLocation.country_name}</span>
            </div>
          )}

          {/* Plans Grid */}
          {isContentLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-warm-200 bg-white p-6 sm:p-8 animate-pulse flex flex-col">
                  <div className="h-5 w-24 bg-warm-200 rounded mb-2" />
                  <div className="h-3 w-40 bg-warm-100 rounded mb-6" />
                  <div className="h-8 w-28 bg-warm-200 rounded mb-1" />
                  <div className="h-3 w-16 bg-warm-100 rounded mb-6" />
                  <div className="space-y-3 mb-6 flex-1">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-warm-100 rounded flex-shrink-0" />
                        <div className="h-3 bg-warm-100 rounded" style={{ width: `${55 + j * 8}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="h-11 bg-warm-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              allPlans.length === 1 ? 'max-w-md mx-auto' :
              allPlans.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' :
              allPlans.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
              'sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {allPlans.map((plan) => {
                const isFree = parseFloat(plan.price) <= 0;
                const isFeatured = plan.featured;
                return (
                  <div
                    key={plan.slug}
                    className={`rounded-2xl border bg-white p-6 sm:p-8 flex flex-col transition-all duration-200 hover:shadow-md ${
                      isFeatured ? 'border-foreground ring-1 ring-foreground/10 shadow-md' : 'border-warm-200 shadow-sm'
                    }`}
                  >
                    {isFeatured && (
                      <div className="inline-flex self-start items-center px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium mb-3">
                        Most popular
                      </div>
                    )}

                    <h3 className="font-serif text-lg font-medium text-foreground mb-1">{plan.name}</h3>
                    {plan.tagline && (
                      <p className="text-sm text-foreground-tertiary mb-3">{plan.tagline}</p>
                    )}

                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-serif font-medium text-foreground ${isFeatured ? 'text-3xl' : 'text-2xl'}`}>
                          {formatPlanPrice(plan)}
                        </span>
                        {!isFree && (
                          <span className="text-foreground-secondary text-sm">{getBillingLabel(plan)}</span>
                        )}
                      </div>
                      {isFree && plan.trialDays && plan.trialDays > 0 && (
                        <p className="text-sm text-foreground-secondary mt-1">
                          for <span className="font-semibold text-foreground">{Math.round(plan.trialDays / 30)} months</span>
                        </p>
                      )}
                    </div>

                    {plan.features?.length > 0 && (
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.slice(0, 6).map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-sage-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground-secondary">{f.feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 6 && (
                          <li className="text-sm text-foreground-tertiary pl-6">
                            +{plan.features.length - 6} more
                          </li>
                        )}
                      </ul>
                    )}

                    <button
                      onClick={() => router.push('/onboarding')}
                      className="w-full py-3 rounded-lg text-base font-medium transition-all bg-foreground text-background hover:bg-foreground/90 hover:shadow-sm"
                    >
                      {isFree ? 'Start Free' : 'Get Started'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonial" className="py-24 px-6 border-t border-warm-200 reveal-once">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-foreground-secondary">Rated {ratingData.rating}/5 from {ratingData.reviewCount}+ reviews</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((testimonial, i) => (
              <div key={i} className="p-6 rounded-xl bg-white border border-warm-200 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-foreground leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center text-sm font-medium text-warm-700">
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-foreground-tertiary">{testimonial.role}{testimonial.company ? `, ${testimonial.company}` : ''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-24 px-6 border-t border-warm-200 reveal-once">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-6 text-foreground">
            Three steps to your new store
            </h2>
            <p className="text-lg text-foreground-secondary mb-12">
              Tell us about yourself, add your products, and you&apos;re live.
              That&apos;s really all there is to it.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Tell us who you are', body: 'Your name, your business—the basics.' },
              { step: '2', title: 'Add what you sell', body: 'Upload products, set prices, organize your catalog.' },
              { step: '3', title: 'You\'re open for business', body: 'Start sharing your store and making sales.' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-warm-200 bg-white p-6">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium mb-4">
                  {item.step}
                </div>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-foreground-secondary">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <button
              onClick={() => router.push('/onboarding')}
              className="group bg-primary text-primary-foreground px-8 py-3.5 rounded-lg text-base font-medium transition-colors inline-flex items-center gap-2 hover:bg-primary-hover"
            >
              Let's Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 border-t border-warm-200 reveal-once">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground">
              Questions you might have
            </h2>
          </div>

          <div className="space-y-3" role="list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl bg-white border border-warm-200 overflow-hidden"
                role="listitem"
              >
                <button
                  id={`faq-button-${index}`}
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-content-${index}`}
                  className="w-full p-6 text-left flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-foreground pr-4 text-lg">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-foreground-tertiary transition-transform duration-200 flex-shrink-0 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-content-${index}`}
                  role="region"
                  aria-labelledby={`faq-button-${index}`}
                  className={`overflow-hidden transition-all duration-200 ${
                    openFaq === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    <p className="text-foreground-secondary leading-relaxed text-lg">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-warm-200 reveal-once">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-6 text-foreground">
            Ready to open your doors?
          </h2>
          <p className="text-xl text-foreground-secondary mb-10">
            Your store is waiting. Start free today.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="group bg-primary text-primary-foreground px-10 py-4 rounded-lg text-lg font-medium hover:bg-primary-hover transition-colors inline-flex items-center gap-3"
          >
            Create Your Store — Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-foreground-tertiary mt-4">
            {pricingTagline}. Cancel anytime.
          </p>
        </div>
      </section>

      <Footer />

    </div>
  );
}
