'use client';

import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import {
  Search,
  BookOpen,
  CreditCard,
  Truck,
  Settings,
  Users,
  BarChart3,
  MessageCircle,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  Clock
} from 'lucide-react';

const gettingStartedArticles = [
  { title: 'Create your store in 10 minutes', href: '#' },
  { title: 'Add your first product', href: '#' },
  { title: 'Set up payments with Razorpay', href: '#' },
  { title: 'Configure shipping rates', href: '#' },
  { title: 'Customize your storefront', href: '#' },
];

const helpCategories = [
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Razorpay, Stripe, refunds, payouts',
    articles: 12,
  },
  {
    icon: Truck,
    title: 'Shipping',
    description: 'Shiprocket, Delhivery, tracking, returns',
    articles: 8,
  },
  {
    icon: Settings,
    title: 'Store Settings',
    description: 'Domain, taxes, notifications, team',
    articles: 15,
  },
  {
    icon: Users,
    title: 'Customers',
    description: 'Orders, accounts, communication',
    articles: 6,
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Reports, insights, exports',
    articles: 5,
  },
  {
    icon: BookOpen,
    title: 'Products',
    description: 'Inventory, variants, collections',
    articles: 10,
  },
];

const contactOptions = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Talk to a human, not a bot',
    detail: 'Usually responds in under 5 minutes',
    action: 'Start chat',
    primary: true,
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'For detailed questions',
    detail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@tesserix.app',
    action: 'Send email',
    primary: false,
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    description: 'Quick questions, quick answers',
    detail: '+91 98765 43210',
    action: 'Message us',
    primary: false,
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-6 text-foreground">
            How can we help?
          </h1>
          <p className="text-xl text-foreground-secondary mb-8">
            Find answers or reach out. We are real people and we reply fast.
          </p>

          {/* Search (decorative) */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary" />
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-warm-50 border border-warm-200">
            <h2 className="font-serif text-xl font-medium text-foreground mb-6">
              Getting started
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {gettingStartedArticles.map((article, idx) => (
                <li key={idx}>
                  <a
                    href={article.href}
                    className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    {article.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-8 text-center">
            Browse by topic
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, idx) => (
              <a
                key={idx}
                href="#"
                className="group p-6 rounded-2xl bg-card border border-border hover:border-warm-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                  <category.icon className="w-6 h-6 text-foreground-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{category.title}</h3>
                <p className="text-sm text-foreground-secondary mb-3">{category.description}</p>
                <p className="text-xs text-foreground-tertiary">{category.articles} articles</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
              Still need help?
            </h2>
            <p className="text-foreground-secondary">
              Our support team is available 24/7. Yes, even on Sundays.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {contactOptions.map((option, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border text-center ${
                  option.primary
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                  option.primary ? 'bg-primary/10' : 'bg-warm-100'
                }`}>
                  <option.icon className={`w-7 h-7 ${
                    option.primary ? 'text-primary' : 'text-foreground-secondary'
                  }`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{option.title}</h3>
                <p className="text-sm text-foreground-secondary mb-2">{option.description}</p>
                <p className="text-xs text-foreground-tertiary mb-4">{option.detail}</p>
                <button className={`inline-flex items-center gap-1 text-sm font-medium ${
                  option.primary
                    ? 'text-primary hover:text-primary-hover'
                    : 'text-foreground-secondary hover:text-foreground'
                } transition-colors`}>
                  {option.action}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Response time note */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-foreground-secondary">
              <Clock className="w-4 h-4" />
              Average response time: 4 minutes
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
