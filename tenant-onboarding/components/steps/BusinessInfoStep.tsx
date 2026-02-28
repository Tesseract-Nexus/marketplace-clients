'use client';

import { Building2, ArrowRight, Loader2, Check } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { MARKETPLACE_PLATFORMS } from '../../lib/validations/onboarding';
import type { BusinessInfoForm } from '../../lib/validations/onboarding';
import type { BusinessInfoStepProps } from './types';
import { BUSINESS_TYPES, INDUSTRY_CATEGORIES, inputClass, inputErrorClass, labelClass } from './constants';

export function BusinessInfoStep({ form, onSubmit, isLoading }: BusinessInfoStepProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Tell us about your business</h1>
            <p className="text-muted-foreground">We&apos;ll use this to set up your store</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="businessName" className={labelClass}>Business Name *</label>
          <input
            id="businessName"
            {...form.register('businessName')}
            placeholder="Your amazing business"
            className={form.formState.errors.businessName ? inputErrorClass : inputClass}
          />
          {form.formState.errors.businessName && (
            <p className="mt-2 text-sm text-red-400">{form.formState.errors.businessName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="businessType" className={labelClass}>Business Type *</label>
            <SearchableSelect
              id="businessType"
              options={BUSINESS_TYPES.map(type => ({
                value: type.value,
                label: type.label,
              }))}
              value={form.watch('businessType')}
              onChange={(value) => form.setValue('businessType', value as BusinessInfoForm['businessType'])}
              placeholder="Select type"
              searchPlaceholder="Search business types..."
              error={!!form.formState.errors.businessType}
              enableSearch={false}
            />
            {form.formState.errors.businessType && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.businessType.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="industryCategory" className={labelClass}>Industry *</label>
            <SearchableSelect
              id="industryCategory"
              options={INDUSTRY_CATEGORIES.map(cat => ({
                value: cat,
                label: cat,
              }))}
              value={form.watch('industryCategory')}
              onChange={(value) => form.setValue('industryCategory', value)}
              placeholder="Select industry"
              searchPlaceholder="Search industries..."
              error={!!form.formState.errors.industryCategory}
            />
            {form.formState.errors.industryCategory && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.industryCategory.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="companyWebsite" className={labelClass}>Website (optional)</label>
          <input
            id="companyWebsite"
            {...form.register('companyWebsite')}
            type="url"
            placeholder="https://yourwebsite.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="businessDescription" className={labelClass}>Business Description (optional)</label>
          <textarea
            id="businessDescription"
            {...form.register('businessDescription')}
            placeholder="Tell us what makes your business unique..."
            rows={3}
            className="w-full px-5 py-4 text-base bg-warm-50 border border-warm-200 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>

        {/* Existing Store Migration Section */}
        <div className="pt-4 border-t border-warm-200">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="hasExistingStore"
              {...form.register('hasExistingStore')}
              className="w-5 h-5 rounded border-warm-300 text-primary focus:ring-primary"
            />
            <label htmlFor="hasExistingStore" className="text-base font-medium text-foreground cursor-pointer">
              I already sell on other platforms
            </label>
          </div>

          {form.watch('hasExistingStore') && (
            <div className="ml-8 space-y-4 animate-in slide-in-from-top-2">
              <p className="text-sm text-muted-foreground mb-3">
                Select all platforms where you currently sell (we can help migrate your data later)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MARKETPLACE_PLATFORMS.map((platform) => {
                  const isSelected = form.watch('existingStorePlatforms')?.includes(platform.id);
                  return (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-warm-50'
                          : 'border-warm-200 hover:border-warm-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={platform.id}
                        checked={isSelected}
                        onChange={(e) => {
                          const current = form.getValues('existingStorePlatforms') || [];
                          if (e.target.checked) {
                            form.setValue('existingStorePlatforms', [...current, platform.id]);
                          } else {
                            form.setValue('existingStorePlatforms', current.filter((p: string) => p !== platform.id));
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="text-lg">{platform.icon}</span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-warm-700'}`}>
                        {platform.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </label>
                  );
                })}
              </div>

              {(form.watch('existingStorePlatforms')?.length || 0) > 0 && (
                <div className="flex items-center gap-3 mt-4 p-3 bg-warm-50 rounded-xl border border-warm-200">
                  <input
                    type="checkbox"
                    id="migrationInterest"
                    {...form.register('migrationInterest')}
                    className="w-5 h-5 rounded border-warm-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="migrationInterest" className="text-sm text-warm-700 cursor-pointer">
                    I&apos;m interested in migrating my products & categories to mark8ly
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
