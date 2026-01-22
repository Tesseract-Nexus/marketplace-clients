'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StorefrontThemeContent } from '@/components/settings/StorefrontThemeContent';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper with PageHeader for standalone page
function StorefrontThemePageContent() {
  return (
    <div className="min-h-screen bg-muted">
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Storefront Customization"
          description="Design your storefront appearance and customer experience"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Storefront' },
          ]}
        />
        <StorefrontThemeContent />
      </div>
    </div>
  );
}

// Default export with Suspense boundary
export default function StorefrontThemePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StorefrontThemePageContent />
    </Suspense>
  );
}
