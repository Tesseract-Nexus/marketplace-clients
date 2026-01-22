'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Globe,
  Users,
  CreditCard,
  Package,
  BarChart3,
  Sparkles,
  Star,
  Smartphone,
  Lock,
  Languages,
  DollarSign,
  Clock,
  Maximize2,
  Minimize2,
  Home,
  Layers,
  Server,
  Database,
  Cloud,
  X,
  LucideIcon,
} from 'lucide-react';

// ===========================================
// Types
// ===========================================

interface SlideBase {
  id: number;
  type: string;
  label?: string;
  title?: string;
  titleGradient?: string;
  titleHighlight?: string;
  subtitle?: string;
}

interface ProblemItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface EcosystemCard {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

interface GlobalStat {
  value: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}

interface SecurityFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureCategory {
  title: string;
  features: string[];
}

// PricingPlan interface removed - using simpler home page style pricing

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

interface ComparisonRow {
  feature: string;
  tesseract: string;
  shopify: string;
  woo: string;
}

// API Response types
interface PaymentPlanResponse {
  name: string;
  slug: string;
  price: string;
  currency: string;
  tagline?: string;
  features: Array<{ feature: string }>;
}

interface TestimonialResponse {
  quote: string;
  name: string;
  role: string;
  company?: string;
  initials: string;
  rating?: number;
}

interface PresentationContentResponse {
  data: {
    paymentPlans: PaymentPlanResponse[];
    testimonials: TestimonialResponse[];
    features: Array<{ title: string; description: string; iconName: string }>;
  };
}

// ===========================================
// Fallback Content
// ===========================================

// Fallback pricing (matching home page style)
const fallbackPricingTagline = '12 months free, then ₹299/mo';
const fallbackMonthlyPrice = '₹299';
const fallbackPricingFeatures = [
  'Unlimited products with photos',
  'Your own custom domain',
  'Accept cards, UPI, and wallets',
  'Track orders from one place',
  'Let customers save their info',
  'Automatic emails when orders ship',
  'See what\'s selling (and what\'s not)',
  'No developer needed—do it yourself',
  'Real humans ready to help, 24/7',
];

const fallbackTestimonials: Testimonial[] = [
  {
    name: 'Sarah Kim',
    role: 'CEO',
    company: 'Artisan Goods Co.',
    avatar: 'SK',
    content: 'Tesserix transformed our business. We went from a local shop to selling in 15 countries within 6 months.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'CTO',
    company: 'Brand Collective',
    avatar: 'MR',
    content: 'The multi-tenant architecture means we can run 50+ brands from one platform. Incredible efficiency gains.',
    rating: 5,
  },
  {
    name: 'Aisha Patel',
    role: 'Founder',
    company: 'Spice Route',
    avatar: 'AP',
    content: 'Setup took 10 minutes. Our first sale came within an hour. This is how e-commerce should work.',
    rating: 5,
  },
];

// ===========================================
// Static Slide Data
// ===========================================

const problemItems: ProblemItem[] = [
  { icon: Clock, title: 'Months to Launch', description: 'Complex setups taking 6-12 months with expensive developers' },
  { icon: DollarSign, title: 'Hidden Costs', description: 'Transaction fees, plugins, hosting costs that add up quickly' },
  { icon: Smartphone, title: 'No Mobile Experience', description: 'Clunky mobile sites that lose 70% of mobile customers' },
  { icon: Globe, title: 'Limited Global Reach', description: 'Single currency, single language - missing 95% of the world' },
];

const ecosystemCards: EcosystemCard[] = [
  {
    icon: Home,
    title: 'Beautiful Storefront',
    description: 'Stunning, conversion-optimized stores',
    features: ['Responsive Design', 'SEO Optimized', 'Fast Loading'],
  },
  {
    icon: Layers,
    title: 'Powerful Admin',
    description: 'Manage your entire business',
    features: ['92+ Management Pages', 'Real-time Analytics', 'Role-based Access'],
  },
  {
    icon: Smartphone,
    title: 'Native Mobile App',
    description: 'iOS & Android apps',
    features: ['Push Notifications', 'Biometric Login', 'Offline Support'],
  },
];

const globalStats: GlobalStat[] = [
  { value: '27', label: 'Languages Supported', detail: 'Including RTL (Arabic, Hebrew)', icon: Languages },
  { value: '50+', label: 'Currencies', detail: 'Real-time exchange rates', icon: DollarSign },
  { value: '2', label: 'Payment Gateways', detail: 'Stripe (Global) + Razorpay (India)', icon: CreditCard },
];

const securityFeatures: SecurityFeature[] = [
  { icon: Lock, title: 'End-to-End Encryption', description: 'All data encrypted with AES-256' },
  { icon: Shield, title: 'Service Mesh Security', description: 'Istio mTLS for all services' },
  { icon: Users, title: 'RBAC Access Control', description: '100+ granular permissions' },
  { icon: Server, title: 'PII Data Masking', description: 'Auto masking in logs' },
  { icon: Database, title: 'SSO Integration', description: 'Keycloak, Azure AD, Google' },
  { icon: Cloud, title: '99.9% Uptime SLA', description: 'Enterprise reliability' },
];

const featureCategories: FeatureCategory[] = [
  { title: 'Products & Inventory', features: ['Unlimited products', 'Multi-warehouse', 'Bulk import', 'Digital products'] },
  { title: 'Orders & Fulfillment', features: ['Auto processing', 'Multi-carrier', 'Returns mgmt', 'Real-time tracking'] },
  { title: 'Marketing & Growth', features: ['Coupons & discounts', 'Gift cards', 'Email campaigns', 'Cart recovery'] },
  { title: 'Customer Experience', features: ['Customer accounts', 'Wishlists', 'Reviews & ratings', 'Support tickets'] },
  { title: 'Analytics & Reports', features: ['Real-time dashboards', 'Sales analytics', 'Customer insights', 'Inventory reports'] },
  { title: 'Operations', features: ['Staff management', 'Vendor marketplace', 'Tax automation', 'Multi-location'] },
];

const comparisonData: ComparisonRow[] = [
  { feature: 'Setup Time', tesseract: '5 minutes', shopify: '1-2 hours', woo: 'Days/Weeks' },
  { feature: 'Native Mobile App', tesseract: 'Included', shopify: 'Extra cost', woo: 'Not included' },
  { feature: 'Multi-tenant', tesseract: 'Built-in', shopify: 'Not available', woo: 'Plugin required' },
  { feature: 'Languages', tesseract: '27 included', shopify: 'Limited', woo: 'Plugin required' },
  { feature: 'AI Features', tesseract: 'Built-in', shopify: 'Apps required', woo: 'Plugins required' },
  { feature: 'Transaction Fees', tesseract: '0%', shopify: '0.5-2%', woo: 'Varies' },
];

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ===========================================
// Main Component
// ===========================================

export default function PresentationPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const totalSlides = 11;

