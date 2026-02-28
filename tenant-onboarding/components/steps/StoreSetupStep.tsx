'use client';

import React from 'react';
import { Store, Globe, Clock, Link2, ArrowLeft, ArrowRight, Loader2, Check, AlertCircle, Copy, ExternalLink, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { labelClass, generateSlugFromName } from './constants';
import { normalizeDomain, generateUrls, DEFAULT_STOREFRONT_SUBDOMAIN } from '../../lib/utils/domain';
import type { StoreSetupStepProps } from './types';

export function StoreSetupStep({
  form,
  onContinue,
  setCurrentSection,
  currencies,
  timezones,
  baseDomain,
  businessInfo,
  slugValidation,
  storefrontValidation,
  customDomainValidation,
  domainVerification,
  showCustomDomainSection,
  setShowCustomDomainSection,
  setSubdomainManuallyEdited,
  storefrontSlugManuallyEdited,
  setStorefrontSlugManuallyEdited,
  showSensitiveDNS,
  setShowSensitiveDNS,
  validateCustomDomain,
  verifyDomainDNS,
  setCustomDomainValidation,
  copiedItem,
  copyToClipboard,
}: StoreSetupStepProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
            <Store className="w-6 h-6 text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Set up your store</h1>
            <p className="text-muted-foreground">Configure your store settings</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Business Model Selection */}
        <div>
          <label className={labelClass}>Business Model *</label>
          <p className="text-xs text-muted-foreground mb-3">Choose how you want to sell</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                form.watch('businessModel') === 'ONLINE_STORE'
                  ? 'border-primary bg-warm-50'
                  : 'border-border hover:border-warm-300'
              }`}
            >
              <input
                type="radio"
                {...form.register('businessModel')}
                value="ONLINE_STORE"
                className="sr-only"
              />
              <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-warm-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground block">Online Store</span>
                <span className="text-sm text-muted-foreground">Sell your own products directly to customers (D2C)</span>
              </div>
              {form.watch('businessModel') === 'ONLINE_STORE' && (
                <div className="absolute top-3 right-3">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              )}
            </label>

            <label
              className="relative flex items-start gap-4 p-4 rounded-xl border-2 border-border bg-muted/30 opacity-70 cursor-not-allowed"
            >
              <input
                type="radio"
                {...form.register('businessModel')}
                value="MARKETPLACE"
                className="sr-only"
                disabled
              />
              <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-warm-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground block">Marketplace</span>
                <span className="text-sm text-muted-foreground">Multi-vendor platform with commission-based sales</span>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  Coming soon
                </span>
              </div>
            </label>
          </div>
          {form.formState.errors.businessModel && (
            <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.businessModel.message}</p>
          )}
        </div>

        {/* Admin URL */}
        <div className={`transition-all duration-200 ${showCustomDomainSection ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass}>
              Store Admin URL *
              {showCustomDomainSection && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(Secondary - using custom domain)</span>
              )}
            </label>
            {!showCustomDomainSection && businessInfo?.business_name && (
              <button
                type="button"
                onClick={() => {
                  const slug = generateSlugFromName(businessInfo.business_name || '');
                  form.setValue('subdomain', slug);
                  setSubdomainManuallyEdited(false);
                }}
                className="text-xs text-primary hover:text-foreground font-medium"
              >
                Reset to auto-generated
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {showCustomDomainSection
              ? 'This will be your backup admin URL. Your custom domain will be primary.'
              : 'Auto-generated from your business name. Edit if you prefer a different URL.'
            }
          </p>
          <div className="relative">
            <div className="flex">
              <div className="relative flex-1">
                <input
                  {...form.register('subdomain')}
                  placeholder="mystore"
                  disabled={showCustomDomainSection}
                  onChange={(e) => {
                    form.setValue('subdomain', e.target.value);
                    setSubdomainManuallyEdited(true);
                  }}
                  className={`w-full h-14 px-5 pr-12 text-base bg-warm-50 border rounded-l-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                    showCustomDomainSection
                      ? 'border-warm-200 bg-warm-100 cursor-not-allowed'
                      : slugValidation.isAvailable === true
                        ? 'border-sage-500 focus:border-sage-500 focus:ring-sage-500/20'
                        : slugValidation.isAvailable === false
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                          : 'border-warm-200 focus:border-primary focus:ring-primary/20'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {!showCustomDomainSection && (
                    slugValidation.isChecking ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : slugValidation.isAvailable === true ? (
                      <Check className="w-5 h-5 text-sage-600" />
                    ) : slugValidation.isAvailable === false ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : null
                  )}
                </div>
              </div>
              <span className="h-14 px-5 bg-warm-100 border border-warm-200 border-l-0 rounded-r-xl flex items-center text-sm text-muted-foreground whitespace-nowrap">
                -admin.{baseDomain}
              </span>
            </div>

            {!showCustomDomainSection && slugValidation.message && (
              <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                slugValidation.isAvailable === true
                  ? 'text-emerald-600'
                  : slugValidation.isAvailable === false
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }`}>
                {slugValidation.isAvailable === true && <Check className="w-4 h-4" />}
                {slugValidation.isAvailable === false && <AlertCircle className="w-4 h-4" />}
                {slugValidation.message}
              </p>
            )}

            {!showCustomDomainSection && slugValidation.isAvailable === false && slugValidation.suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-warm-50 rounded-lg border border-warm-200">
                <p className="text-xs text-muted-foreground mb-2">Try one of these available names:</p>
                <div className="flex flex-wrap gap-2">
                  {slugValidation.suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => form.setValue('subdomain', suggestion)}
                      className="px-3 py-1.5 text-sm bg-card border border-warm-200 rounded-lg hover:border-primary hover:bg-warm-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storefront URL */}
        <div className={`transition-all duration-200 ${showCustomDomainSection ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass}>
              Storefront URL *
              {showCustomDomainSection && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(Secondary - using custom domain)</span>
              )}
            </label>
            {!showCustomDomainSection && storefrontSlugManuallyEdited && (
              <button
                type="button"
                onClick={() => {
                  const slug = form.getValues('subdomain') || generateSlugFromName(businessInfo.business_name || '');
                  form.setValue('storefrontSlug', slug);
                  setStorefrontSlugManuallyEdited(false);
                }}
                className="text-xs text-primary hover:text-foreground font-medium"
              >
                Reset to match admin URL
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {showCustomDomainSection
              ? 'This will be your backup storefront URL. Your custom domain will be primary.'
              : 'Auto-synced with your admin URL. Edit if you prefer a different storefront URL.'
            }
          </p>
          <div className="relative">
            <div className="flex">
              <div className="relative flex-1">
                <input
                  {...form.register('storefrontSlug')}
                  placeholder="mystore"
                  disabled={showCustomDomainSection}
                  onChange={(e) => {
                    form.setValue('storefrontSlug', e.target.value);
                    setStorefrontSlugManuallyEdited(true);
                  }}
                  className={`w-full h-14 px-5 pr-12 text-base bg-warm-50 border rounded-l-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                    showCustomDomainSection
                      ? 'border-warm-200 bg-warm-100 cursor-not-allowed'
                      : storefrontValidation.isAvailable === true
                        ? 'border-sage-500 focus:border-sage-500 focus:ring-sage-500/20'
                        : storefrontValidation.isAvailable === false
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                          : 'border-warm-200 focus:border-primary focus:ring-primary/20'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {!showCustomDomainSection && (
                    storefrontValidation.isChecking ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : storefrontValidation.isAvailable === true ? (
                      <Check className="w-5 h-5 text-sage-600" />
                    ) : storefrontValidation.isAvailable === false ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : null
                  )}
                </div>
              </div>
              <span className="h-14 px-5 bg-warm-100 border border-warm-200 border-l-0 rounded-r-xl flex items-center text-sm text-muted-foreground whitespace-nowrap">
                .{baseDomain}
              </span>
            </div>

            {!showCustomDomainSection && storefrontValidation.message && (
              <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                storefrontValidation.isAvailable === true
                  ? 'text-emerald-600'
                  : storefrontValidation.isAvailable === false
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }`}>
                {storefrontValidation.isAvailable === true && <Check className="w-4 h-4" />}
                {storefrontValidation.isAvailable === false && <AlertCircle className="w-4 h-4" />}
                {storefrontValidation.message}
              </p>
            )}

            {!showCustomDomainSection && storefrontValidation.isAvailable === false && storefrontValidation.suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-warm-50 rounded-lg border border-warm-200">
                <p className="text-xs text-muted-foreground mb-2">Try one of these available names:</p>
                <div className="flex flex-wrap gap-2">
                  {storefrontValidation.suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => form.setValue('storefrontSlug', suggestion)}
                      className="px-3 py-1.5 text-sm bg-card border border-warm-200 rounded-lg hover:border-primary hover:bg-warm-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showCustomDomainSection && !storefrontValidation.message && (
              <p className="mt-2 text-xs text-muted-foreground">
                This is your customer-facing store URL. Synced with admin URL by default.
              </p>
            )}
          </div>
        </div>

        {/* Custom Domain Section Toggle */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              const wasOpen = showCustomDomainSection;
              setShowCustomDomainSection(!showCustomDomainSection);
              if (!wasOpen) {
                form.setValue('useCustomDomain', true);
                const existingDomain = form.getValues('customDomain');
                if (existingDomain) {
                  validateCustomDomain(existingDomain);
                }
              } else {
                form.setValue('useCustomDomain', false);
                form.setValue('customDomain', '');
                setCustomDomainValidation({
                  isChecking: false,
                  isValid: null,
                  dnsConfigured: false,
                  message: '',
                  formatWarning: undefined,
                  suggestedDomain: undefined,
                });
              }
            }}
            className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 group ${
              showCustomDomainSection
                ? 'bg-gradient-to-r from-primary/10 to-sage-50 border-primary shadow-sm'
                : 'bg-card hover:bg-warm-50 border-warm-200 hover:border-primary/50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                showCustomDomainSection
                  ? 'bg-gradient-to-br from-primary to-emerald-600 shadow-md'
                  : 'bg-gradient-to-br from-warm-300 to-warm-400 group-hover:from-primary/80 group-hover:to-primary'
              }`}>
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-base">Connect Your Own Domain</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Use a custom domain like <span className="font-medium text-primary">store.yourbrand.com</span>
                </p>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              showCustomDomainSection
                ? 'bg-primary text-white shadow-md'
                : 'bg-warm-100 group-hover:bg-primary/20'
            }`}>
              {showCustomDomainSection ? (
                <Check className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5 text-warm-500 group-hover:text-primary transition-colors" />
              )}
            </div>
          </button>

          {/* Expandable Custom Domain Section */}
          {showCustomDomainSection && (
            <div className="mt-4 p-6 bg-gradient-to-br from-primary/5 to-sage-50/50 rounded-2xl border-2 border-primary/20 animate-in slide-in-from-top-2 duration-200 shadow-sm">
              <div className="space-y-5">
                {/* Custom Domain Input */}
                <div>
                  <label className={labelClass}>Your Domain</label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your root domain (e.g., yourbrand.com). We&apos;ll automatically configure admin and storefront URLs.
                  </p>
                  <div className="relative">
                    <input
                      {...form.register('customDomain')}
                      placeholder="yourbrand.com"
                      onBlur={(e) => {
                        const normalized = normalizeDomain(e.target.value);
                        if (normalized !== e.target.value) {
                          form.setValue('customDomain', normalized);
                        }
                      }}
                      className={`w-full h-14 px-5 pr-12 text-base bg-white border-2 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
                        customDomainValidation.isValid === true
                          ? 'border-sage-500 focus:border-sage-500 focus:ring-sage-500/20'
                          : customDomainValidation.isValid === false
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-warm-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {customDomainValidation.isChecking ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : customDomainValidation.isValid === true ? (
                        customDomainValidation.dnsConfigured ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        )
                      ) : customDomainValidation.isValid === false ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  </div>

                  {customDomainValidation.message && (
                    <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                      customDomainValidation.isValid === true
                        ? 'text-sage-600'
                        : customDomainValidation.isValid === false
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                    }`}>
                      {customDomainValidation.isValid === true && <Check className="w-4 h-4" />}
                      {customDomainValidation.isValid === false && <AlertCircle className="w-4 h-4" />}
                      {customDomainValidation.message}
                    </p>
                  )}

                  {customDomainValidation.formatWarning && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-700">
                            {customDomainValidation.formatWarning}
                          </p>
                          {customDomainValidation.suggestedDomain && (
                            <button
                              type="button"
                              onClick={() => {
                                form.setValue('customDomain', customDomainValidation.suggestedDomain || '');
                                validateCustomDomain(customDomainValidation.suggestedDomain || '');
                              }}
                              className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-800 underline underline-offset-2"
                            >
                              Use {customDomainValidation.suggestedDomain} instead
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated URLs Preview */}
                {(() => {
                  const domainInput = form.watch('customDomain');
                  const urls = domainInput ? generateUrls(domainInput, {
                    adminSubdomain: 'admin',
                    storefrontSubdomain: DEFAULT_STOREFRONT_SUBDOMAIN,
                  }) : null;
                  if (!urls || !domainInput || domainInput.length < 4) return null;

                  return (
                    <div className="p-4 bg-white rounded-xl border-2 border-warm-200">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Your Store URLs</p>
                      <div className="space-y-3">
                        <div className="p-3 bg-warm-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
                              <p className="text-sm font-semibold text-foreground truncate">{urls.admin}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-warm-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Storefront (Customer-facing)</p>
                              <p className="text-sm font-semibold text-foreground">https://www.{urls.baseDomain}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground text-center">
                        URL structure can be customized later in Settings
                      </p>
                    </div>
                  );
                })()}

                {/* DNS Configuration Instructions */}
                {customDomainValidation.isValid === true && customDomainValidation.verificationRecord && (
                  <div className="p-5 bg-white rounded-xl border-2 border-warm-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">DNS Configuration Required</p>
                        <p className="text-xs text-muted-foreground">Add these records to your domain provider (GoDaddy, Cloudflare, Namecheap, etc.)</p>
                      </div>
                    </div>

                    {/* Step 1: Domain Verification */}
                    <div className="p-4 bg-primary/5 rounded-xl border-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">Domain Verification (Required)</p>
                          <p className="text-xs text-primary/70">Verify ownership of your domain</p>
                        </div>
                      </div>

                      {(() => {
                        const selectedRecord = customDomainValidation.verificationRecords?.find(r => r.type === 'CNAME') || customDomainValidation.verificationRecord;
                        if (!selectedRecord) return null;
                        return (
                          <div className="bg-white rounded-lg overflow-hidden border border-primary/20">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-primary/10 bg-primary/5">
                                    <th className="text-left text-xs font-medium text-primary/70 uppercase tracking-wide px-4 py-3 w-20">Type</th>
                                    <th className="text-left text-xs font-medium text-primary/70 uppercase tracking-wide px-4 py-3">Host / Name</th>
                                    <th className="text-left text-xs font-medium text-primary/70 uppercase tracking-wide px-4 py-3">Value / Points To</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="px-4 py-3 align-top">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono font-semibold text-xs ${
                                        selectedRecord.type === 'CNAME'
                                          ? 'bg-sage-100 text-sage-700'
                                          : 'bg-primary/10 text-primary'
                                      }`}>
                                        {selectedRecord.type}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <div className="flex items-start gap-2">
                                        <code className="flex-1 font-mono text-sm text-foreground bg-warm-50 px-3 py-2 rounded-lg break-all select-all">
                                          {selectedRecord.host}
                                        </code>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(selectedRecord.host || '', 'verification-host')}
                                          className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
                                          title="Copy host"
                                        >
                                          {copiedItem === 'verification-host' ? (
                                            <><Check className="w-4 h-4 text-sage-600" /><span className="text-xs text-sage-600">Copied!</span></>
                                          ) : (
                                            <Copy className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <div className="flex items-start gap-2">
                                        <code className="flex-1 font-mono text-sm text-foreground bg-warm-50 px-3 py-2 rounded-lg break-all select-all">
                                          {selectedRecord.value}
                                        </code>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(selectedRecord.value || '', 'verification-value')}
                                          className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
                                          title="Copy value"
                                        >
                                          {copiedItem === 'verification-value' ? (
                                            <><Check className="w-4 h-4 text-sage-600" /><span className="text-xs text-sage-600">Copied!</span></>
                                          ) : (
                                            <Copy className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Quick Help */}
                    <div className="mt-4 p-3 bg-warm-100 rounded-lg border border-warm-300">
                      <p className="text-sm text-foreground-secondary">
                        <strong className="font-semibold text-foreground">Where to add this?</strong> Log in to your domain provider and find DNS settings, Zone Editor, or DNS Management. Add the record above.
                      </p>
                    </div>

                    {/* Verify Step 1 */}
                    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-warm-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">Verify Domain Ownership</h4>
                        <button
                          type="button"
                          onClick={verifyDomainDNS}
                          disabled={domainVerification.isVerifying}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          {domainVerification.isVerifying ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</>
                          ) : (
                            <><RefreshCw className="w-4 h-4" />Verify Now</>
                          )}
                        </button>
                      </div>

                      {domainVerification.lastChecked && (
                        <div className={`flex items-center gap-3 p-4 rounded-lg ${
                          domainVerification.dnsVerified
                            ? 'bg-sage-50 border-2 border-sage-300'
                            : domainVerification.dnsRecordFound
                              ? 'bg-amber-50 border-2 border-amber-200'
                              : 'bg-red-50 border-2 border-red-200'
                        }`}>
                          {domainVerification.dnsVerified ? (
                            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-6 h-6 text-sage-600" />
                            </div>
                          ) : domainVerification.dnsRecordFound ? (
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={`text-base font-semibold ${
                              domainVerification.dnsVerified
                                ? 'text-sage-700'
                                : domainVerification.dnsRecordFound
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                            }`}>
                              {domainVerification.dnsVerified ? 'Domain Ownership Verified!' : domainVerification.dnsRecordFound ? 'DNS Record Found (Incorrect Value)' : 'DNS Record Not Found'}
                            </p>
                            <p className={`text-sm mt-1 ${
                              domainVerification.dnsVerified
                                ? 'text-sage-600'
                                : domainVerification.dnsRecordFound
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                            }`}>
                              {domainVerification.dnsVerified ? 'Proceed to Step 2 below to complete your DNS setup.' : domainVerification.message}
                            </p>
                          </div>
                        </div>
                      )}

                      {!domainVerification.lastChecked && (
                        <p className="text-sm text-muted-foreground">
                          After adding the DNS record above, click &quot;Verify Now&quot; to confirm ownership.
                        </p>
                      )}
                    </div>

                    {/* Step 2: Routing A Records */}
                    {domainVerification.dnsVerified && customDomainValidation.routingRecords && customDomainValidation.routingRecords.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-red-600">2</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-red-700">Routing A Records (Required)</p>
                              <p className="text-xs text-red-600">Point your domain to our servers</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSensitiveDNS(!showSensitiveDNS)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                          >
                            {showSensitiveDNS ? (
                              <><EyeOff className="w-3.5 h-3.5" />Hide Values</>
                            ) : (
                              <><Eye className="w-3.5 h-3.5" />Show Values</>
                            )}
                          </button>
                        </div>

                        <div className="bg-white rounded-lg overflow-hidden border border-red-200">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-red-100 bg-red-50">
                                <th className="text-left text-xs font-medium text-red-600 uppercase tracking-wide px-4 py-2 w-16">Type</th>
                                <th className="text-left text-xs font-medium text-red-600 uppercase tracking-wide px-4 py-2">Host</th>
                                <th className="text-left text-xs font-medium text-red-600 uppercase tracking-wide px-4 py-2">Value (IP Address)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customDomainValidation.routingRecords.map((record, index) => (
                                <tr key={index} className={index % 2 === 0 ? '' : 'bg-red-50/50'}>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold text-xs bg-red-100 text-red-700">
                                      {record.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <code className="font-mono text-sm text-foreground">{record.host}</code>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(record.host, `routing-host-${index}`)}
                                        className="p-1 text-muted-foreground hover:text-primary rounded transition-colors flex items-center gap-1"
                                        title="Copy"
                                      >
                                        {copiedItem === `routing-host-${index}` ? (
                                          <><Check className="w-3.5 h-3.5 text-sage-600" /><span className="text-xs text-sage-600">Copied!</span></>
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <code className={`font-mono text-sm ${showSensitiveDNS ? 'text-red-700 font-semibold' : 'text-muted-foreground'}`}>
                                        {showSensitiveDNS ? record.value : '••••••••••••'}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(record.value, `routing-value-${index}`)}
                                        className="p-1 text-muted-foreground hover:text-primary rounded transition-colors flex items-center gap-1"
                                        title="Copy (copies actual value)"
                                      >
                                        {copiedItem === `routing-value-${index}` ? (
                                          <><Check className="w-3.5 h-3.5 text-sage-600" /><span className="text-xs text-sage-600">Copied!</span></>
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <p className="mt-2 text-xs text-red-600">
                          <strong>Security:</strong> Values are hidden by default. Click &quot;Show Values&quot; to reveal, or copy directly.
                        </p>
                      </div>
                    )}

                    {/* Step 3: CNAME Delegation for Automatic SSL */}
                    {domainVerification.dnsVerified && customDomainValidation.cnameDelegationRecord && customDomainValidation.cnameDelegationEnabled && (
                      <div className="mt-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-emerald-600">3</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-emerald-700">Automatic SSL Certificate (Recommended)</p>
                              <p className="text-xs text-emerald-600">Add once, certificates auto-renew forever</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg overflow-hidden border border-emerald-200">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-emerald-100 bg-emerald-50">
                                <th className="text-left text-xs font-medium text-emerald-600 uppercase tracking-wide px-4 py-2 w-16">Type</th>
                                <th className="text-left text-xs font-medium text-emerald-600 uppercase tracking-wide px-4 py-2">Host</th>
                                <th className="text-left text-xs font-medium text-emerald-600 uppercase tracking-wide px-4 py-2">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="px-4 py-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold text-xs bg-emerald-100 text-emerald-700">
                                    CNAME
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-sm text-foreground break-all">{customDomainValidation.cnameDelegationRecord.host}</code>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(customDomainValidation.cnameDelegationRecord?.host || '', 'ssl-host')}
                                      className="p-1 text-muted-foreground hover:text-primary rounded transition-colors flex-shrink-0 flex items-center gap-1"
                                      title="Copy"
                                    >
                                      {copiedItem === 'ssl-host' ? (
                                        <><Check className="w-3.5 h-3.5 text-sage-600" /><span className="text-xs text-sage-600">Copied!</span></>
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-sm text-emerald-700 font-semibold break-all">{customDomainValidation.cnameDelegationRecord.value}</code>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(customDomainValidation.cnameDelegationRecord?.value || '', 'ssl-value')}
                                      className="p-1 text-muted-foreground hover:text-primary rounded transition-colors flex-shrink-0 flex items-center gap-1"
                                      title="Copy"
                                    >
                                      {copiedItem === 'ssl-value' ? (
                                        <><Check className="w-3.5 h-3.5 text-sage-600" /><span className="text-xs text-sage-600">Copied!</span></>
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-2 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-600">
                            Certificates auto-renew. SSL can be issued before your domain points to us.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* DNS Propagation Note */}
                    <p className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>DNS changes can take up to 48 hours to propagate. You can complete setup now and verify the domain later in Settings.</span>
                    </p>
                  </div>
                )}

                {/* Cancel custom domain */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomDomainSection(false);
                      form.setValue('useCustomDomain', false);
                      form.setValue('customDomain', '');
                      setCustomDomainValidation({
                        isChecking: false,
                        isValid: null,
                        dnsConfigured: false,
                        message: '',
                        formatWarning: undefined,
                        suggestedDomain: undefined,
                      });
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-warm-100"
                  >
                    ← Skip custom domain for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Currency, Timezone, Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Currency *</label>
            <SearchableSelect
              options={currencies.map(c => ({
                value: c.code,
                label: `${c.symbol} ${c.code}`,
                description: c.name,
                searchTerms: [c.name, c.code, c.symbol],
              }))}
              value={form.watch('currency')}
              onChange={(value) => form.setValue('currency', value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Select currency"
              searchPlaceholder="Search currencies..."
              error={!!form.formState.errors.currency}
            />
            {form.formState.errors.currency && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.currency.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Timezone *</label>
            <SearchableSelect
              options={timezones.map(tz => ({
                value: tz.id,
                label: tz.name,
                description: tz.offset,
                searchTerms: [tz.name, tz.offset, tz.id],
              }))}
              value={form.watch('timezone')}
              onChange={(value) => form.setValue('timezone', value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Select timezone"
              searchPlaceholder="Search timezones..."
              error={!!form.formState.errors.timezone}
            />
            {form.formState.errors.timezone && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.timezone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Default Language</label>
          <SearchableSelect
            options={[
              { value: 'en', label: 'English', icon: <span>🇺🇸</span> },
              { value: 'es', label: 'Spanish', icon: <span>🇪🇸</span> },
              { value: 'fr', label: 'French', icon: <span>🇫🇷</span> },
              { value: 'de', label: 'German', icon: <span>🇩🇪</span> },
            ]}
            value={form.watch('language')}
            onChange={(value) => form.setValue('language', value)}
            placeholder="Select language"
            enableSearch={false}
          />
        </div>

        {/* Navigation buttons */}
        <div className="pt-6 flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentSection(2)}
            className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group"
          >
            Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </>
  );
}
