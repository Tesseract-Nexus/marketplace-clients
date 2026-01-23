'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Store } from 'lucide-react';

/**
 * Tenant Not Found Page
 *
 * Shown when a user tries to access a subdomain for a tenant that doesn't exist.
 * This is a security feature to prevent access via arbitrary subdomains
 * when using wildcard DNS/SSL certificates.
 */
export default function TenantNotFoundPage() {
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null);

  useEffect(() => {
    // Extract the attempted tenant slug from the subdomain
    const hostname = window.location.hostname;
    const slugMatch = hostname.match(/^(.+)-admin\.tesserix\.app$/);
    setRequestedSlug(slugMatch ? slugMatch[1] : null);
  }, []);

  const handleCreateStore = () => {
    window.location.href = 'https://dev-onboarding.tesserix.app';
  };

  const handleGoToMain = () => {
    window.location.href = 'https://dev-admin.tesserix.app';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Store Not Found
          </h1>

          {/* Description */}
          {requestedSlug && (
            <p className="text-muted-foreground mb-2">
              The store <span className="font-semibold text-foreground">&quot;{requestedSlug}&quot;</span> doesn&apos;t exist.
            </p>
          )}
          <p className="text-muted-foreground text-sm mb-8">
            This URL is not associated with any registered store on our platform.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCreateStore}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Store className="h-5 w-5" />
              Create a New Store
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleGoToMain}
              className="w-full px-6 py-3 bg-muted hover:bg-muted text-foreground font-medium rounded-md transition-colors"
            >
              Go to Main Dashboard
            </button>
          </div>

          {/* Help text */}
          <p className="mt-6 text-xs text-muted-foreground">
            If you believe this is an error, please contact support.
          </p>
        </div>

        {/* Security notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            For security reasons, only registered stores can be accessed.
          </p>
        </div>
      </div>
    </div>
  );
}
