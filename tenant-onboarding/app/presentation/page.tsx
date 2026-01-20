'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Users,
  CreditCard,
  Package,
  BarChart3,
  Sparkles,
  Play,
  Star,
  Smartphone,
  Lock,
  Languages,
  DollarSign,
  Building2,
  Clock,
  Phone,
  MapPin,
  Maximize2,
  Minimize2,
  Home,
  Layers,
  Server,
  Database,
  Cloud,
  X,
} from 'lucide-react';

// Slide data
const slides = [
  {
    id: 1,
    type: 'title',
    label: '',
    title: 'The Future of',
    titleGradient: 'E-Commerce',
    subtitle: 'Build, launch, and scale your online store with the most powerful commerce platform. Join 10,000+ brands already growing with us.',
  },
  {
    id: 2,
    type: 'problem',
    label: 'THE CHALLENGE',
    title: 'Traditional E-Commerce is',
    titleHighlight: 'Broken',
    problems: [
      { icon: Clock, title: 'Months to Launch', description: 'Complex setups taking 6-12 months with expensive developers' },
      { icon: DollarSign, title: 'Hidden Costs', description: 'Transaction fees, plugins, hosting costs that add up quickly' },
      { icon: Smartphone, title: 'No Mobile Experience', description: 'Clunky mobile sites that lose 70% of mobile customers' },
      { icon: Globe, title: 'Limited Global Reach', description: 'Single currency, single language - missing 95% of the world' },
    ],
  },
  {
    id: 3,
    type: 'solution',
    label: 'THE SOLUTION',
    title: 'One Platform.',
    titleGradient: 'Infinite Possibilities.',
    stats: [
      { value: '10,000+', label: 'Brands Trust Us' },
      { value: '50+', label: 'Countries' },
      { value: '$2B+', label: 'GMV Processed' },
    ],
  },
  {
    id: 4,
    type: 'ecosystem',
    label: 'COMPLETE ECOSYSTEM',
    title: 'Everything You Need,',
    titleGradient: 'All-in-One',
    cards: [
      { icon: Home, title: 'Beautiful Storefront', description: 'Stunning, conversion-optimized stores', features: ['Responsive Design', 'SEO Optimized', 'Fast Loading'], color: 'from-warm-200 to-warm-100' },
      { icon: Layers, title: 'Powerful Admin', description: 'Manage your entire business', features: ['92+ Management Pages', 'Real-time Analytics', 'Role-based Access'], color: 'from-warm-200 to-warm-100' },
      { icon: Smartphone, title: 'Native Mobile App', description: 'iOS & Android apps', features: ['Push Notifications', 'Biometric Login', 'Offline Support'], color: 'from-warm-200 to-warm-100' },
    ],
  },
  {
    id: 5,
    type: 'domain',
    label: 'ENTERPRISE ARCHITECTURE',
    title: 'Your Brand, Your',
    titleGradient: 'Domain',
    benefits: [
      { title: 'Instant Subdomain', description: 'yourbrand.tesserix.app ready in seconds' },
      { title: 'Custom Domain Support', description: 'Use your own domain: shop.yourbrand.com' },
      { title: 'SSL Included', description: 'Free SSL certificates for all stores' },
      { title: 'Dedicated Admin Portal', description: 'yourbrand-admin.tesserix.app' },
    ],
  },
  {
    id: 6,
    type: 'global',
    label: 'GO GLOBAL',
    title: 'Sell Anywhere.',
    titleGradient: 'Speak Any Language.',
    globalStats: [
      { value: '27', label: 'Languages Supported', detail: 'Including RTL (Arabic, Hebrew)', icon: Languages },
      { value: '50+', label: 'Currencies', detail: 'Real-time exchange rates', icon: DollarSign },
      { value: '2', label: 'Payment Gateways', detail: 'Stripe (Global) + Razorpay (India)', icon: CreditCard },
    ],
  },
  {
    id: 7,
    type: 'ai',
    label: 'AI-POWERED',
    title: 'Intelligence',
    titleGradient: 'Built In',
    aiFeatures: [
      { icon: Package, title: 'Auto Product Descriptions', description: 'Generate SEO-optimized descriptions in seconds' },
      { icon: Languages, title: 'Smart Translations', description: 'Auto-translate content to 27 languages' },
      { icon: BarChart3, title: 'Intelligent Search', description: 'Typo-tolerant search with instant results' },
    ],
  },
  {
    id: 8,
    type: 'security',
    label: 'ENTERPRISE SECURITY',
    title: 'Bank-Grade',
    titleGradient: 'Security',
    securityFeatures: [
      { icon: Lock, title: 'End-to-End Encryption', description: 'All data encrypted with AES-256' },
      { icon: Shield, title: 'Service Mesh Security', description: 'Istio mTLS for all services' },
      { icon: Users, title: 'RBAC Access Control', description: '100+ granular permissions' },
      { icon: Server, title: 'PII Data Masking', description: 'Auto masking in logs' },
      { icon: Database, title: 'SSO Integration', description: 'Keycloak, Azure AD, Google' },
      { icon: Cloud, title: '99.9% Uptime SLA', description: 'Enterprise reliability' },
    ],
  },
  {
    id: 9,
    type: 'tech',
    label: 'BUILT FOR SCALE',
    title: 'Enterprise',
    titleGradient: 'Architecture',
    techStack: [
      { layer: 'Frontend', items: ['Next.js 16', 'React 19', 'React Native', 'TailwindCSS'] },
      { layer: 'Backend', items: ['Go 1.25', '37+ Microservices', 'PostgreSQL', 'Redis'] },
      { layer: 'Infrastructure', items: ['Google Cloud', 'Kubernetes', 'Istio', 'Terraform'] },
    ],
    stats: [
      { value: '37+', label: 'Microservices' },
      { value: '73', label: 'Event Types' },
      { value: '13', label: 'API Contracts' },
      { value: '93', label: 'Helm Charts' },
    ],
  },
  {
    id: 10,
    type: 'features',
    label: 'POWERFUL FEATURES',
    title: 'Everything to',
    titleGradient: 'Succeed',
    featureCategories: [
      { title: 'Products & Inventory', features: ['Unlimited products', 'Multi-warehouse', 'Bulk import', 'Digital products'] },
      { title: 'Orders & Fulfillment', features: ['Auto processing', 'Multi-carrier', 'Returns mgmt', 'Real-time tracking'] },
      { title: 'Marketing & Growth', features: ['Coupons & discounts', 'Gift cards', 'Email campaigns', 'Cart recovery'] },
      { title: 'Customer Experience', features: ['Customer accounts', 'Wishlists', 'Reviews & ratings', 'Support tickets'] },
      { title: 'Analytics & Reports', features: ['Real-time dashboards', 'Sales analytics', 'Customer insights', 'Inventory reports'] },
      { title: 'Operations', features: ['Staff management', 'Vendor marketplace', 'Tax automation', 'Multi-location'] },
    ],
  },
  {
    id: 11,
    type: 'onboarding',
    label: 'GET STARTED',
    title: 'Launch in',
    titleGradient: '4 Simple Steps',
    steps: [
      { number: '1', icon: Building2, title: 'Business Info', description: 'Tell us about your business' },
      { number: '2', icon: Phone, title: 'Contact Details', description: 'Add your contact info' },
      { number: '3', icon: MapPin, title: 'Store Address', description: 'Set your location' },
      { number: '4', icon: CheckCircle2, title: 'Verify & Launch', description: 'Go live!' },
    ],
    launchTime: 'Under 5 minutes',
  },
  // VIDEO JOURNEY WALKTHROUGH - Slides 12-20
  {
    id: 12,
    type: 'journey-intro',
    label: 'VIDEO WALKTHROUGH',
    title: 'Your Journey to',
    titleGradient: 'Success',
    subtitle: 'See how easy it is to go from idea to earning online.\nNo hidden costs. No surprises. Just growth.',
    journeyIcons: ['💡', '✍️', '🏪', '📦', '💳', '🚀', '💰', '📊'],
  },
  {
    id: 13,
    type: 'journey-step',
    stepNumber: 1,
    totalSteps: 7,
    title: 'You Have a',
    titleGradient: 'Dream',
    subtitle: 'Products you love. Ideas you believe in.',
    emoji: '💡',
    quote: '"I want to sell my handmade crafts to customers worldwide"',
    worries: ['Expensive setup costs', 'Technical complexity', 'Hidden fees eating profits', 'Months to launch'],
  },
  {
    id: 14,
    type: 'journey-signup',
    stepNumber: 2,
    totalSteps: 7,
    title: 'Sign Up in',
    titleGradient: 'Seconds',
    highlight: 'No credit card required. Ever.',
    formFields: ['📧  your@email.com', '🔒  ••••••••', '🏪  My Awesome Store'],
    timeIndicator: '⏱️ 30 seconds',
  },
  {
    id: 15,
    type: 'journey-setup',
    stepNumber: 3,
    totalSteps: 7,
    title: 'Quick Store',
    titleGradient: 'Setup',
    subtitle: 'Guided wizard - just answer 4 simple questions',
    setupSteps: [
      { num: '1', icon: '🏢', title: 'Business Info', desc: 'Tell us your business name and type', status: '✅' },
      { num: '2', icon: '📞', title: 'Contact Details', desc: 'Add your phone and email', status: '✅' },
      { num: '3', icon: '📍', title: 'Address', desc: 'Where are you located?', status: '✅' },
      { num: '4', icon: '🎉', title: 'Verify', desc: 'Confirm and launch!', status: '🚀' },
    ],
    timeIndicator: '⏱️ Under 5 minutes total',
  },
  {
    id: 16,
    type: 'journey-products',
    stepNumber: 4,
    totalSteps: 7,
    title: 'Add Your',
    titleGradient: 'Products',
    subtitle: 'Upload photos. AI writes descriptions for you.',
    productExample: { name: 'Handmade Bag', price: '$49.99' },
    aiDescription: '"Crafted from premium full-grain leather, this vintage messenger bag combines timeless style with modern functionality. Features adjustable shoulder strap, multiple compartments, and antique brass hardware."',
    tip: '💡 AI writes SEO-optimized descriptions in seconds',
  },
  {
    id: 17,
    type: 'journey-payments',
    stepNumber: 5,
    totalSteps: 7,
    title: 'Connect',
    titleGradient: 'Payments',
    subtitle: 'Start accepting payments instantly',
    paymentOptions: [
      { name: 'Stripe', icon: '🌍', desc1: 'Accept cards globally', desc2: 'Visa, Mastercard, Amex & more' },
      { name: 'Razorpay', icon: '🇮🇳', desc1: 'Popular in India', desc2: 'UPI, Cards, Netbanking' },
    ],
    highlight: '✓ 0% platform fees from Tesserix',
    subtext: 'Only standard payment processor fees apply (2.9% + $0.30)',
  },
  {
    id: 18,
    type: 'journey-live',
    stepNumber: 6,
    totalSteps: 7,
    title: "You're",
    titleGradient: 'Live!',
    subtitle: 'Your store is ready for customers',
    storeUrl: 'myawesomestore.tesserix.app',
    storeName: '🏪 My Awesome Store',
    storeTagline: 'Handmade with love • Worldwide shipping',
  },
  {
    id: 19,
    type: 'journey-sale',
    stepNumber: 7,
    totalSteps: 7,
    title: 'Your First',
    titleGradient: 'Sale!',
    subtitle: 'The moment you\'ve been waiting for',
    celebration: '🎉',
    orderDetails: { id: '#1001', product: 'Vintage Leather Bag', price: '$49.99', customer: 'John D. from New York, USA' },
    earnings: { youEarned: '$48.54', stripeFee: '$1.45', platformFee: '$0.00' },
  },
  {
    id: 20,
    type: 'transparent-pricing',
    label: '100% TRANSPARENT',
    title: 'No Hidden Costs.',
    titleHighlight: 'Period.',
    subtitle: 'What you see is what you get. Only pay payment processor fees.',
    costBreakdown: [
      { item: 'Platform Subscription', cost: '$0 - $49/mo', note: 'Based on your plan', isGreen: true },
      { item: 'Transaction Fees', cost: '0%', note: "We don't take a cut", isGreen: true },
      { item: 'Hidden Fees', cost: '$0', note: 'No surprises, ever', isGreen: true },
      { item: 'Payment Processing', cost: '2.9% + $0.30', note: 'Standard Stripe/Razorpay fees', isGreen: false },
    ],
    warning: '⚠️ Shopify charges 0.5-2% transaction fees ON TOP of payment processing',
  },
  {
    id: 21,
    type: 'pricing',
    label: 'SIMPLE PRICING',
    title: 'Start Free.',
    titleGradient: 'Scale Unlimited.',
    plans: [
      { name: 'Starter', price: '$0', period: '/month', tagline: 'Perfect for new businesses', features: ['Up to 100 products', '1 staff account', 'Basic analytics', 'Email support'], featured: false },
      { name: 'Growth', price: '$49', period: '/month', tagline: 'For growing businesses', features: ['Unlimited products', '5 staff accounts', 'Advanced analytics', 'Priority support', 'Custom domain'], featured: true },
      { name: 'Enterprise', price: 'Custom', period: '', tagline: 'For large organizations', features: ['Everything in Growth', 'Unlimited staff', 'Dedicated support', 'SLA guarantee', 'Custom integrations'], featured: false },
    ],
  },
  {
    id: 22,
    type: 'testimonials',
    label: 'TRUSTED BY THOUSANDS',
    title: 'What Our',
    titleGradient: 'Customers Say',
    testimonials: [
      { name: 'Sarah Kim', role: 'CEO', company: 'Artisan Goods Co.', avatar: 'SK', content: 'Tesserix transformed our business. We went from a local shop to selling in 15 countries within 6 months.', rating: 5 },
      { name: 'Michael Rodriguez', role: 'CTO', company: 'Brand Collective', avatar: 'MR', content: 'The multi-tenant architecture means we can run 50+ brands from one platform. Incredible efficiency gains.', rating: 5 },
      { name: 'Aisha Patel', role: 'Founder', company: 'Spice Route', avatar: 'AP', content: 'Setup took 10 minutes. Our first sale came within an hour. This is how e-commerce should work.', rating: 5 },
    ],
  },
  {
    id: 23,
    type: 'comparison',
    label: 'WHY TESSERACT HUB',
    title: 'The',
    titleGradient: 'Clear Choice',
    comparisons: [
      { feature: 'Setup Time', tesseract: '5 minutes', shopify: '1-2 hours', woo: 'Days/Weeks' },
      { feature: 'Native Mobile App', tesseract: 'Included', shopify: 'Extra cost', woo: 'Not included' },
      { feature: 'Multi-tenant', tesseract: 'Built-in', shopify: 'Not available', woo: 'Plugin required' },
      { feature: 'Languages', tesseract: '27 included', shopify: 'Limited', woo: 'Plugin required' },
      { feature: 'AI Features', tesseract: 'Built-in', shopify: 'Apps required', woo: 'Plugins required' },
      { feature: 'Transaction Fees', tesseract: '0%', shopify: '0.5-2%', woo: 'Varies' },
    ],
  },
  {
    id: 24,
    type: 'cta',
    label: '',
    title: 'Ready to Transform Your Business?',
    subtitle: 'Join 10,000+ brands already growing with Tesserix',
    trustItems: ['Free 14-day trial', 'No credit card required', 'Cancel anytime'],
  },
];

