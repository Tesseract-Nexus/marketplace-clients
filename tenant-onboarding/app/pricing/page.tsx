'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Check, ArrowRight, HelpCircle, MessageCircle } from 'lucide-react';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Types for API response
interface PricingContentResponse {
  data: {
    paymentPlans: Array<{
      slug: string;
      price: string;
      tagline?: string;
      trialDays?: number;
      features: Array<{ feature: string }>;
    }>;
  };
}

const fallbackPricingFeatures = [
  'Unlimited products',
  'Custom domain support',
  'Mobile-responsive storefront',
  'Built-in SEO tools',
  'Payment processing (UPI, cards, wallets)',
  'Order management',
  'Customer accounts',
  'Analytics dashboard',
  'Inventory tracking',
  '24/7 human support',
  'No transaction fees from us',
];

export default function PricingPage() {
  const router = useRouter();

  // Fetch content from API
  const { data: contentData } = useSWR<PricingContentResponse>('/api/content/home', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // Extract pricing info from payment plans
  const freePlan = contentData?.data?.paymentPlans?.find((p) => p.slug === 'free-trial');
  const proPlan = contentData?.data?.paymentPlans?.find((p) => p.slug === 'pro');
  const monthlyPrice = proPlan?.price ? `₹${Math.round(parseFloat(proPlan.price))}` : '₹299';
  const trialMonths = freePlan?.trialDays ? Math.round(freePlan.trialDays / 30) : 12;
  const pricingFeatures = freePlan?.features?.length
    ? freePlan.features.map((f) => f.feature)
    : fallbackPricingFeatures;

  const comparisons = [
    {
      platform: 'Shopify',
      freeTrialDays: '3 days',
      monthlyPrice: '$29-299',
      transactionFees: '0.5-2%',
      support: 'Tiered',
    },
    {
      platform: 'WooCommerce',
      freeTrialDays: 'N/A',
      monthlyPrice: 'Hosting + plugins',
      transactionFees: 'Varies',
      support: 'Community',
    },
    {
      platform: 'mark8ly',
      freeTrialDays: `${trialMonths} months`,
      monthlyPrice: monthlyPrice,
      transactionFees: 'None',
      support: 'Human 24/7',
      highlighted: true,
    },
  ];

  const handleGetStarted = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="pricing" />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-4 text-foreground">
            Simple, honest pricing
          </h1>
          <p className="text-xl text-foreground-secondary">
            Start free for {trialMonths} months. Then one flat price. No surprises.
          </p>
        </div>
      </section>

      {/* Main Pricing Card */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-warm-200 bg-white p-8 sm:p-12 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left - Price */}
              <div className="lg:w-1/2">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-sage-50 text-sage-700 text-sm font-medium border border-sage-200 mb-6">
                  Most popular
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl sm:text-6xl font-serif font-medium text-foreground">₹0</span>
                    <span className="text-foreground-secondary">/month</span>
                  </div>
                  <p className="text-foreground-secondary">
                    for your first <span className="font-semibold text-foreground">{trialMonths} months</span>
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-warm-50 border border-warm-200 mb-8">
                  <p className="text-sm text-foreground-secondary">
                    Then just <span className="font-semibold text-foreground text-lg">{monthlyPrice}/month</span>
                    <br />
                    <span className="text-foreground-tertiary">No transaction fees. No hidden costs. Cancel anytime.</span>
                  </p>
                </div>

                <button
                  onClick={handleGetStarted}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl text-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                  Start Your Free Year
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-sm text-foreground-tertiary text-center mt-4">
                  No credit card required to start
                </p>
              </div>

              {/* Right - Features */}
              <div className="lg:w-1/2 lg:border-l lg:border-warm-200 lg:pl-10">
                <h3 className="font-medium text-foreground mb-6">Everything included:</h3>
                <ul className="space-y-3">
                  {pricingFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-sage-500 flex-shrink-0" />
                      <span className="text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground text-center mb-8">
            Compare with alternatives
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-warm-200">
                  <th className="text-left py-4 px-4 text-foreground font-medium">Platform</th>
                  <th className="text-left py-4 px-4 text-foreground font-medium">Free Trial</th>
                  <th className="text-left py-4 px-4 text-foreground font-medium">Monthly Cost</th>
                  <th className="text-left py-4 px-4 text-foreground font-medium">Transaction Fees</th>
                  <th className="text-left py-4 px-4 text-foreground font-medium">Support</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b border-warm-100 ${item.highlighted ? 'bg-sage-50' : ''}`}
                  >
                    <td className={`py-4 px-4 ${item.highlighted ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
                      {item.platform}
                    </td>
                    <td className={`py-4 px-4 ${item.highlighted ? 'font-semibold text-sage-700' : 'text-foreground-secondary'}`}>
                      {item.freeTrialDays}
                    </td>
                    <td className={`py-4 px-4 ${item.highlighted ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
                      {item.monthlyPrice}
                    </td>
                    <td className={`py-4 px-4 ${item.highlighted ? 'font-semibold text-sage-700' : 'text-foreground-secondary'}`}>
                      {item.transactionFees}
                    </td>
                    <td className={`py-4 px-4 ${item.highlighted ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
                      {item.support}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-warm-50 rounded-2xl p-8 sm:p-12 border border-warm-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-foreground-secondary" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground">Common questions</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">What happens after the {trialMonths} months?</h3>
                <p className="text-foreground-secondary">
                  After your free year, it&apos;s just {monthlyPrice}/month. That&apos;s it—no hidden fees, no transaction costs from us, no surprises. And you can cancel anytime.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Are there any transaction fees?</h3>
                <p className="text-foreground-secondary">
                  We don't charge transaction fees. You'll only pay standard payment processing fees from your payment provider (around 2% for UPI, 2-3% for cards).
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Can I cancel anytime?</h3>
                <p className="text-foreground-secondary">
                  Yes, cancel anytime with no questions asked. You can even export all your data—products, customers, orders—and take it with you.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Do I need a credit card to start?</h3>
                <p className="text-foreground-secondary">
                  No. You can start your free {trialMonths}-month trial without entering any payment information.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-warm-200 flex flex-col sm:flex-row gap-4">
              <button className="flex-1 px-6 py-3 rounded-xl border border-warm-300 text-foreground font-medium hover:bg-warm-100 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat with us
              </button>
              <button
                onClick={handleGetStarted}
                className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
