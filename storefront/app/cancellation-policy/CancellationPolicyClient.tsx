'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Scale } from 'lucide-react';

interface CancellationPolicyClientProps {
  policyText: string | null;
}

export function CancellationPolicyClient({ policyText }: CancellationPolicyClientProps) {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Cancellation Policy' },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-default)]">
      {/* Hero Section - Same as ContentPageClient policy pages */}
      <header className="relative bg-background border-b border-[var(--border-default)]">
        <div className="container-tenant py-8 md:py-12 lg:py-16">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-8 md:mt-12 max-w-4xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--surface-muted)] mb-6">
              <Scale className="w-6 h-6 text-tenant-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
              Cancellation Policy
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Our cancellation terms and conditions for orders placed on this store.
            </p>
          </div>
        </div>
      </header>

      {/* Content - Policy card layout matching ContentPageClient */}
      <main className="container-tenant py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl">
          <div className="bg-background rounded-lg border border-[var(--border-default)] shadow-sm p-8 md:p-12">
            {policyText ? (
              <article className="prose-editorial whitespace-pre-line">
                {policyText}
              </article>
            ) : (
              <p className="text-muted-foreground">
                No cancellation policy has been configured yet. Please contact the store for details.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
