'use client';

import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import {
  BookOpen,
  Rocket,
  CheckSquare,
  ShoppingBag,
  Megaphone,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';

const guides = [
  {
    icon: Rocket,
    title: 'Getting Started',
    description: 'From zero to your first store in 10 minutes',
    duration: '10 min read',
    featured: true,
    steps: [
      'Create your account (2 min)',
      'Add your first products (3 min)',
      'Set up payments (2 min)',
      'Configure shipping (2 min)',
      'Go live (1 min)',
    ],
  },
  {
    icon: CheckSquare,
    title: 'Pre-Launch Checklist',
    description: 'Everything to check before you open for business',
    duration: '5 min read',
    featured: false,
    items: [
      'Store details & branding',
      'Product listings complete',
      'Payment methods tested',
      'Shipping zones configured',
      'Legal pages added',
      'Order notification emails',
    ],
  },
  {
    icon: ShoppingBag,
    title: 'Your First Sale',
    description: 'A 4-week plan to get your first customer',
    duration: '8 min read',
    featured: false,
    weeks: [
      { week: 1, focus: 'Tell friends and family' },
      { week: 2, focus: 'Post on social media' },
      { week: 3, focus: 'Reach out to communities' },
      { week: 4, focus: 'Consider a small promotion' },
    ],
  },
  {
    icon: Megaphone,
    title: 'Marketing Basics',
    description: 'Simple ways to get the word out',
    duration: '12 min read',
    featured: false,
    topics: [
      'Instagram for product businesses',
      'WhatsApp marketing that works',
      'Email your customers (without annoying them)',
      'Getting found on Google',
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-6 text-foreground">
            Guides
          </h1>
          <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
            Step-by-step instructions for building and growing your online store.
            No experience required.
          </p>
        </div>
      </section>

      {/* Featured Guide */}
      <section className="pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Start here</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1">
                <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
                  {guides[0].title}
                </h2>
                <p className="text-foreground-secondary mb-4">{guides[0].description}</p>
                <div className="flex items-center gap-4 text-sm text-foreground-tertiary mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {guides[0].duration}
                  </span>
                </div>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors"
                >
                  Start reading
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="lg:w-72">
                <div className="p-5 rounded-xl bg-background border border-border">
                  <p className="text-sm font-medium text-foreground mb-3">In this guide:</p>
                  <ul className="space-y-2">
                    {guides[0].steps?.map((step, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <span className="w-5 h-5 rounded-full bg-warm-100 flex items-center justify-center text-xs font-medium text-foreground-secondary flex-shrink-0">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Guides */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-xl font-medium text-foreground mb-8">
            More guides
          </h2>
          <div className="grid gap-6">
            {guides.slice(1).map((guide, idx) => (
              <a
                key={idx}
                href="#"
                className="group flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-card border border-border hover:border-warm-300 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0">
                  <guide.icon className="w-7 h-7 text-foreground-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-foreground-secondary mb-3">{guide.description}</p>
                  <div className="flex items-center gap-4 text-sm text-foreground-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {guide.duration}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="w-5 h-5 text-foreground-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-10 rounded-3xl bg-warm-50 border border-warm-200">
            <BookOpen className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
              Ready to put this into practice?
            </h2>
            <p className="text-foreground-secondary mb-6">
              Your first year is free. Start building your store today.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Create your store
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
