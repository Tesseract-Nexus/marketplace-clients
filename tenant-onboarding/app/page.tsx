'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
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
  ChevronDown,
  Star,
} from 'lucide-react';
import { ThemeToggle } from '../components/theme-toggle';
import { AuthModal } from '../components/auth';
import { useAuthStore } from '../lib/store/auth-store';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast Setup',
    description: 'Launch your store in under 15 minutes with our AI-powered onboarding.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and compliance with global security standards.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Globe,
    title: 'Global Scale',
    description: '150+ countries, 50+ currencies, and automatic tax calculation.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Real-time insights and AI-powered recommendations to grow faster.',
    gradient: 'from-purple-500 to-pink-600',
  },
];

const stats = [
  { value: '10K+', label: 'Active Stores', icon: Package },
  { value: '99.99%', label: 'Uptime SLA', icon: Shield },
  { value: '$2B+', label: 'GMV Processed', icon: CreditCard },
  { value: '4.9/5', label: 'Customer Rating', icon: Star },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Founder & CEO',
    company: 'BloomBox',
    avatar: 'SC',
    content: 'We migrated from Shopify and saw a 40% increase in conversion. The platform is incredibly intuitive.',
    rating: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Head of E-commerce',
    company: 'TechFlow',
    avatar: 'MR',
    content: 'The analytics alone are worth it. We finally understand our customers and can make data-driven decisions.',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Director of Operations',
    company: 'GreenLife Co',
    avatar: 'LT',
    content: 'From zero to $100K in monthly revenue in 6 months. The support team is phenomenal.',
    rating: 5,
  },
];

const steps = [
  { number: '01', title: 'Create Account', description: 'Sign up in seconds with just your email', time: '30 sec' },
  { number: '02', title: 'Add Products', description: 'Import or create your product catalog', time: '5 min' },
  { number: '03', title: 'Customize', description: 'Choose a theme and make it yours', time: '10 min' },
  { number: '04', title: 'Go Live', description: 'Connect payments and start selling', time: '2 min' },
];

const faqs = [
  {
    question: 'How long does it take to set up my store?',
    answer: 'Most merchants launch their store within 15-30 minutes. Our AI-powered onboarding guides you through every step, and you can import products from other platforms in bulk.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We support 100+ payment methods including all major credit cards, PayPal, Apple Pay, Google Pay, Buy Now Pay Later options, and regional payment methods across 150+ countries.',
  },
  {
    question: 'Is there a free plan available?',
    answer: 'Yes! Start with our free plan that includes everything you need to launch. Only pay transaction fees (2.5%) when you make sales. Upgrade anytime for lower fees and premium features.',
  },
  {
    question: 'Can I migrate from Shopify or WooCommerce?',
    answer: 'Absolutely. Our migration tool imports your products, customers, and order history automatically. Most migrations complete in under an hour with zero downtime.',
  },
  {
    question: 'Do you offer custom enterprise solutions?',
    answer: 'Yes, our Enterprise plan includes dedicated infrastructure, custom integrations, SLA guarantees, and a dedicated success manager. Contact our sales team for a tailored quote.',
  },
];

