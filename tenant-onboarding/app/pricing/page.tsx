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
        console.error('Failed to detect location:', error);
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
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="display-medium text-[var(--foreground)] mb-4">Simple Revenue Sharing</h1>
          <p className="body-large text-[var(--foreground-secondary)]">Start free, pay only when you sell</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          {/* Background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-gradient-to-br from-[var(--apple-gray-5)] to-transparent rounded-full blur-3xl opacity-30 animate-float" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-gradient-to-br from-[var(--apple-gray-4)] to-transparent rounded-full blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}} />
          </div>
          
          <div className="animate-fadeInUp">
            <h2 className="display-large text-[var(--foreground)] mb-6">
              Start free, pay only when you sell
            </h2>
            <p className="body-large text-[var(--foreground-secondary)] max-w-3xl mx-auto mb-8">
              No setup fees, no monthly charges, no hidden costs. We only succeed when you do.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-[var(--foreground)] text-sm">
                {isLoading ? 'Detecting location...' : COUNTRIES.find(c => c.code === detectedCountry)?.name || 'United States'}
              </span>
            </div>
          </div>
        </div>

        <div className="animate-fadeInUp" style={{animationDelay: '0.4s'}}>
          {/* Revenue Share Pricing */}
          <div className="w-full">
            {/* Main Revenue Share Hero */}
            <div className="text-center mb-16">
              <div className="glass-strong rounded-3xl p-12 max-w-4xl mx-auto border border-[var(--border)]/20 hover:scale-105 transition-all duration-500 shadow-2xl">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[var(--apple-green)] to-[var(--apple-mint)] flex items-center justify-center mb-8 animate-float shadow-2xl">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="display-medium text-[var(--foreground)] mb-6">Simple Revenue Sharing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-[var(--primary)] mb-4">2.8%</div>
                    <div className="body font-semibold text-[var(--foreground)] mb-2">Per Transaction</div>
                    <div className="caption text-[var(--foreground-secondary)]">Industry-leading low rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-[var(--apple-green)] mb-4">{currencySymbol}0</div>
                    <div className="body font-semibold text-[var(--foreground)] mb-2">Setup Fees</div>
                    <div className="caption text-[var(--foreground-secondary)]">Get started instantly</div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-[var(--apple-blue)] mb-4">{currencySymbol}0</div>
                    <div className="body font-semibold text-[var(--foreground)] mb-2">Monthly Fees</div>
                    <div className="caption text-[var(--foreground-secondary)]">No recurring charges</div>
                  </div>
                </div>
                <p className="body-large text-[var(--foreground-secondary)] mb-8 max-w-2xl mx-auto">
                  You only pay when you make a sale. No hidden fees, no surprise charges, no minimum commitments.
                </p>
                <button 
                  onClick={handleGetStarted}
                  className="apple-button px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105 animate-glow"
                >
                  Start Selling Now
                </button>
              </div>
            </div>

            {/* Volume Discounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-scaleIn border border-[var(--border)]/20">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-indigo)] flex items-center justify-center mb-6 animate-float">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Starter</h3>
                <div className="text-3xl font-bold text-[var(--primary)] mb-2">2.8%</div>
                <p className="text-sm text-[var(--foreground-secondary)] mb-6">
                  Perfect for new businesses
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">Up to {currencySymbol}50K monthly sales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">All platform features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">24/7 support</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-scaleIn border border-[var(--primary)]/30 shadow-2xl relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="glass-strong rounded-full px-4 py-2 border border-[var(--primary)]/30">
                    <span className="text-sm font-semibold text-[var(--primary)]">Most Popular</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--apple-green)] to-[var(--apple-mint)] flex items-center justify-center mb-6 animate-float">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Growth</h3>
                <div className="text-3xl font-bold text-[var(--primary)] mb-2">2.5%</div>
                <p className="text-sm text-[var(--foreground-secondary)] mb-6">
                  For growing businesses
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">{currencySymbol}50K - {currencySymbol}250K monthly sales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">Advanced analytics</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-scaleIn border border-[var(--border)]/20">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--apple-indigo)] to-[var(--apple-purple)] flex items-center justify-center mb-6 animate-float">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Scale</h3>
                <div className="text-3xl font-bold text-[var(--primary)] mb-2">2.2%</div>
                <p className="text-sm text-[var(--foreground-secondary)] mb-6">
                  For enterprise businesses
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">{currencySymbol}250K+ monthly sales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">Dedicated account manager</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[var(--apple-green)]" />
                    <span className="text-sm text-[var(--foreground-secondary)]">Custom integrations</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="glass-strong rounded-3xl p-8 mb-16 border border-[var(--border)]/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--apple-yellow)] to-[var(--apple-orange)] flex items-center justify-center animate-float">
                  <Calculator className="w-8 h-8 text-white" />
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
                
                <div className="glass-subtle rounded-2xl p-6">
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
                      <span className="font-bold text-[var(--apple-green)]">{currencySymbol}{(salesAmount - calculateFees(salesAmount).monthlyFee).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div className="glass-card rounded-3xl p-8">
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
                      <Check className="w-5 h-5 text-[var(--apple-green)]" />
                      <span className="text-[var(--foreground-secondary)]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8">
                <h3 className="headline text-[var(--foreground)] mb-6">Why Choose Revenue Share?</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-green)]/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[var(--apple-green)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-2">Risk-Free</h4>
                      <p className="text-sm text-[var(--foreground-secondary)]">No upfront costs means zero financial risk when starting your business.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-blue)]/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-[var(--apple-blue)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-2">Aligned Success</h4>
                      <p className="text-sm text-[var(--foreground-secondary)]">We only succeed when you do. Our incentives are perfectly aligned.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-indigo)]/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-[var(--apple-indigo)]" />
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
        <div className="mt-20 text-center animate-fadeInUp">
          <div className="glass-strong rounded-3xl p-8 max-w-4xl mx-auto border border-[var(--border)]/20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--apple-gray-2)] to-[var(--primary)] flex items-center justify-center mb-6 animate-float">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="headline text-[var(--foreground)] mb-4">Questions?</h3>
            <p className="body text-[var(--foreground-secondary)] mb-8">
              Our team is here to help you understand our pricing and find the perfect solution for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="button-secondary px-6 py-3 font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat with Sales
              </button>
              <button 
                onClick={handleGetStarted}
                className="apple-button px-6 py-3 font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}