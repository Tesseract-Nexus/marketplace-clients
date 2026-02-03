'use client';

import { Lock, Shield, CreditCard } from 'lucide-react';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export function CheckoutTrustFooter() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 py-4 mt-6 border-t text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        <TranslatedUIText text="SSL Secure" />
      </span>
      <span className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        <TranslatedUIText text="256-bit Encryption" />
      </span>
      <span className="flex items-center gap-1 hidden sm:flex">
        <CreditCard className="h-3 w-3" />
        <TranslatedUIText text="PCI Compliant" />
      </span>
    </div>
  );
}

export default CheckoutTrustFooter;
