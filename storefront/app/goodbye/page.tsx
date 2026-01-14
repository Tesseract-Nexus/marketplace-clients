'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Clock, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export default function GoodbyePage() {
  const { tenant, settings } = useTenant();
  const [mounted, setMounted] = useState(false);

  // Calculate purge date (90 days from now)
  const purgeDate = new Date();
  purgeDate.setDate(purgeDate.getDate() + 90);
  const formattedPurgeDate = purgeDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const storeName = tenant?.name || tenant?.slug || 'the store';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Goodbye Icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: `${settings.primaryColor}20` }}
          >
            <Heart className="h-10 w-10 text-tenant-primary" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            <TranslatedUIText text="We're sorry to see you go" />
          </h1>
          <p className="text-lg text-muted-foreground">
            <TranslatedUIText text="Your account has been deactivated. Thank you for being part of" />{' '}
            <span className="font-semibold text-foreground">{storeName}</span>.
          </p>
        </div>

        {/* Retention Info */}
        <div className="bg-card rounded-xl border p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-tenant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                <TranslatedUIText text="Your data is safe for 90 days" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <TranslatedUIText text="We'll keep your data until" />{' '}
                <span className="font-medium text-foreground">{formattedPurgeDate}</span>.{' '}
                <TranslatedUIText text="After that, it will be permanently deleted." />
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-tenant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                <TranslatedUIText text="Changed your mind?" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <TranslatedUIText text="You can reactivate your account anytime within 90 days by simply logging in again." />
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-tenant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                <TranslatedUIText text="Check your email" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <TranslatedUIText text="We've sent you a confirmation email with more details about the deactivation." />
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button className="btn-tenant-primary w-full sm:w-auto">
              <TranslatedUIText text="Reactivate My Account" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <TranslatedUIText text="Continue Shopping" />
            </Button>
          </Link>
        </div>

        {/* Footer Message */}
        <p className="text-sm text-muted-foreground">
          <TranslatedUIText text="We hope to see you again soon!" />
        </p>
      </div>
    </div>
  );
}
