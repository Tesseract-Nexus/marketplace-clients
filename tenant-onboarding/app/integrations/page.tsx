'use client';

import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import {
  CreditCard,
  Truck,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Shield
} from 'lucide-react';

const currentIntegrations = [
  {
    category: 'Payments',
    description: 'Accept payments from anywhere in India and the world.',
    items: [
      {
        name: 'Razorpay',
        description: 'UPI, cards, netbanking, wallets - all payment modes Indians love',
        features: ['UPI & QR payments', 'All major cards', 'EMI options', 'Instant settlements'],
      },
      {
        name: 'Stripe',
        description: 'For international customers paying with global cards',
        features: ['135+ currencies', 'Global cards', 'Apple Pay & Google Pay', 'Fraud protection'],
      },
    ],
  },
  {
    category: 'Shipping',
    description: 'Ship anywhere in India with real-time tracking.',
    items: [
      {
        name: 'Shiprocket',
        description: 'Access to 25+ courier partners through one integration',
        features: ['Auto courier selection', 'Bulk shipping', 'NDR management', 'COD support'],
      },
      {
        name: 'Delhivery',
        description: 'Reliable delivery across 18,000+ pin codes',
        features: ['Express delivery', 'Surface shipping', 'Warehousing', 'Returns management'],
      },
    ],
  },
];

const comingSoonIntegrations = [
  {
    name: 'Instagram Shopping',
    description: 'Tag products in your posts and stories. Let customers buy without leaving Instagram.',
    icon: Smartphone,
  },
  {
    name: 'WhatsApp Commerce',
    description: 'Share your catalog on WhatsApp. Accept orders and payments in chat.',
    icon: Smartphone,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-100 border border-warm-200 text-foreground-secondary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Built-in, not bolted on
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-6 text-foreground">
            Everything connects.<br />Nothing to configure.
          </h1>
          <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
            Payments and shipping work out of the box. No plugins to install,
            no API keys to hunt down, no developer needed.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-warm-50 border border-warm-200">
              <Clock className="w-8 h-8 text-foreground-secondary mx-auto mb-3" />
              <p className="font-medium text-foreground">5-minute setup</p>
              <p className="text-sm text-foreground-secondary">Not 5 hours</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-warm-50 border border-warm-200">
              <Shield className="w-8 h-8 text-foreground-secondary mx-auto mb-3" />
              <p className="font-medium text-foreground">PCI compliant</p>
              <p className="text-sm text-foreground-secondary">Bank-grade security</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-warm-50 border border-warm-200">
              <CreditCard className="w-8 h-8 text-foreground-secondary mx-auto mb-3" />
              <p className="font-medium text-foreground">No extra fees</p>
              <p className="text-sm text-foreground-secondary">Just gateway charges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Current Integrations */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {currentIntegrations.map((category, idx) => (
            <div key={idx} className="mb-16">
              <div className="flex items-center gap-3 mb-3">
                {category.category === 'Payments' ? (
                  <CreditCard className="w-6 h-6 text-primary" />
                ) : (
                  <Truck className="w-6 h-6 text-primary" />
                )}
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  {category.category}
                </h2>
              </div>
              <p className="text-foreground-secondary mb-8">{category.description}</p>

              <div className="grid sm:grid-cols-2 gap-6">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-6 rounded-2xl bg-card border border-border hover:border-warm-300 transition-colors"
                  >
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.name}</h3>
                    <p className="text-foreground-secondary mb-4">{item.description}</p>
                    <ul className="space-y-2">
                      {item.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-sm text-foreground-secondary">
                          <CheckCircle className="w-4 h-4 text-sage-600 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-medium text-foreground mb-4">
              Coming soon
            </h2>
            <p className="text-foreground-secondary">
              Sell where your customers already spend their time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {comingSoonIntegrations.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-warm-50 border border-warm-200 border-dashed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-foreground-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{item.name}</h3>
                    <p className="text-foreground-secondary text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-10 rounded-3xl bg-card border border-border">
            <h2 className="font-serif text-2xl font-medium text-foreground mb-4">
              Ready to start selling?
            </h2>
            <p className="text-foreground-secondary mb-6">
              Your first year is free. All integrations included.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Start your store
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
