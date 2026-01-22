'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Store,
  Package,
  CreditCard,
  Truck,
  Globe,
  Users,
  Settings,
  BarChart3,
  ShoppingCart,
  Megaphone,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Getting Started Steps
interface SetupStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'store-info',
    title: 'Set up your store information',
    description: 'Add your store name, address, and contact details',
    href: '/settings/general',
    icon: Store,
  },
  {
    id: 'add-products',
    title: 'Add your first products',
    description: 'Create products with images, prices, and inventory',
    href: '/products',
    icon: Package,
  },
  {
    id: 'setup-payments',
    title: 'Configure payment methods',
    description: 'Connect Stripe, Razorpay, or other payment gateways',
    href: '/settings/payments',
    icon: CreditCard,
  },
  {
    id: 'setup-shipping',
    title: 'Set up shipping options',
    description: 'Configure shipping carriers and delivery zones',
    href: '/settings/shipping-carriers',
    icon: Truck,
  },
  {
    id: 'customize-storefront',
    title: 'Customize your storefront',
    description: 'Choose themes, colors, and branding for your store',
    href: '/settings/storefront-theme',
    icon: Globe,
  },
  {
    id: 'publish-store',
    title: 'Publish your store',
    description: 'Make your store live and start selling',
    href: '/settings/general',
    icon: CheckCircle2,
  },
];

// FAQ Items
interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I add a new product?',
    answer: 'Go to Catalog > Products and click "Add Product". Fill in the product details including name, description, price, and images. You can also set inventory levels, variants (like size/color), and categories.',
  },
  {
    question: 'How do I process an order?',
    answer: 'Navigate to Orders > All Orders to see incoming orders. Click on an order to view details. You can update the order status, add tracking information, and process refunds from the order detail page.',
  },
  {
    question: 'How do I set up payment methods?',
    answer: 'Go to Settings > Payments to configure your payment gateways. We support Stripe, Razorpay, and other popular payment providers. You\'ll need to enter your API keys from your payment provider\'s dashboard.',
  },
  {
    question: 'How do I create a discount or coupon?',
    answer: 'Navigate to Marketing > Coupons and click "Create Coupon". You can set percentage or fixed discounts, minimum order amounts, usage limits, and expiration dates.',
  },
  {
    question: 'How do I manage inventory?',
    answer: 'Go to Catalog > Inventory to view and update stock levels. You can set low stock alerts, track inventory across multiple locations, and view inventory reports.',
  },
  {
    question: 'How do I add team members?',
    answer: 'Go to Team > Staff and click "Add Staff Member". You can assign roles with different permission levels to control what each team member can access.',
  },
  {
    question: 'How do I view my sales analytics?',
    answer: 'The Dashboard shows key metrics at a glance. For detailed analytics, go to Analytics where you can view sales trends, customer insights, and inventory reports.',
  },
  {
    question: 'How do I connect my own domain?',
    answer: 'Go to Settings > Store Settings and click on "Custom Domains". Add your domain and follow the DNS configuration instructions to point your domain to your store.',
  },
];

// Feature Guides
interface FeatureGuide {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    title: 'Managing Orders',
    description: 'View, process, and fulfill customer orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Product Catalog',
    description: 'Add and organize your products and categories',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Customer Management',
    description: 'View customer profiles and order history',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Analytics & Reports',
    description: 'Track sales, revenue, and store performance',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Marketing Tools',
    description: 'Create coupons, gift cards, and promotions',
    href: '/coupons',
    icon: Megaphone,
  },
  {
    title: 'Store Settings',
    description: 'Configure payments, shipping, and taxes',
    href: '/settings/general',
    icon: Settings,
  },
];

// FAQ Accordion Component
function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium text-foreground pr-4">{item.question}</span>
            {openIndex === index ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Help & Support"
          description="Get started with your store, find answers to common questions, or contact our support team."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Support' },
          ]}
        />

        {/* Contact Support Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Need Help?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = 'mailto:support@tesserix.app'}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Getting Started Checklist */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Getting Started</h3>
                <p className="text-xs text-muted-foreground">Follow these steps to set up your store</p>
              </div>
            </div>

            <div className="space-y-1">
              {SETUP_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex-shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Feature Guides */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Feature Guides</h3>
                <p className="text-xs text-muted-foreground">Learn about key features</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURE_GUIDES.map((guide) => {
                const Icon = guide.icon;
                return (
                  <Link
                    key={guide.title}
                    href={guide.href}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {guide.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {guide.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h3>
              <p className="text-xs text-muted-foreground">Quick answers to common questions</p>
            </div>
          </div>

          <FAQAccordion items={FAQ_ITEMS} />
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h3>
              <p className="text-xs text-muted-foreground">Work faster with these shortcuts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">Search anything</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">⌘</kbd>
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">K</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">Go to Dashboard</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">G</kbd>
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">D</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">Go to Orders</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">G</kbd>
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">O</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">Go to Products</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">G</kbd>
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">P</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">Go to Customers</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">G</kbd>
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">C</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">Go to Settings</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">G</kbd>
                <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">S</kbd>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Note: Keyboard shortcuts work when no input field is focused. Press keys in sequence (not simultaneously) for navigation shortcuts.
          </p>
        </div>
      </div>
    </div>
  );
}