export default function PresentationPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const totalSlides = slides.length;

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

  const progress = ((currentSlide) / (totalSlides - 1)) * 100;
  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-warm-200/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-warm-200/25 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-warm-200/20 rounded-full blur-[150px]" />
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-warm-200 z-50">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Close Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 transition-all"
      >
        <X className="w-5 h-5 text-warm-700" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-20 z-50 p-3 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 transition-all"
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-warm-700" />
        ) : (
          <Maximize2 className="w-5 h-5 text-warm-700" />
        )}
      </button>

      {/* Main Content */}
      <div className="relative h-full flex items-center justify-center p-8 md:p-16">
        <div className="max-w-6xl w-full">
          {/* Slide Content */}
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
            {slide.type === 'title' && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-100 border border-warm-300 mb-8">
                  <Sparkles className="w-4 h-4 text-foreground-tertiary" />
                  <span className="text-sm text-warm-700">Now with AI-powered product descriptions</span>
                </div>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-xl font-serif font-semibold text-foreground">Tesserix</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-medium mb-6">
                  <span className="text-foreground">{slide.title}</span>
                  <br />
                  <span className="text-foreground-secondary">
                    {slide.titleGradient}
                  </span>
                </h1>
                <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">{slide.subtitle}</p>
              </div>
            )}

            {slide.type === 'problem' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-destructive">{slide.titleHighlight}</span>
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {slide.problems?.map((problem, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-6 hover:border-destructive/30 transition-all shadow-card">
                      <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                        <problem.icon className="w-7 h-7 text-destructive" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{problem.title}</h3>
                      <p className="text-sm text-muted-foreground">{problem.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'solution' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title}</span>
                  <br />
                  <span className="text-foreground-secondary">
                    {slide.titleGradient}
                  </span>
                </h2>
                <div className="relative mx-auto w-64 h-64 mb-12">
                  <div className="absolute inset-0 border border-dashed border-warm-300 rounded-full animate-spin" style={{ animationDuration: '30s' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center border border-warm-300">
                      <Home className="w-5 h-5 text-foreground-tertiary" />
                    </div>
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center border border-warm-300">
                      <Layers className="w-5 h-5 text-sage-500" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center border border-warm-300">
                      <Smartphone className="w-5 h-5 text-foreground-secondary" />
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center border border-warm-300">
                      <BarChart3 className="w-5 h-5 text-foreground-tertiary" />
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-3xl font-bold">T</span>
                  </div>
                </div>
                <div className="flex justify-center gap-16">
                  {slide.stats?.map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-4xl font-bold text-foreground-secondary">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'ecosystem' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  {slide.cards?.map((card, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-6 hover:border-warm-300 transition-colors group shadow-card">
                      <div className="w-14 h-14 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center mb-4">
                        <card.icon className="w-7 h-7 text-foreground-secondary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                      <ul className="space-y-2">
                        {card.features.map((feature, fidx) => (
                          <li key={fidx} className="text-xs text-foreground-secondary flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-warm-400 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'domain' && (
              <div className="grid grid-cols-2 gap-12 items-center">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                    {slide.label}
                  </span>
                  <h2 className="text-4xl font-serif font-medium mb-8">
                    <span className="text-foreground">{slide.title} </span>
                    <span className="text-foreground-secondary">{slide.titleGradient}</span>
                  </h2>
                  <div className="space-y-6">
                    {slide.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-8 h-8 bg-warm-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-sage-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                  <div className="flex items-center gap-3 px-4 py-3 bg-warm-100 border-b border-border">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="w-3 h-3 rounded-full bg-warning" />
                      <span className="w-3 h-3 rounded-full bg-sage-500" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-warm-50 rounded-md px-3 py-1.5 text-sm">
                      <Lock className="w-3 h-3 text-sage-500" />
                      <span className="text-foreground-secondary"><span className="text-foreground-secondary">yourbrand</span>.tesserix.app</span>
                    </div>
                  </div>
                  <div className="p-8 text-center">
                    <div className="border-2 border-dashed border-warm-300 rounded-xl p-12 text-warm-400 text-lg">
                      Your Custom Store
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'global' && (
              <div className="grid grid-cols-2 gap-12 items-center">
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border border-warm-300/50 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-4 border border-warm-300/30 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    <div className="absolute inset-8 border border-warm-300/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                      <Globe className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                    {slide.label}
                  </span>
                  <h2 className="text-4xl font-serif font-medium mb-8">
                    <span className="text-foreground">{slide.title} </span>
                    <span className="text-foreground-secondary">{slide.titleGradient}</span>
                  </h2>
                  <div className="space-y-6">
                    {slide.globalStats?.map((stat, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-card">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-4xl font-bold text-foreground-secondary">
                            {stat.value}
                          </span>
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

            {slide.type === 'ai' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="grid grid-cols-2 gap-8 items-start">
                  <div className="bg-card border border-border rounded-2xl p-6 text-left shadow-card">
                    <div className="mb-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Generate description for:</div>
                      <div className="text-lg font-medium text-foreground-secondary">&ldquo;Vintage Leather Messenger Bag&rdquo;</div>
                    </div>
                    <div className="flex gap-1.5 mb-4">
                      <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <div className="bg-warm-50 rounded-xl p-4 border-l-2 border-primary">
                      <p className="text-sm text-warm-700 leading-relaxed">
                        Crafted from premium full-grain leather, this vintage messenger bag combines timeless style with modern functionality. Features adjustable shoulder strap, multiple compartments, and antique brass hardware.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {slide.aiFeatures?.map((feature, idx) => (
                      <div key={idx} className="flex gap-4 bg-card border border-border rounded-xl p-5 text-left shadow-card">
                        <div className="w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-6 h-6 text-foreground-secondary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'security' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="grid grid-cols-3 gap-5">
                  {slide.securityFeatures?.map((feature, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl p-5 text-center hover:border-warm-300 transition-all shadow-card">
                      <div className="w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <feature.icon className="w-6 h-6 text-foreground-secondary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'tech' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-300 text-warm-700 text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-10">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="space-y-4 mb-10">
                  {slide.techStack?.map((layer, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl p-4 flex items-center gap-6 shadow-card">
                      <div className="w-24 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{layer.layer}</div>
                      <div className="flex gap-3">
                        {layer.items.map((item, iidx) => (
                          <div key={iidx} className="px-4 py-2 bg-warm-50 border border-warm-200 rounded-lg text-sm text-foreground-secondary hover:bg-warm-100 hover:border-warm-200 transition-all cursor-default">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-12">
                  {slide.stats?.map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-3xl font-bold text-foreground-secondary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'features' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-10">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="grid grid-cols-3 gap-5">
                  {slide.featureCategories?.map((cat, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-card">
                      <h4 className="font-semibold text-foreground-secondary text-sm mb-3 pb-3 border-b border-border">{cat.title}</h4>
                      <ul className="space-y-2">
                        {cat.features.map((feature, fidx) => (
                          <li key={fidx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-sage-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'onboarding' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="flex items-center justify-center gap-4 mb-10">
                  {slide.steps?.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-card border border-border rounded-2xl flex flex-col items-center justify-center shadow-card">
                          <step.icon className="w-7 h-7 text-sage-500 mb-1" />
                          <span className="text-xs text-muted-foreground">{step.title}</span>
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-sage-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {step.number}
                        </div>
                      </div>
                      {idx < (slide.steps?.length || 0) - 1 && (
                        <ArrowRight className="w-6 h-6 text-warm-300" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-lg text-muted-foreground">
                  Average time to launch: <span className="text-foreground-secondary font-semibold">{slide.launchTime}</span>
                </p>
              </div>
            )}

            {/* VIDEO JOURNEY SLIDES */}
            {slide.type === 'journey-intro' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-5xl md:text-6xl font-serif font-medium mb-6">
                  <span className="text-foreground">{slide.title}</span>
                  <br />
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground whitespace-pre-line mb-12 max-w-xl mx-auto">{slide.subtitle}</p>
                <div className="flex items-center justify-center gap-2">
                  {slide.journeyIcons?.map((icon: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-3xl">{icon}</span>
                      {idx < (slide.journeyIcons?.length || 0) - 1 && (
                        <span className="text-warm-400 text-xl">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'journey-step' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-card">
                    <span className="text-7xl mb-6 block">{slide.emoji}</span>
                    <p className="text-lg text-foreground-secondary italic">{slide.quote}</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
                    <h3 className="text-lg font-semibold text-foreground mb-6">But you&apos;re worried about:</h3>
                    <div className="space-y-4">
                      {slide.worries?.map((worry: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-destructive text-lg">❌</span>
                          <span className="text-foreground-secondary">{worry}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'journey-signup' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-xl text-foreground-secondary mb-10">{slide.highlight}</p>
                <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-10 shadow-card">
                  <h3 className="text-2xl font-serif font-medium text-foreground mb-8">Create Your Store</h3>
                  <div className="space-y-4 mb-6">
                    {slide.formFields?.map((field: string, idx: number) => (
                      <div key={idx} className="bg-warm-50 rounded-xl px-5 py-4 text-left text-foreground-secondary">{field}</div>
                    ))}
                  </div>
                  <button className="w-full py-4 bg-primary hover:bg-primary-hover rounded-full text-primary-foreground font-semibold transition-colors">Start Free Trial →</button>
                </div>
                <p className="text-lg text-foreground-secondary mt-8">{slide.timeIndicator}</p>
              </div>
            )}

            {slide.type === 'journey-setup' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="grid grid-cols-4 gap-4">
                  {slide.setupSteps?.map((step: { num: string; icon: string; title: string; desc: string; status: string }, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-6 text-center relative pt-10 shadow-card">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-white text-sm">{step.num}</div>
                      <span className="text-3xl block mb-3">{step.icon}</span>
                      <div className="font-semibold text-foreground mb-2">{step.title}</div>
                      <div className="text-xs text-muted-foreground mb-3">{step.desc}</div>
                      <span className="text-2xl">{step.status}</span>
                    </div>
                  ))}
                </div>
                <p className="text-lg text-foreground-secondary mt-8">{slide.timeIndicator}</p>
              </div>
            )}

            {slide.type === 'journey-products' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
                    <div className="flex gap-5 mb-6">
                      <div className="w-32 h-28 bg-warm-100 rounded-xl flex items-center justify-center text-5xl">📷</div>
                      <div>
                        <div className="font-semibold text-foreground">{slide.productExample?.name}</div>
                        <div className="text-foreground-secondary font-semibold text-lg">{slide.productExample?.price}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Product Name</div>
                    <div className="bg-warm-50 rounded-xl px-4 py-3 text-foreground">Vintage Leather Bag</div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 text-foreground-secondary text-xs font-semibold mb-5">✨ AI GENERATED</span>
                    <p className="text-warm-700 leading-relaxed">{slide.aiDescription}</p>
                  </div>
                </div>
                <p className="text-center text-foreground-secondary mt-6">{slide.tip}</p>
              </div>
            )}

            {slide.type === 'journey-payments' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="grid grid-cols-2 gap-8 mb-8">
                  {slide.paymentOptions?.map((opt: { name: string; icon: string; desc1: string; desc2: string }, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-8 text-center shadow-card">
                      <span className="text-5xl mb-4 block">{opt.icon}</span>
                      <h3 className="text-2xl font-bold text-foreground mb-2">{opt.name}</h3>
                      <p className="text-warm-700 mb-1">{opt.desc1}</p>
                      <p className="text-sm text-muted-foreground mb-5">{opt.desc2}</p>
                      <button className="w-full py-3 bg-primary hover:bg-primary-hover rounded-full text-primary-foreground font-semibold transition-colors">Connect Now</button>
                    </div>
                  ))}
                </div>
                <div className="bg-warm-100 border border-warm-200 rounded-2xl p-6 text-center">
                  <p className="text-foreground-secondary font-semibold text-lg">{slide.highlight}</p>
                  <p className="text-foreground-secondary mt-2">{slide.subtext}</p>
                </div>
              </div>
            )}

            {slide.type === 'journey-live' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <div className="bg-warm-100 px-5 py-3 flex items-center gap-4 border-b border-border">
                    <div className="flex gap-2">
                      <span className="w-3 h-3 rounded-full bg-destructive"></span>
                      <span className="w-3 h-3 rounded-full bg-warning"></span>
                      <span className="w-3 h-3 rounded-full bg-sage-500"></span>
                    </div>
                    <div className="flex-1 bg-warm-50 rounded-lg px-4 py-2 text-sm text-foreground-secondary">
                      🔒 {slide.storeUrl}
                    </div>
                  </div>
                  <div className="p-12 text-center">
                    <div className="text-3xl font-bold text-foreground mb-3">{slide.storeName}</div>
                    <div className="text-muted-foreground mb-8">{slide.storeTagline}</div>
                    <div className="flex justify-center gap-5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-32 h-24 bg-warm-100 rounded-xl flex items-center justify-center text-4xl">📦</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'journey-sale' && (
              <div className="text-center relative">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-4">
                  STEP {slide.stepNumber} OF {slide.totalSteps}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="max-w-2xl mx-auto bg-warm-100 border border-warm-200 rounded-2xl p-12">
                  <span className="text-7xl block mb-4">{slide.celebration}</span>
                  <h3 className="text-3xl font-bold text-foreground-secondary mb-4">New Order Received!</h3>
                  <p className="text-lg text-foreground mb-2">Order {slide.orderDetails?.id} • {slide.orderDetails?.product} • {slide.orderDetails?.price}</p>
                  <p className="text-muted-foreground mb-8">Customer: {slide.orderDetails?.customer}</p>
                  <div className="inline-flex items-center gap-3 bg-card rounded-xl px-6 py-3">
                    <span className="text-foreground">You earned: <strong className="text-foreground-secondary">{slide.earnings?.youEarned}</strong></span>
                    <span className="text-warm-300">|</span>
                    <span className="text-muted-foreground">Stripe fee: {slide.earnings?.stripeFee}</span>
                    <span className="text-warm-300">|</span>
                    <span className="text-foreground-secondary">Platform fee: {slide.earnings?.platformFee}</span>
                  </div>
                </div>
                <div className="absolute top-16 right-20 bg-card border border-border rounded-xl px-5 py-3 text-left shadow-card">
                  <div className="font-semibold text-foreground text-sm">📱 Tesserix</div>
                  <div className="text-xs text-muted-foreground">🔔 New sale! $49.99</div>
                </div>
              </div>
            )}

            {slide.type === 'transparent-pricing' && (
              <div>
                <div className="text-center mb-10">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                    {slide.label}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                    <span className="text-foreground">{slide.title} </span>
                    <span className="text-foreground-secondary">{slide.titleHighlight}</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                </div>
                <div className="max-w-3xl mx-auto space-y-3">
                  {slide.costBreakdown?.map((item: { item: string; cost: string; note: string; isGreen: boolean }, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-xl px-8 py-5 flex items-center justify-between shadow-card">
                      <span className="font-semibold text-foreground">{item.item}</span>
                      <span className={`font-bold text-lg ${item.isGreen ? 'text-foreground-secondary' : 'text-foreground-secondary'}`}>{item.cost}</span>
                      <span className="text-muted-foreground text-sm">{item.note}</span>
                    </div>
                  ))}
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-8 py-4 text-center mt-6">
                    <span className="text-destructive">{slide.warning}</span>
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'pricing' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="flex justify-center gap-6">
                  {slide.plans?.map((plan, idx) => (
                    <div key={idx} className={`w-64 bg-card border rounded-2xl p-6 text-left relative shadow-card ${plan.featured ? 'border-primary scale-105' : 'border-border'}`}>
                      {plan.featured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                          Most Popular
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-foreground mb-1">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>
                      <div className="mb-4 pb-4 border-b border-border">
                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, fidx) => (
                          <li key={fidx} className="text-sm text-warm-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-sage-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${plan.featured ? 'bg-primary hover:bg-primary-hover text-primary-foreground' : 'bg-warm-100 border border-warm-300 text-foreground hover:bg-warm-200'}`}>
                        {plan.featured ? 'Start Trial' : 'Get Started'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'testimonials' && (
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-12">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  {slide.testimonials?.map((t, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-6 text-left shadow-card">
                      <div className="flex gap-1 mb-4">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-foreground-tertiary fill-warm-400" />
                        ))}
                      </div>
                      <p className="text-sm text-warm-700 mb-4 italic">&ldquo;{t.content}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {t.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.role}, {t.company}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'comparison' && (
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-xs font-semibold tracking-widest mb-6">
                  {slide.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-10">
                  <span className="text-foreground">{slide.title} </span>
                  <span className="text-foreground-secondary">{slide.titleGradient}</span>
                </h2>
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-warm-100">
                        <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Feature</th>
                        <th className="p-4 text-left text-sm font-semibold text-foreground-secondary bg-warm-100">Tesserix</th>
                        <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Shopify</th>
                        <th className="p-4 text-left text-sm font-semibold text-muted-foreground">WooCommerce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slide.comparisons?.map((row, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="p-4 text-sm text-warm-700">{row.feature}</td>
                          <td className="p-4 text-sm text-foreground font-medium bg-warm-100/50">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-sage-500" />
                              {row.tesseract}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{row.shopify}</td>
                          <td className="p-4 text-sm text-muted-foreground">{row.woo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {slide.type === 'cta' && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-xl font-serif font-semibold text-foreground">Tesserix</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-foreground">{slide.title}</h2>
                <p className="text-lg text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="flex justify-center gap-4 mb-10">
                  <button
                    onClick={() => router.push('/onboarding')}
                    className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full font-semibold transition-colors"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button className="flex items-center gap-2 px-8 py-4 bg-warm-100 border border-warm-300 text-foreground rounded-full font-semibold hover:bg-warm-200 transition-all">
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </button>
                </div>
                <div className="flex justify-center gap-8">
                  {slide.trustItems?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-sage-500" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="w-12 h-12 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-warm-700" />
        </button>
        <div className="px-6 py-3 rounded-full bg-warm-100 border border-warm-300">
          <span className="text-warm-700 text-sm">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="w-12 h-12 rounded-full bg-warm-100 hover:bg-warm-200 border border-warm-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowRight className="w-5 h-5 text-warm-700" />
        </button>
      </div>

      {/* Slide Dots */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-1.5 rounded-full transition-all ${
              currentSlide === idx
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-warm-300 hover:bg-warm-400'
            }`}
          />
        ))}
      </div>

      {/* Keyboard Hints */}
      <div className="absolute bottom-8 left-8 text-xs text-warm-500 hidden md:block">
        <kbd className="px-1.5 py-0.5 bg-warm-100 rounded border border-warm-300">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-warm-100 rounded border border-warm-300 ml-1">→</kbd>
        <span className="ml-2">Navigate</span>
        <span className="mx-3">|</span>
        <kbd className="px-1.5 py-0.5 bg-warm-100 rounded border border-warm-300">F</kbd>
        <span className="ml-2">Fullscreen</span>
        <span className="mx-3">|</span>
        <kbd className="px-1.5 py-0.5 bg-warm-100 rounded border border-warm-300">Esc</kbd>
        <span className="ml-2">Exit</span>
      </div>
    </div>
  );
}
