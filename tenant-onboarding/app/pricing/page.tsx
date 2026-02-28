'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Check, ArrowRight, HelpCircle, MessageCircle, Globe } from 'lucide-react';
import { detectLocation, type LocationData } from '../../lib/api/location';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Currency symbol mapping (fallback when location service currency doesn't have symbol)
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  AUD: 'A$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SGD: 'S$',
  NZD: 'NZ$',
  CAD: 'C$',
  AED: 'د.إ',
  JPY: '¥',
};

// Types for API response
interface PaymentPlanData {
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
}

interface PricingContentResponse {
  data: {
    paymentPlans: PaymentPlanData[];
  };
}

const fallbackPlans: PaymentPlanData[] = [
  {
    name: 'Free Trial',
    slug: 'free-trial',
    price: '0',
    currency: 'USD',
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
    price: '4.99',
    currency: 'USD',
    billingCycle: 'monthly',
    featured: true,
    tagline: 'Everything you need to grow',
    features: [
      { feature: 'Unlimited products' },
      { feature: 'Custom domain support' },
      { feature: 'Mobile-responsive storefront' },
      { feature: 'Built-in SEO tools' },
      { feature: 'Payment processing (UPI, cards, wallets)' },
      { feature: 'Order management' },
      { feature: 'Customer accounts' },
      { feature: 'Analytics dashboard' },
      { feature: 'Inventory tracking' },
      { feature: '24/7 human support' },
      { feature: 'No transaction fees from us' },
    ],
  },
];

function getSymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency + ' ';
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'INR') return amount.toLocaleString('en-IN');
  if (currency === 'JPY') return amount.toLocaleString();
  return amount.toLocaleString();
}

// Format price using detected user location
function formatPlanPrice(
  plan: PaymentPlanData,
  userCountry: string | null,
  userCurrency: string | null
): string {
  const priceNum = parseFloat(plan.price);
  if (priceNum <= 0) {
    const symbol = userCurrency ? (CURRENCY_SYMBOLS[userCurrency] || '$') : '$';
    return `${symbol}0`;
  }

  // 1. Try regional pricing matching user's country
  if (userCountry && plan.regionalPricing?.length) {
    const regional = plan.regionalPricing.find(
      (r) => r.countryCode === userCountry
    );
    if (regional) {
      const amount = Math.round(parseFloat(regional.price));
      return `${getSymbol(regional.currency)}${formatAmount(amount, regional.currency)}`;
    }
  }

  // 2. Try regional pricing matching user's currency (fallback if country didn't match)
  if (userCurrency && plan.regionalPricing?.length) {
    const regional = plan.regionalPricing.find(
      (r) => r.currency === userCurrency
    );
    if (regional) {
      const amount = Math.round(parseFloat(regional.price));
      return `${getSymbol(regional.currency)}${formatAmount(amount, regional.currency)}`;
    }
  }

  // 3. Fall back to the plan's own base price + currency
  const price = Math.round(priceNum);
  const currency = plan.currency || 'USD';
  return `${getSymbol(currency)}${formatAmount(price, currency)}`;
}

function getBillingLabel(plan: PaymentPlanData): string {
  if (parseFloat(plan.price) <= 0) return '';
  if (plan.billingCycle === 'yearly') return '/year';
  if (plan.billingCycle === 'one_time') return ' one-time';
  return '/month';
}

export default function PricingPage() {
  const router = useRouter();

  // Fetch content from API
  const { data: contentData } = useSWR<PricingContentResponse>('/api/content/home', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // Detect user's location for localized pricing
  const { data: userLocation } = useSWR<LocationData>(
    'user-location',
    () => detectLocation(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
      onError: () => {}, // Silently fail — pricing still works with base prices
    }
  );

  const userCountry = userLocation?.country || null;
  const userCurrency = userLocation?.currency || null;

  const isLoading = !contentData;
  const allPlans = isLoading
    ? fallbackPlans
    : (contentData?.data?.paymentPlans?.length ? contentData.data.paymentPlans : fallbackPlans);

  // Find free plan for trial info in hero/FAQ
  const freePlan = allPlans.find(
    (p) => parseFloat(p.price) === 0 || p.slug === 'free-trial' || p.slug === 'free'
  );
  const paidPlans = allPlans.filter((p) => parseFloat(p.price) > 0);
  const cheapestPaid = paidPlans.length > 0
    ? paidPlans.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b)
    : null;

  const trialMonths = freePlan?.trialDays ? Math.round(freePlan.trialDays / 30) : 12;
  const cheapestPrice = cheapestPaid
    ? formatPlanPrice(cheapestPaid, userCountry, userCurrency)
    : '';

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
      monthlyPrice: cheapestPaid ? `from ${cheapestPrice}` : cheapestPrice,
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
            {freePlan
              ? `Start free for ${trialMonths} months. Then one flat price. No surprises.`
              : `One flat price. No surprises.`}
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Location-based currency indicator */}
          {userLocation?.country_name && (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-tertiary mb-6">
              <Globe className="w-4 h-4" />
              <span>
                Prices shown for {userLocation.country_name}
                {userCurrency && userCurrency !== (allPlans[0]?.currency || 'USD') && (
                  <> in {userCurrency}</>
                )}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-warm-200 bg-white p-6 sm:p-8 animate-pulse flex flex-col">
                  <div className="h-5 w-24 bg-warm-200 rounded mb-2" />
                  <div className="h-3 w-40 bg-warm-100 rounded mb-6" />
                  <div className="h-10 w-28 bg-warm-200 rounded mb-1" />
                  <div className="h-3 w-16 bg-warm-100 rounded mb-6" />
                  <div className="space-y-3 mb-6 flex-1">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-warm-100 rounded flex-shrink-0" />
                        <div className="h-3 bg-warm-100 rounded" style={{ width: `${55 + j * 8}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="h-12 bg-warm-200 rounded-xl" />
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
                      <div className="inline-flex self-start items-center px-3 py-1 rounded-full bg-foreground text-background text-sm font-medium mb-4">
                        Most popular
                      </div>
                    )}

                    <h3 className="font-serif text-xl font-medium text-foreground mb-1">{plan.name}</h3>
                    {plan.tagline && (
                      <p className="text-sm text-foreground-tertiary mb-4">{plan.tagline}</p>
                    )}

                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-serif font-medium text-foreground ${isFeatured ? 'text-4xl' : 'text-3xl'}`}>
                          {formatPlanPrice(plan, userCountry, userCurrency)}
                        </span>
                        {!isFree && (
                          <span className="text-foreground-secondary text-sm">{getBillingLabel(plan)}</span>
                        )}
                      </div>
                      {isFree && plan.trialDays && plan.trialDays > 0 && (
                        <p className="text-sm text-foreground-secondary mt-1">
                          for <span className="font-semibold text-foreground">{trialMonths} months</span>
                        </p>
                      )}
                    </div>

                    {plan.features.length > 0 && (
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-sage-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground-secondary">{f.feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={handleGetStarted}
                      className="w-full py-3 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 hover:shadow-sm"
                    >
                      {isFree ? 'Start Free' : 'Get Started'}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {isFree && (
                      <p className="text-xs text-foreground-tertiary text-center mt-2">
                        No credit card required
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
              {freePlan && (
                <div>
                  <h3 className="font-medium text-foreground mb-2">What happens after the {trialMonths} months?</h3>
                  <p className="text-foreground-secondary">
                    After your free period, plans start from {cheapestPrice}/month. No hidden fees, no transaction costs from us. Cancel anytime.
                  </p>
                </div>
              )}

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
