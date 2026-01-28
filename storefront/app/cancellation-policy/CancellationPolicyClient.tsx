'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Scale, Clock, Ban, CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CancellationPolicy, CancellationWindow } from '@/lib/api/cancellation';

interface CancellationPolicyClientProps {
  policy: CancellationPolicy | null;
}

function formatFee(window: CancellationWindow): string {
  if (window.feeValue === 0) return 'Free';
  return window.feeType === 'percentage' ? `${window.feeValue}%` : `$${window.feeValue.toFixed(2)}`;
}

function formatDefaultFee(policy: CancellationPolicy): string {
  return policy.defaultFeeType === 'percentage'
    ? `${policy.defaultFeeValue}%`
    : `$${policy.defaultFeeValue.toFixed(2)}`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CancellationPolicyClient({ policy }: CancellationPolicyClientProps) {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Cancellation Policy' },
  ];

  const sortedWindows = policy
    ? [...policy.windows].sort((a, b) => a.maxHoursAfterOrder - b.maxHoursAfterOrder)
    : [];

  const refundMethodLabel =
    policy?.refundMethod === 'original_payment'
      ? 'Refunds are issued to the original payment method.'
      : policy?.refundMethod === 'store_credit'
        ? 'Refunds are issued as store credit.'
        : 'Refunds can be issued to the original payment method or as store credit.';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero Section */}
      <header className="relative bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 lg:py-16">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-8 md:mt-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 mb-6">
              <Scale className="w-6 h-6 text-tenant-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
              Cancellation Policy
            </h1>

            <p className="mt-6 text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
              Our cancellation terms and conditions for orders placed on this store.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {policy ? (
        <div className="py-12 md:py-16 lg:py-20">
          {/* Policy Summary */}
          {policy.policyText && (
            <section className="max-w-4xl mx-auto px-6 mb-16 md:mb-20">
              <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 leading-relaxed text-center">
                {policy.policyText.split('\n')[0]}
              </p>
            </section>
          )}

          {/* Cancellation Windows Grid */}
          {sortedWindows.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 mb-16 md:mb-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-3 font-heading">
                  Cancellation Windows
                </h2>
                <p className="text-stone-600 dark:text-stone-400">
                  Fees depend on when you cancel relative to your order placement time.
                </p>
              </div>

              <div className={`grid gap-6 ${sortedWindows.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : sortedWindows.length === 2 ? 'md:grid-cols-2' : ''}`}>
                {sortedWindows.map((window) => (
                  <div
                    key={window.id}
                    className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm hover:border-tenant-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-tenant-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-heading">
                        {window.name}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-500 dark:text-stone-500">Time Limit</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          Within {window.maxHoursAfterOrder} hours
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-500 dark:text-stone-500">Fee</span>
                        <span className={`font-bold text-lg ${window.feeValue === 0 ? 'text-green-600 dark:text-green-400' : 'text-tenant-primary'}`}>
                          {formatFee(window)}
                        </span>
                      </div>
                      {window.description && (
                        <p className="text-sm text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                          {window.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Default Fee Card */}
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] font-heading">
                      After All Windows
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-500 dark:text-stone-500">Time Limit</span>
                      <span className="font-medium text-[var(--text-primary)]">After {sortedWindows[sortedWindows.length - 1]?.maxHoursAfterOrder || 0}+ hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-500 dark:text-stone-500">Fee</span>
                      <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                        {formatDefaultFee(policy)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                      Standard cancellation fee applies after all windows have expired.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Non-Cancellable Statuses & Refund Method */}
          <section className="max-w-6xl mx-auto px-6 mb-16 md:mb-20">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Non-Cancellable Statuses */}
              {policy.nonCancellableStatuses.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">
                      Non-Cancellable Orders
                    </h2>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 mb-4">
                    Orders with the following statuses cannot be cancelled:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {policy.nonCancellableStatuses.map((status) => (
                      <span
                        key={status}
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium"
                      >
                        {formatStatus(status)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Method */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-tenant-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">
                    Refund Information
                  </h2>
                </div>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  {refundMethodLabel}
                </p>
                {policy.requireReason && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-stone-500 dark:text-stone-500">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>A cancellation reason is required when submitting your request.</span>
                  </div>
                )}
                {policy.allowPartialCancellation && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-stone-500 dark:text-stone-500">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Partial cancellation of individual items is supported.</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Full Policy Text */}
          {policy.policyText && policy.policyText.split('\n').length > 1 && (
            <section className="max-w-4xl mx-auto px-6">
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 md:p-10 shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 font-heading">
                  Full Policy Details
                </h2>
                <div className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                  {policy.policyText}
                </div>
              </div>
            </section>
          )}
        </div>
      ) : (
        <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 lg:py-20">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-8 md:p-12">
            <p className="text-stone-500 dark:text-stone-500">
              No cancellation policy has been configured yet. Please contact the store for details.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
