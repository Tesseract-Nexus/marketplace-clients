'use client';

import { User, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { ContactDetailsStepProps } from './types';
import { JOB_TITLES, inputClass, inputErrorClass, labelClass } from './constants';
import { SearchableSelect } from '../SearchableSelect';

export function ContactDetailsStep({ form, onSubmit, isLoading, setCurrentSection, countries }: ContactDetailsStepProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
            <User className="w-6 h-6 text-sage-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Now, a bit about you</h1>
            <p className="text-muted-foreground">So we know who we&apos;re working with</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>First Name *</label>
            <input
              id="firstName"
              {...form.register('firstName')}
              placeholder="John"
              className={form.formState.errors.firstName ? inputErrorClass : inputClass}
            />
            {form.formState.errors.firstName && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Last Name *</label>
            <input
              id="lastName"
              {...form.register('lastName')}
              placeholder="Doe"
              className={form.formState.errors.lastName ? inputErrorClass : inputClass}
            />
            {form.formState.errors.lastName && (
              <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Email Address *</label>
          <input
            id="email"
            {...form.register('email')}
            type="email"
            placeholder="john@example.com"
            className={form.formState.errors.email ? inputErrorClass : inputClass}
          />
          {form.formState.errors.email && (
            <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="phoneCountryCode" className={labelClass}>Country</label>
            <SearchableSelect
              id="phoneCountryCode"
              options={countries.map(c => ({
                value: c.id,
                label: c.calling_code || c.id,
                icon: <span className="text-base">{c.flag_emoji}</span>,
                description: c.name,
                searchTerms: [c.name, c.calling_code].filter((s): s is string => !!s),
              }))}
              value={form.watch('phoneCountryCode')}
              onChange={(value) => form.setValue('phoneCountryCode', value)}
              placeholder="Code"
              searchPlaceholder="Search country..."
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="phoneNumber" className={labelClass}>Phone Number</label>
            <input
              id="phoneNumber"
              {...form.register('phoneNumber')}
              type="tel"
              placeholder="(555) 123-4567"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="jobTitle" className={labelClass}>Your Role *</label>
          <SearchableSelect
            id="jobTitle"
            options={JOB_TITLES.map(title => ({
              value: title,
              label: title,
            }))}
            value={form.watch('jobTitle')}
            onChange={(value) => form.setValue('jobTitle', value)}
            placeholder="Select your role"
            searchPlaceholder="Search roles..."
            error={!!form.formState.errors.jobTitle}
            enableSearch={false}
          />
          {form.formState.errors.jobTitle && (
            <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{form.formState.errors.jobTitle.message}</p>
          )}
        </div>
      </div>

      <div className="pt-6 flex gap-4">
        <button
          type="button"
          onClick={() => setCurrentSection(0)}
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