export default function Home() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Redirect authenticated users based on onboarding status
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.onboardingComplete) {
        router.push('/onboarding');
      }
      // If onboarding is complete, user can stay on landing or go to dashboard
    }
  }, [isAuthenticated, user, router]);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // The useEffect above will handle redirect based on onboarding status
  };

  const openSignIn = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0a0a] dark:via-[#111] dark:to-[#0a0a0a]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/10 dark:bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              Tesseract Hub
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors">Testimonials</a>
            <a href="#faq" className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
            <button
              onClick={() => router.push('/presentation')}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium"
            >
              Presentation
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={openSignIn}
              className="hidden sm:block text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="relative group bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-sm font-semibold overflow-hidden transition-all hover:shadow-lg hover:shadow-gray-900/25 dark:hover:shadow-white/25"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-sm text-gray-700 dark:text-white/80">Now with AI-powered product descriptions</span>
            <ArrowRight className="w-4 h-4 text-gray-400 dark:text-white/50" />
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent">
              The Future of
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              E-Commerce
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            Build, launch, and scale your online store with the most powerful
            commerce platform. Join 10,000+ brands already growing with us.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={() => router.push('/onboarding')}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-full text-base font-semibold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button className="group flex items-center gap-3 px-8 py-4 rounded-full text-base font-medium border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-white/20 transition-colors">
                <Play className="w-4 h-4 text-gray-700 dark:text-white fill-gray-700 dark:fill-white" />
              </div>
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-gray-500 dark:text-white/50">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Free 14-day trial
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Cancel anytime
            </span>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="hidden lg:block absolute top-1/2 left-10 transform -translate-y-1/2 animate-[float_6s_ease-in-out_infinite]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>
        <div className="hidden lg:block absolute top-1/3 right-16 transform animate-[float_6s_ease-in-out_infinite_0.5s]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
        <div className="hidden lg:block absolute bottom-32 right-32 transform animate-[float_6s_ease-in-out_infinite_1s]">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-y border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 dark:from-white/10 dark:to-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-gray-600 dark:text-white/60" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                Everything You Need to
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Succeed Online
              </span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
              Powerful tools designed for modern commerce. No coding required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/[0.08] dark:to-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-white/50 leading-relaxed">{feature.description}</p>
                <ArrowRight className="absolute bottom-8 right-8 w-5 h-5 text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 bg-gradient-to-b from-transparent via-gray-50/50 dark:via-white/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                Launch in Minutes,
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Not Months
              </span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
              Our streamlined process gets you selling faster than any other platform.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 md:gap-x-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                {/* Step Number Box */}
                <div className="w-20 h-20 mb-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-emerald-400 dark:group-hover:border-emerald-500/50 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white/80">
                    {step.number}
                  </span>
                </div>

                {/* Step Content */}
                <div className="flex flex-col items-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 leading-relaxed max-w-[180px]">
                    {step.description}
                  </p>
                  <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    {step.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center mt-16">
            <button
              onClick={() => router.push('/onboarding')}
              className="group bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 rounded-full text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30"
            >
              <span className="flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
              Testimonials
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                Loved by Brands
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Worldwide
              </span>
            </h2>
          </div>

          {/* Featured Testimonial */}
          <div className="relative mb-12 min-h-[280px]">
            <div className="max-w-3xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    activeTestimonial === index
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                  }`}
                >
                  <div className="text-center">
                    <div className="flex justify-center gap-1 mb-8">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                      ))}
                    </div>
                    <blockquote className="text-2xl sm:text-3xl font-medium text-gray-800 dark:text-white/90 leading-relaxed mb-8">
                      &ldquo;{testimonial.content}&rdquo;
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-semibold text-white">
                        {testimonial.avatar}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-500 dark:text-white/50">{testimonial.role} at {testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Dots */}
          <div className="flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`h-2 rounded-full transition-all ${
                  activeTestimonial === index
                    ? 'w-8 bg-purple-500'
                    : 'w-2 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 bg-gradient-to-b from-transparent via-gray-50/50 dark:via-white/[0.02] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                Questions? Answers.
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-colors"
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 dark:text-white/40 transition-transform duration-300 flex-shrink-0 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-white/60 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 border border-gray-200 dark:border-white/10 p-12 sm:p-16 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 rounded-full blur-[100px] -z-10" />

            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Your Business?
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/60 max-w-xl mx-auto mb-10">
              Join thousands of successful merchants. Start your free trial today
              and see why brands choose Tesseract Hub.
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="group bg-gray-900 dark:bg-white text-white dark:text-black px-10 py-4 rounded-full text-base font-semibold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-white/20"
            >
              <span className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-6">
              No credit card required · Free 14-day trial · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA Section - Dark */}
      <section className="bg-gray-900 dark:bg-[#0a0a0a] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
            <button
              onClick={() => router.push('/onboarding')}
              className="group bg-white text-black px-8 py-4 rounded-full text-base font-semibold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-white/20 flex items-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="px-8 py-4 rounded-full text-base font-semibold border border-white/20 text-white transition-all hover:bg-white/10"
            >
              View Pricing
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-white/70">
              <CheckCircle2 className="w-5 h-5 text-white/50" />
              <span className="text-sm">Free forever plan</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <CheckCircle2 className="w-5 h-5 text-white/50" />
              <span className="text-sm">No hidden fees</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <CheckCircle2 className="w-5 h-5 text-white/50" />
              <span className="text-sm">Enterprise support</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-white/50">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">10k+</div>
              <div className="text-sm text-white/50">Happy customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-white/50">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links Section */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white dark:text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">Tesseract Hub</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                The most intuitive e-commerce platform for modern businesses.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-lg">X</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-lg">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-lg">@</span>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Mobile Apps</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-800 gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2026 Tesseract Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal - Sign In only */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        mode="signin"
      />
    </div>
  );
}
