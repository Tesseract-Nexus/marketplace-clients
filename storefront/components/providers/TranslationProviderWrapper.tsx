'use client';

import { TranslationProvider } from '@/context/TranslationContext';

interface TranslationProviderWrapperProps {
  children: React.ReactNode;
}

export function TranslationProviderWrapper({ children }: TranslationProviderWrapperProps) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
