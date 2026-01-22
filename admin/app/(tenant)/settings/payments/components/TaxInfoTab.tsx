'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Globe,
  Percent,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Settings,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';

// Tax configuration by country
const TAX_CONFIG: Record<string, {
  name: string;
  flag: string;
  taxType: string;
  taxName: string;
  standardRate: string;
  description: string;
  categories: { name: string; rate: string }[];
  requirements: string[];
  registrationField?: string;
  registrationLabel?: string;
}> = {
  IN: {
    name: 'India',
    flag: '🇮🇳',
    taxType: 'GST',
    taxName: 'Goods and Services Tax',
    standardRate: '18%',
    description: 'GST is a unified indirect tax levied on goods and services across India.',
    categories: [
      { name: 'Essential goods', rate: '0%' },
      { name: 'Basic necessities', rate: '5%' },
      { name: 'Standard goods', rate: '12%' },
      { name: 'Most goods & services', rate: '18%' },
      { name: 'Luxury items', rate: '28%' },
    ],
    requirements: [
      'GSTIN (GST Identification Number) required for businesses with turnover above ₹20 lakhs',
      'Composition scheme available for small businesses under ₹1.5 crore turnover',
      'File GSTR-1 (outward supplies) by 11th of following month',
      'File GSTR-3B (summary return) by 20th of following month',
    ],
    registrationField: 'gstin',
    registrationLabel: 'GSTIN',
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    taxType: 'Sales Tax',
    taxName: 'Sales and Use Tax',
    standardRate: 'Varies by state (0-10.25%)',
    description: 'Sales tax is collected at the state and local level, with rates varying by jurisdiction.',
    categories: [
      { name: 'Oregon, Montana, NH, Delaware', rate: '0%' },
      { name: 'Colorado (lowest)', rate: '2.9%' },
      { name: 'California (highest state)', rate: '7.25%' },
      { name: 'Tennessee (highest combined)', rate: '9.55%' },
    ],
    requirements: [
      'Register for sales tax permit in states where you have nexus',
      'Nexus established by physical presence or economic activity thresholds',
      'Economic nexus typically at $100K sales or 200 transactions',
      'File returns monthly, quarterly, or annually based on volume',
    ],
    registrationField: 'salesTaxPermit',
    registrationLabel: 'Sales Tax Permit Number',
  },
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    taxType: 'VAT',
    taxName: 'Value Added Tax',
    standardRate: '20%',
    description: 'VAT is charged on most goods and services sold by VAT-registered businesses in the UK.',
    categories: [
      { name: 'Zero-rated (food, books, children\'s clothing)', rate: '0%' },
      { name: 'Reduced rate (energy, child car seats)', rate: '5%' },
      { name: 'Standard rate (most goods & services)', rate: '20%' },
    ],
    requirements: [
      'VAT registration required when turnover exceeds £85,000',
      'Voluntary registration available below threshold',
      'Submit VAT returns quarterly via Making Tax Digital',
      'Keep VAT records for at least 6 years',
    ],
    registrationField: 'vatNumber',
    registrationLabel: 'VAT Registration Number',
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    taxType: 'GST',
    taxName: 'Goods and Services Tax',
    standardRate: '10%',
    description: 'GST is a flat 10% tax on most goods, services and items sold or consumed in Australia.',
    categories: [
      { name: 'GST-free (fresh food, healthcare, education)', rate: '0%' },
      { name: 'Input-taxed (financial services, residential rent)', rate: 'N/A' },
      { name: 'Standard taxable supplies', rate: '10%' },
    ],
    requirements: [
      'GST registration required when turnover reaches $75,000',
      'Lower threshold of $150,000 for non-profit organisations',
      'Business Activity Statements (BAS) filed monthly or quarterly',
      'Keep records for 5 years',
    ],
    registrationField: 'abn',
    registrationLabel: 'ABN (Australian Business Number)',
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    taxType: 'GST/HST',
    taxName: 'Goods and Services Tax / Harmonized Sales Tax',
    standardRate: '5-15%',
    description: 'Federal GST of 5% applies across Canada, with some provinces adding PST or using combined HST.',
    categories: [
      { name: 'Alberta, Yukon, NWT, Nunavut (GST only)', rate: '5%' },
      { name: 'British Columbia (GST + PST)', rate: '12%' },
      { name: 'Ontario (HST)', rate: '13%' },
      { name: 'Nova Scotia, PEI, Newfoundland (HST)', rate: '15%' },
    ],
    requirements: [
      'GST/HST registration required when worldwide taxable revenue exceeds $30,000',
      'Register with CRA for GST/HST account',
      'File returns annually, quarterly, or monthly based on revenue',
      'Input Tax Credits (ITCs) can be claimed for business purchases',
    ],
    registrationField: 'gstHstNumber',
    registrationLabel: 'GST/HST Number',
  },
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    taxType: 'VAT',
    taxName: 'Umsatzsteuer (USt)',
    standardRate: '19%',
    description: 'German VAT applies to most goods and services, with reduced rates for essential items.',
    categories: [
      { name: 'Reduced rate (food, books, local transport)', rate: '7%' },
      { name: 'Standard rate (most goods & services)', rate: '19%' },
    ],
    requirements: [
      'VAT registration required for most businesses (no threshold for foreign sellers)',
      'Small business exemption (Kleinunternehmerregelung) available under €22,000 annual turnover',
      'Monthly or quarterly VAT returns (Umsatzsteuervoranmeldung)',
      'Annual VAT return (Umsatzsteuererklärung) required',
    ],
    registrationField: 'ustId',
    registrationLabel: 'USt-IdNr. (VAT ID)',
  },
  DEFAULT: {
    name: 'Your Region',
    flag: '🌍',
    taxType: 'Tax',
    taxName: 'Sales Tax / VAT',
    standardRate: 'Varies',
    description: 'Tax rates and requirements vary by country. Configure your specific region for accurate tax calculations.',
    categories: [
      { name: 'Standard rate', rate: 'Varies' },
      { name: 'Reduced rate', rate: 'Varies' },
    ],
    requirements: [
      'Check local tax authority requirements',
      'Register for applicable tax IDs',
      'File returns as required by your jurisdiction',
    ],
  },
};

