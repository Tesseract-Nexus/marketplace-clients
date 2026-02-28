'use client';

import React from 'react';
import { Building2, User, MapPin, Store, Check, ArrowLeft, Loader2, Sparkles, Rocket } from 'lucide-react';
import { getBusinessTypeLabel, getCountryName, getStateName, formatPhoneDisplay } from './constants';
import type { ReviewLaunchStepProps } from './types';

export function ReviewLaunchStep({
  storeSetupForm,
  onSubmit,
  setCurrentSection,
  isLoading,
  baseDomain,
  countries,
  states,
  businessInfo,
  contactDetails,
  businessAddress,
}: ReviewLaunchStepProps) {
  // Development-only logging
  const devError = (...args: unknown[]) => process.env.NODE_ENV === 'development' && console.error(...args);

  return (
    <form onSubmit={storeSetupForm.handleSubmit(onSubmit, (errors) => devError('[StoreSetup] Validation errors:', errors))} className="space-y-6" noValidate>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Ready to launch!</h1>
            <p className="text-muted-foreground">Review your settings and launch your store</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Business Information Section */}
        <div className="p-4 bg-warm-50 rounded-xl border border-warm-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-warm-600" />
              <span className="font-medium text-foreground">Business Information</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentSection(0)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Edit
            </button>
          </div>
          <div className="grid gap-2 text-sm">
            {businessInfo?.business_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name:</span>
                <span className="text-foreground font-medium">{businessInfo.business_name}</span>
              </div>
            )}
            {businessInfo?.business_type && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Type:</span>
                <span className="text-foreground font-medium">{getBusinessTypeLabel(businessInfo.business_type)}</span>
              </div>
            )}
            {businessInfo?.industry && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry:</span>
                <span className="text-foreground font-medium">{businessInfo.industry}</span>
              </div>
            )}
            {businessInfo?.website && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Website:</span>
                <span className="text-foreground font-medium">{businessInfo.website}</span>
              </div>
            )}
            {businessInfo?.registration_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Number:</span>
                <span className="text-foreground font-medium">{businessInfo.registration_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-sage-600" />
              <span className="font-medium text-foreground">Contact Details</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentSection(1)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Edit
            </button>
          </div>
          <div className="grid gap-2 text-sm">
            {(contactDetails?.first_name || contactDetails?.last_name) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="text-foreground font-medium">
                  {contactDetails.first_name} {contactDetails.last_name}
                </span>
              </div>
            )}
            {contactDetails?.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground font-medium">{contactDetails.email}</span>
              </div>
            )}
            {contactDetails?.phone_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="text-foreground font-medium">
                  {formatPhoneDisplay(contactDetails.phone_country_code || '', contactDetails.phone_number, countries)}
                </span>
              </div>
            )}
            {contactDetails?.job_title && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job Title:</span>
                <span className="text-foreground font-medium">{contactDetails.job_title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Business Address Section */}
        <div className="p-4 bg-warm-50 rounded-xl border border-warm-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-warm-600" />
              <span className="font-medium text-foreground">Business Address</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentSection(2)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Edit
            </button>
          </div>
          <div className="grid gap-2 text-sm">
            {businessAddress?.street_address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="text-foreground font-medium text-right">
                  {businessAddress.street_address}
                </span>
              </div>
            )}
            {businessAddress?.city && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">City:</span>
                <span className="text-foreground font-medium">{businessAddress.city}</span>
              </div>
            )}
            {businessAddress?.state_province && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">State/Province:</span>
                <span className="text-foreground font-medium">{getStateName(businessAddress.state_province, states)}</span>
              </div>
            )}
            {businessAddress?.postal_code && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Postal Code:</span>
                <span className="text-foreground font-medium">{businessAddress.postal_code}</span>
              </div>
            )}
            {businessAddress?.country && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country:</span>
                <span className="text-foreground font-medium">{getCountryName(businessAddress.country, countries)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Store Setup Section */}
        <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-sage-600" />
              <span className="font-medium text-foreground">Store Configuration</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentSection(3)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Edit
            </button>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Model:</span>
              <span className="text-foreground font-medium">
                {storeSetupForm.watch('businessModel') === 'ONLINE_STORE' ? 'Online Store' : 'Marketplace'}
              </span>
            </div>
            {/* Only show Admin URL if NOT using custom domain */}
            {!(storeSetupForm.watch('useCustomDomain') && storeSetupForm.watch('customDomain')) && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Store URL:</span>
                  <span className="text-foreground font-medium">{storeSetupForm.watch('subdomain')}.{baseDomain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin URL:</span>
                  <span className="text-foreground font-medium">{storeSetupForm.watch('subdomain')}-admin.{baseDomain}</span>
                </div>
              </>
            )}
            {/* Show custom domain URLs when using custom domain */}
            {storeSetupForm.watch('useCustomDomain') && storeSetupForm.watch('customDomain') && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Store URL:</span>
                  <span className="text-foreground font-medium">{storeSetupForm.watch('customDomain')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin URL:</span>
                  <span className="text-foreground font-medium">admin.{storeSetupForm.watch('customDomain')}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <span className="text-foreground font-medium">{storeSetupForm.watch('currency')}</span>
            </div>
            {storeSetupForm.watch('timezone') && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone:</span>
                <span className="text-foreground font-medium">{storeSetupForm.watch('timezone')}</span>
              </div>
            )}
            {storeSetupForm.watch('language') && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language:</span>
                <span className="text-foreground font-medium">{storeSetupForm.watch('language')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-sage-600" />
            <span className="text-sm text-muted-foreground">
              Review your information above. You can edit any section or proceed to launch your store.
            </span>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="pt-6 flex gap-4">
        <button
          type="button"
          onClick={() => setCurrentSection(5)}
          className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-14 bg-sage-600 hover:bg-sage-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Launch Store <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /></>}
        </button>
      </div>
    </form>
  );
}
