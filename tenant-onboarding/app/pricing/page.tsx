'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Switch } from '@/components/ui';
import { Separator } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import { 
  Check, 
  Zap, 
  Building, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  MapPin,
  Star,
  Users,
  Shield,
  DollarSign,
  TrendingUp,
  Award,
  Calculator,
  MessageCircle,
  HelpCircle,
  User
} from 'lucide-react';
import { useOnboardingStore } from '../../lib/store/onboarding-store';
import { locationApi } from '../../lib/api/location';

// Development-only logging
const isDev = process.env.NODE_ENV === 'development';
const devError = (...args: unknown[]) => isDev && console.error(...args);

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
];

const currencySymbols = {
  USD: '$',
  INR: '₹',
  AUD: 'A$',
};

export default function PricingPage() {
  const router = useRouter();
  // const { setSelectedPlan } = useOnboardingStore();
  const [detectedCountry, setDetectedCountry] = useState('US');
  const [detectedCurrency, setDetectedCurrency] = useState('USD');
  const [salesAmount, setSalesAmount] = useState(10000);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-detect location and currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const location = await locationApi.detectLocation();
        setDetectedCountry(location.country);
        setDetectedCurrency(location.currency);
      } catch (error) {
        devError('[Pricing] Failed to detect location:', error);
        // Fallback to US/USD if detection fails
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  const currencySymbol = currencySymbols[detectedCurrency as keyof typeof currencySymbols] || '$';

  const getTransactionFee = (amount: number) => {
    if (amount <= 50000) return 2.8;
    if (amount <= 250000) return 2.5;
    return 2.2;
  };

  const calculateFees = (monthlyAmount: number) => {
    const rate = getTransactionFee(monthlyAmount);
    const monthlyFee = monthlyAmount * (rate / 100);
    const annualFee = monthlyFee * 12;
    return { rate, monthlyFee, annualFee };
  };

  const handleGetStarted = () => {
    // Set a basic plan for the revenue share model
    // setSelectedPlan({
    //   id: 'revenue-share',
    //   name: 'Revenue Share',
    //   description: 'Pay only when you sell',
    //   price: 0,
    //   currency: selectedCurrency,
    //   billingCycle: 'revenue-share',
    //   features: [
    //     'No setup fees',
    //     'No monthly charges',
    //     '2.8% transaction fee',
    //     'All platform features',
    //     '24/7 support',
    //     'Advanced analytics',
    //     'Multi-currency support',
    //     'Global payments'
    //   ]
    // });
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPage="pricing" />
      
      {/* Page Header */}
      <div className="pt-24 pb-8 px-6 reveal-once">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">Simple Revenue Sharing</h1>
          <p className="body-large text-[var(--foreground-secondary)]">Start free, pay only when you sell</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="display-large text-[var(--foreground)] mb-6">
            Start free, pay only when you sell
          </h2>
          <p className="body-large text-[var(--foreground-secondary)] max-w-3xl mx-auto mb-8">
            No setup fees, no monthly charges, no hidden costs. We only succeed when you do.
          </p>

          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="bg-card border border-border shadow-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-[var(--foreground)] text-sm">
                {isLoading ? 'Detecting location...' : COUNTRIES.find(c => c.code === detectedCountry)?.name || 'United States'}
              </span>
            </div>
          </div>
        </div>

        <div className="reveal-once" style={{ animationDelay: '0.1s' }}>
          {/* Revenue Share Pricing */}
          <div className="w-full">
            {/* Main Revenue Share Hero */}
            <div className="text-center mb-16">
              <div className="bg-card border border-border shadow-sm rounded-3xl p-12 max-w-4xl mx-auto">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-warm-100 flex items-center justify-center mb-8 shadow-sm">
                  <Check className="w-10 h-10 text-foreground-secondary" />
                </div>
                <h3 className="display-medium text-[var(--foreground)] mb-6">Simple Revenue Sharing</h3>
                <div className="space-y-4 mb-8 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">Per Transaction</div>
                      <div className="text-xs text-[var(--foreground-secondary)]">Industry-leading low rate</div>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">2.8%</div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">Setup Fees</div>
                      <div className="text-xs text-[var(--foreground-secondary)]">Get started instantly</div>
                    </div>
                    <div className="text-2xl font-semibold text-[var(--foreground-secondary)]">{currencySymbol}0</div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">Monthly Fees</div>
                      <div className="text-xs text-[var(--foreground-secondary)]">No recurring charges</div>
                    </div>
                    <div className="text-2xl font-semibold text-[var(--foreground-secondary)]">{currencySymbol}0</div>
                  </div>
                </div>
                <p className="body-large text-[var(--foreground-secondary)] mb-8 max-w-2xl mx-auto">
                  You only pay when you make a sale. No hidden fees, no surprise charges, no minimum commitments.
                </p>
                <button 
                  onClick={handleGetStarted}
                  className="apple-button px-8 py-4 text-lg font-medium transition-all duration-300  "
                >
                  Start Selling Now
                </button>
              </div>
            </div>

            {/* Volume Discounts */}
            <div className="bg-card border border-border rounded-3xl p-6 mb-16">
              <div className="flex items-center justify-between pb-4 border-b border-warm-200">
                <h3 className="text-lg font-semibold text-foreground">Volume discounts</h3>
                <span className="text-sm text-foreground-secondary">Rates decrease as you grow</span>
              </div>
              <div className="divide-y divide-warm-200">
                <div className="py-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-foreground-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Starter</h4>
                      <span className="text-sm font-semibold text-foreground">2.8%</span>
                    </div>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Up to {currencySymbol}50K/month • All features • 24/7 support
                    </p>
                  </div>
                </div>
                <div className="py-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-foreground-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Growth</h4>
                      <span className="text-sm font-semibold text-foreground">2.5%</span>
                    </div>
                    <p className="text-sm text-foreground-secondary mt-1">
                      {currencySymbol}50K–{currencySymbol}250K/month • Priority support • Advanced analytics
                    </p>
                  </div>
                </div>
                <div className="py-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-foreground-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Scale</h4>
                      <span className="text-sm font-semibold text-foreground">2.2%</span>
                    </div>
                    <p className="text-sm text-foreground-secondary mt-1">
                      {currencySymbol}250K+/month • Dedicated manager • Custom integrations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="bg-card border border-border shadow-sm rounded-3xl p-8 mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-foreground-secondary" />
                </div>
                <div>
                  <h3 className="headline text-[var(--foreground)]">Cost Calculator</h3>
                  <p className="body text-[var(--foreground-secondary)]">See exactly what you'll pay</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="text-[var(--foreground)] font-medium mb-3 block">Monthly Sales Volume</label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1000"
                      max="500000"
                      step="1000"
                      value={salesAmount}
                      onChange={(e) => setSalesAmount(Number(e.target.value))}
                      className="w-full h-2 bg-[var(--surface-tertiary)] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-[var(--foreground-secondary)] mt-2">
                      <span>{currencySymbol}1K</span>
                      <span>{currencySymbol}500K</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-2xl font-bold text-[var(--primary)]">{currencySymbol}{salesAmount.toLocaleString()}</div>
                    <div className="text-sm text-[var(--foreground-secondary)]">Monthly sales volume</div>
                  </div>
                </div>
                
                <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
                  <h4 className="font-semibold text-[var(--foreground)] mb-4">Your Costs</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[var(--foreground-secondary)]">Transaction rate:</span>
                      <span className="font-semibold text-[var(--primary)]">{getTransactionFee(salesAmount)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--foreground-secondary)]">Monthly fee:</span>
                      <span className="font-semibold text-[var(--foreground)]">{currencySymbol}{calculateFees(salesAmount).monthlyFee.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-[var(--foreground)]">You keep:</span>
                      <span className="font-bold text-[var(--foreground-secondary)]">{currencySymbol}{(salesAmount - calculateFees(salesAmount).monthlyFee).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div className="bg-card border border-border shadow-sm rounded-3xl p-8">
                <h3 className="headline text-[var(--foreground)] mb-6">Everything Included</h3>
                <div className="space-y-4">
                  {[
                    'Full e-commerce platform',
                    'Unlimited products',
                    'Advanced analytics',
                    'Multi-currency support',
                    'Global payment gateways',
                    'Mobile-responsive themes',
                    'SEO optimization',
                    'Inventory management',
                    '24/7 customer support',
                    'API access'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[var(--foreground-secondary)]" />
                      <span className="text-[var(--foreground-secondary)]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border shadow-sm rounded-3xl p-8">
                <h3 className="headline text-[var(--foreground)] mb-6">Why Choose Revenue Share?</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-2">Risk-Free</h4>
                      <p className="text-sm text-[var(--foreground-secondary)]">No upfront costs means zero financial risk when starting your business.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-2">Aligned Success</h4>
                      <p className="text-sm text-[var(--foreground-secondary)]">We only succeed when you do. Our incentives are perfectly aligned.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-foreground-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-2">Competitive Rates</h4>
                      <p className="text-sm text-[var(--foreground-secondary)]">Industry-leading rates that get better as your business grows.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <div className="bg-card border border-border shadow-sm rounded-3xl p-8 max-w-4xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-warm-100 flex items-center justify-center mb-6">
              <HelpCircle className="w-8 h-8 text-foreground-secondary" />
            </div>
            <h3 className="headline text-[var(--foreground)] mb-4">Questions?</h3>
            <p className="body text-[var(--foreground-secondary)] mb-8">
              Our team is here to help you understand our pricing and find the perfect solution for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="button-secondary px-6 py-3 font-medium transition-all duration-300  flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat with Sales
              </button>
              <button 
                onClick={handleGetStarted}
                className="apple-button px-6 py-3 font-medium transition-all duration-300  flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