// All available regions for the info dropdown
const ALL_REGIONS = ['IN', 'US', 'GB', 'AU', 'CA', 'DE'];

export function TaxInfoTab() {
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [storeCountryName, setStoreCountryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showOtherRegions, setShowOtherRegions] = useState(false);
  const [taxRegistration, setTaxRegistration] = useState<string | null>(null);

  useEffect(() => {
    loadTaxInfo();
  }, []);

  const loadTaxInfo = async () => {
    try {
      setLoading(true);
      const storefronts = await storefrontService.getStorefronts();

      if (storefronts.data && storefronts.data.length > 0) {
        const storefrontId = storefronts.data[0].id;
        const settings = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId,
        });

        if (settings?.ecommerce?.store?.address?.country) {
          const countryName = settings.ecommerce.store.address.country;
          setStoreCountryName(countryName);

          const countryMap: Record<string, string> = {
            'India': 'IN',
            'United States': 'US',
            'United Kingdom': 'GB',
            'Australia': 'AU',
            'Canada': 'CA',
            'Germany': 'DE',
            'France': 'DE', // Use DE (VAT) for France
            'Singapore': 'DEFAULT',
          };
          setStoreCountry(countryMap[countryName] || 'DEFAULT');
        }
      }
    } catch (error) {
      console.error('Failed to load tax info:', error);
    } finally {
      setLoading(false);
    }
  };

  const taxConfig = storeCountry ? TAX_CONFIG[storeCountry] || TAX_CONFIG.DEFAULT : TAX_CONFIG.DEFAULT;
  const isConfigured = storeCountry && storeCountry !== 'DEFAULT';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tax Status Card */}
      <div className={`rounded-xl border p-6 ${
        isConfigured ? 'bg-success-muted border-success/30' : 'bg-warning-muted border-warning/30'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isConfigured ? 'bg-success' : 'bg-warning'
            }`}>
              {isConfigured ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : (
                <AlertCircle className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isConfigured ? 'Tax Auto-Configured' : 'Tax Configuration Pending'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isConfigured
                  ? `${taxConfig.taxType} settings applied for ${taxConfig.flag} ${storeCountryName || taxConfig.name}`
                  : 'Set your store location in Store Settings to auto-configure taxes'
                }
              </p>
            </div>
          </div>
          {!isConfigured && (
            <Button asChild size="sm">
              <Link href="/settings/general">
                <MapPin className="h-4 w-4 mr-2" />
                Set Location
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Current Region Tax Info */}
      {isConfigured && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{taxConfig.flag}</span>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{taxConfig.taxName}</h3>
                  <p className="text-sm text-muted-foreground">{taxConfig.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{taxConfig.standardRate}</p>
                <p className="text-xs text-muted-foreground">Standard Rate</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">{taxConfig.description}</p>

            {/* Tax Categories */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Tax Rate Categories
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {taxConfig.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <span className="text-sm font-semibold text-primary">{cat.rate}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Compliance Requirements
              </h4>
              <ul className="space-y-2">
                {taxConfig.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Advanced Settings Link */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Need to customize tax rates, exemptions, or jurisdictions?
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/taxes">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Tax Settings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Other Regions Info */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowOtherRegions(!showOtherRegions)}
          className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-semibold text-foreground">Tax Rates by Region</h3>
              <p className="text-sm text-muted-foreground">View tax requirements for other countries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            {showOtherRegions ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {showOtherRegions && (
          <div className="border-t border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_REGIONS.filter(code => code !== storeCountry).map((code) => {
                const config = TAX_CONFIG[code];
                return (
                  <div key={code} className="p-4 bg-muted rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{config.flag}</span>
                      <span className="font-semibold text-foreground">{config.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{config.taxType}</span>
                      <span className="text-sm font-semibold text-primary">{config.standardRate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-primary font-medium">Automatic Tax Calculation</p>
            <p className="text-sm text-primary/80 mt-1">
              Taxes are automatically calculated at checkout based on your store location and customer shipping address.
              For cross-border sales, tax rules are applied according to destination-based taxation principles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
