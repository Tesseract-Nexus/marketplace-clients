'use client';

import { MapPin, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { LocationStepProps } from './types';
import { inputClass, inputErrorClass, labelClass } from './constants';
import { SearchableSelect } from '../SearchableSelect';
import { AddressAutocomplete } from '../AddressAutocomplete';

export function LocationStep({ form, onSubmit, isLoading, setCurrentSection, countries, states, isLoadingStates, loadStates, onAddressSelect }: LocationStepProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Where are you based?</h1>
            <p className="text-muted-foreground">This helps with taxes and shipping</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className={labelClass}>Search Address</label>
          <AddressAutocomplete
            onAddressSelect={onAddressSelect}
            onManualEntryToggle={() => {}}
            placeholder="Start typing your address..."
          />
          <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
            Search for any address worldwide. The country and other fields will be auto-filled.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Country *</label>
            <SearchableSelect
              options={countries.map(c => ({
                value: c.id,
                label: c.name,
                icon: <span className="text-base">{c.flag_emoji}</span>,
                searchTerms: [c.name, c.id],
              }))}
              value={form.watch('country')}
              onChange={(value) => {
                form.setValue('country', value);
                form.setValue('state', '');
                loadStates(value);
              }}
              placeholder="Select country"
              searchPlaceholder="Search countries..."
              error={!!form.formState.errors.country}
            />
            {form.formState.errors.country && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.country.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>State/Province *</label>
            <SearchableSelect
              options={states.map(s => ({
                value: s.id,
                label: s.name,
                searchTerms: [s.name, s.id],
              }))}
              value={form.watch('state')}
              onChange={(value) => form.setValue('state', value)}
              placeholder={isLoadingStates ? 'Loading...' : 'Select state'}
              searchPlaceholder="Search states..."
              disabled={isLoadingStates || !form.watch('country')}
              loading={isLoadingStates}
              error={!!form.formState.errors.state}
              emptyMessage={form.watch('country') ? 'No states found' : 'Select a country first'}
            />
            {form.formState.errors.state && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.state.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City *</label>
            <input {...form.register('city')} placeholder="City" className={form.formState.errors.city ? inputErrorClass : inputClass} />
            {form.formState.errors.city && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.city.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Postal Code *</label>
            <input {...form.register('postalCode')} placeholder="12345" className={form.formState.errors.postalCode ? inputErrorClass : inputClass} />
            {form.formState.errors.postalCode && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.postalCode.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Street Address *</label>
          <input {...form.register('streetAddress')} placeholder="123 Main Street" className={form.formState.errors.streetAddress ? inputErrorClass : inputClass} />
          {form.formState.errors.streetAddress && (
            <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.streetAddress.message}</p>
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-4 bg-muted rounded-lg border border-border hover:border-border-strong transition-colors">
          <input
            type="checkbox"
            checked={form.watch('billingAddressSameAsBusiness') ?? true}
            onChange={(e) => form.setValue('billingAddressSameAsBusiness', e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground-secondary">Billing address is the same as business address</span>
        </label>
      </div>

      <div className="pt-6 flex gap-4">
        <button
          type="button"
          onClick={() => setCurrentSection(1)}
          className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /></>}
        </button>
      </div>
    </form>
  );
}