  // Fetch dynamic content
  const { data: contentData } = useSWR<PresentationContentResponse>('/api/content/presentation', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // Extract pricing info from payment plans (matching home page style)
  const pricingFeatures = contentData?.data?.paymentPlans?.[0]?.features?.length
    ? contentData.data.paymentPlans[0].features.map((f) => f.feature)
    : fallbackPricingFeatures;

  const freePlan = contentData?.data?.paymentPlans?.find((p) => p.slug === 'free-trial');
  const proPlan = contentData?.data?.paymentPlans?.find((p) => p.slug === 'pro');
  const pricingTagline = freePlan?.tagline || fallbackPricingTagline;
  const monthlyPrice = proPlan?.price ? `₹${Math.round(parseFloat(proPlan.price))}` : fallbackMonthlyPrice;

  const testimonials: Testimonial[] = contentData?.data?.testimonials?.length
    ? contentData.data.testimonials.map((t) => ({
        name: t.name,
        role: t.role,
        company: t.company || '',
        avatar: t.initials,
        content: t.quote,
        rating: t.rating || 5,
      }))
    : fallbackTestimonials;

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= totalSlides) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(totalSlides - 1);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          router.push('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, toggleFullscreen, totalSlides, router]);

  // Touch navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    const threshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > threshold) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  const progress = (currentSlide / (totalSlides - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Background Effects - simplified on mobile for performance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hidden sm:block absolute top-0 left-1/4 w-[400px] h-[400px] bg-warm-200/20 rounded-full blur-[100px]" />
        <div className="hidden sm:block absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-warm-200/15 rounded-full blur-[100px]" />
        {/* Mobile: simple gradient background instead of heavy blur */}
        <div className="sm:hidden absolute inset-0 bg-gradient-to-br from-warm-100/50 to-transparent" />
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-warm-200 z-50">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Controls */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="hidden sm:block p-2 sm:p-3 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-warm-700" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-warm-700" />}
        </button>
        <button
          onClick={() => router.push('/')}
          className="p-2 sm:p-3 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 transition-all"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-warm-700" />
        </button>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 text-xs sm:text-sm text-muted-foreground">
        {currentSlide + 1} / {totalSlides}
        <span className="md:hidden ml-2 text-foreground-tertiary">• Swipe to navigate</span>
      </div>

      {/* Navigation Arrows - hidden on mobile, use swipe instead */}
      <button
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className="hidden md:block absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 p-2 lg:p-3 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-warm-700 rotate-180" />
      </button>
      <button
        onClick={nextSlide}
        disabled={currentSlide === totalSlides - 1}
        className="hidden md:block absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 p-2 lg:p-3 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-warm-700" />
      </button>

      {/* Main Content */}
      <div className="relative h-full flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16">
        <div className="max-w-6xl w-full">
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>

            {/* Slide 0: Title */}
            {currentSlide === 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-100 border border-warm-300 mb-8">
                  <Sparkles className="w-4 h-4 text-foreground-tertiary" />
                  <span className="text-sm text-foreground-secondary">AI-powered e-commerce platform</span>
                </div>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-xl font-serif font-semibold text-foreground">Tesserix</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-medium mb-6">
                  <span className="text-foreground">The Future of</span>
                  <br />
                  <span className="text-foreground-secondary">E-Commerce</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Build, launch, and scale your online store in minutes. Join thousands of brands already growing with us.
                </p>
              </div>
            )}

            {/* Slide 1: Problem */}
            {currentSlide === 1 && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  THE CHALLENGE
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">Traditional E-Commerce is </span>
                  <span className="text-destructive">Broken</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {problemItems.map((problem, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-destructive/30 transition-all shadow-card">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-destructive/10 flex items-center justify-center mb-3 sm:mb-4">
                        <problem.icon className="w-5 h-5 sm:w-7 sm:h-7 text-destructive" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">{problem.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{problem.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 2: Ecosystem */}
            {currentSlide === 2 && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  COMPLETE ECOSYSTEM
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">Everything You Need, </span>
                  <span className="text-foreground-secondary">All-in-One</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {ecosystemCards.map((card, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-warm-300 transition-colors shadow-card">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center mb-3 sm:mb-4">
                        <card.icon className="w-5 h-5 sm:w-7 sm:h-7 text-foreground-secondary" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">{card.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{card.description}</p>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {card.features.map((feature, fidx) => (
                          <li key={fidx} className="text-xs text-foreground-secondary flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-warm-400 rounded-full flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 3: Global */}
            {currentSlide === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="flex justify-center order-2 md:order-1">
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48">
                    {/* Animations hidden on mobile for performance */}
                    <div className="hidden sm:block absolute inset-0 border border-warm-300/50 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="hidden sm:block absolute inset-4 border border-warm-300/30 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    {/* Static rings on mobile */}
                    <div className="sm:hidden absolute inset-0 border border-warm-300/30 rounded-full" />
                    <div className="sm:hidden absolute inset-3 border border-warm-300/20 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center">
                      <Globe className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2 text-center md:text-left">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                    GO GLOBAL
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-medium mb-6 sm:mb-8">
                    <span className="text-foreground">Sell Anywhere. </span>
                    <span className="text-foreground-secondary">Speak Any Language.</span>
                  </h2>
                  <div className="space-y-6">
                    {globalStats.map((stat, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-card">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-4xl font-bold text-foreground-secondary">{stat.value}</span>
                          <stat.icon className="w-8 h-8 text-foreground-tertiary" />
                        </div>
                        <div className="text-foreground font-medium">{stat.label}</div>
                        <div className="text-sm text-muted-foreground">{stat.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 4: AI Features */}
            {currentSlide === 4 && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                  AI-POWERED
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-8 sm:mb-12">
                  <span className="text-foreground">Intelligence </span>
                  <span className="text-foreground-secondary">Built In</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
                  <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left shadow-card">
                    <div className="mb-3 sm:mb-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Generate description for:</div>
                      <div className="text-base sm:text-lg font-medium text-foreground-secondary">&ldquo;Vintage Leather Messenger Bag&rdquo;</div>
                    </div>
                    <div className="flex gap-1.5 mb-3 sm:mb-4">
                      {/* Animations only on desktop for performance */}
                      <span className="w-2 h-2 bg-warm-400 rounded-full sm:animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-warm-400 rounded-full sm:animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-warm-400 rounded-full sm:animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <div className="bg-warm-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-2 border-primary">
                      <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                        Crafted from premium full-grain leather, this vintage messenger bag combines timeless style with modern functionality. Features adjustable shoulder strap, multiple compartments, and antique brass hardware.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { icon: Package, title: 'Auto Product Descriptions', description: 'Generate SEO-optimized descriptions in seconds' },
                      { icon: Languages, title: 'Smart Translations', description: 'Auto-translate content to 27 languages' },
                      { icon: BarChart3, title: 'Intelligent Search', description: 'Typo-tolerant search with instant results' },
                    ].map((feature, idx) => (
                      <div key={idx} className="flex gap-3 sm:gap-4 bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-5 text-left shadow-card">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warm-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground-secondary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm sm:text-base mb-0.5 sm:mb-1">{feature.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 5: Security */}
            {currentSlide === 5 && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                  ENTERPRISE SECURITY
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-8 sm:mb-12">
                  <span className="text-foreground">Bank-Grade </span>
                  <span className="text-foreground-secondary">Security</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                  {securityFeatures.map((feature, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-5 text-center hover:border-warm-300 transition-all shadow-card">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warm-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground-secondary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">{feature.title}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 6: Features */}
            {currentSlide === 6 && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                  POWERFUL FEATURES
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-6 sm:mb-10">
                  <span className="text-foreground">Everything to </span>
                  <span className="text-foreground-secondary">Succeed</span>
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                  {featureCategories.map((cat, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-card">
                      <h4 className="font-semibold text-foreground-secondary text-xs sm:text-sm mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-border">{cat.title}</h4>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {cat.features.map((feature, fidx) => (
                          <li key={fidx} className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                            <CheckCircle2 className="w-3 h-3 text-sage-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 7: Pricing */}
            {currentSlide === 7 && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                  SIMPLE PRICING
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-3 sm:mb-4">
                  <span className="text-foreground">Simple, </span>
                  <span className="text-foreground-secondary">honest pricing</span>
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-10">Start free. Stay free for a year. Then one flat price.</p>

                {/* Single Pricing Card - matching home page */}
                <div className="max-w-3xl mx-auto rounded-xl sm:rounded-2xl border border-warm-200 bg-white p-4 sm:p-8 shadow-card">
                  <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                    {/* Left - Price */}
                    <div className="md:w-1/2 text-left">
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl sm:text-5xl font-serif font-medium text-foreground">₹0</span>
                          <span className="text-foreground-secondary text-sm sm:text-base">/month</span>
                        </div>
                        <p className="text-sm sm:text-base text-foreground-secondary">
                          for your first <span className="font-semibold text-foreground">12 months</span>
                        </p>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-lg bg-warm-50 border border-warm-200 mb-4 sm:mb-6">
                        <p className="text-xs sm:text-sm text-foreground-secondary">
                          Then just <span className="font-semibold text-foreground text-lg">{monthlyPrice}/month</span>
                          <br />
                          <span className="text-foreground-tertiary">No transaction fees. No hidden costs.</span>
                        </p>
                      </div>

                      <button
                        onClick={() => router.push('/onboarding')}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors"
                      >
                        Start Your Free Year
                      </button>
                    </div>

                    {/* Right - Features */}
                    <div className="md:w-1/2 md:border-l md:border-warm-200 md:pl-8 text-left">
                      <h3 className="font-medium text-foreground mb-4">Everything included:</h3>
                      <ul className="space-y-2">
                        {pricingFeatures.slice(0, 7).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-sage-500 flex-shrink-0" />
                            <span className="text-sm text-foreground-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 8: Testimonials */}
            {currentSlide === 8 && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                  TRUSTED BY THOUSANDS
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-6 sm:mb-12">
                  <span className="text-foreground">What Our </span>
                  <span className="text-foreground-secondary">Customers Say</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {testimonials.map((t, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left shadow-card">
                      <div className="flex gap-1 mb-3 sm:mb-4">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground-secondary mb-3 sm:mb-4 italic">&ldquo;{t.content}&rdquo;</p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">
                          {t.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-xs sm:text-sm">{t.name}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">{t.role}, {t.company}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 9: Comparison */}
            {currentSlide === 9 && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4 sm:mb-6">
                  WHY TESSERIX
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-6 sm:mb-10">
                  <span className="text-foreground">The </span>
                  <span className="text-foreground-secondary">Clear Choice</span>
                </h2>
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-card overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-warm-100">
                        <th className="p-2.5 sm:p-4 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Feature</th>
                        <th className="p-2.5 sm:p-4 text-left text-xs sm:text-sm font-semibold text-foreground-secondary bg-warm-200/50">Tesserix</th>
                        <th className="p-2.5 sm:p-4 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Shopify</th>
                        <th className="p-2.5 sm:p-4 text-left text-xs sm:text-sm font-semibold text-muted-foreground">WooCommerce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="p-2.5 sm:p-4 text-xs sm:text-sm text-foreground">{row.feature}</td>
                          <td className="p-2.5 sm:p-4 text-xs sm:text-sm font-semibold text-sage-600 bg-warm-50">{row.tesseract}</td>
                          <td className="p-2.5 sm:p-4 text-xs sm:text-sm text-muted-foreground">{row.shopify}</td>
                          <td className="p-2.5 sm:p-4 text-xs sm:text-sm text-muted-foreground">{row.woo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Slide 10: CTA */}
            {currentSlide === 10 && (
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium mb-4 sm:mb-6">
                  <span className="text-foreground">Ready to Transform</span>
                  <br />
                  <span className="text-foreground-secondary">Your Business?</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto">
                  Join thousands of brands already growing with Tesserix. Start your free trial today.
                </p>
                <div className="flex items-center justify-center gap-4 mb-8 sm:mb-10">
                  <button
                    onClick={() => router.push('/onboarding')}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full font-semibold text-base sm:text-lg transition-all flex items-center gap-2"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-500" />
                    Free 14-day trial
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-500" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-500" />
                    Cancel anytime
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
