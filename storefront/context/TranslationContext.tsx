'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useSyncExternalStore, useRef } from 'react';
import { useTenant } from './TenantContext';
import { useAuthStore } from '@/store/auth';
import { notifyLanguageChange } from '@/hooks/useTranslatedText';
import {
  getLanguages,
  getUserLanguagePreference,
  updateUserLanguagePreference,
  translateText,
  translateBatch,
  Language,
  UserLanguagePreference,
  TranslateRequest,
  TranslateResponse,
} from '@/lib/api/translations';

// ========================================
// Context Types
// ========================================

interface TranslationContextValue {
  // Language state
  languages: Language[];
  preferredLanguage: string;
  sourceLanguage: string;
  autoDetectSource: boolean;
  rtlEnabled: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setPreferredLanguage: (lang: string) => Promise<void>;
  setAutoDetectSource: (enabled: boolean) => Promise<void>;
  translate: (text: string, context?: string) => Promise<string>;
  translateMultiple: (
    items: Array<{ id?: string; text: string; context?: string }>
  ) => Promise<Array<{ id: string; translatedText: string }>>;

  // Helper functions
  getLanguageByCode: (code: string) => Language | undefined;
  isRTL: () => boolean;
}

// ========================================
// Context
// ========================================

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

// ========================================
// Provider Props
// ========================================

interface TranslationProviderProps {
  children: React.ReactNode;
}

// ========================================
// LocalStorage sync for preferred language
// ========================================

const STORAGE_KEY = 'preferred_language';

// Subscribers for language preference changes
let listeners: Array<() => void> = [];

function subscribeToLanguage(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getLanguageSnapshot(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) || 'en';
}

function getServerSnapshot(): string {
  return 'en'; // Server always returns English
}

function setStoredLanguage(lang: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
    // Notify all subscribers (TranslationContext)
    listeners.forEach((listener) => listener());
    // Notify useTranslatedText hook subscribers
    notifyLanguageChange();
  }
}

// ========================================
// Provider Component
// ========================================

export function TranslationProvider({ children }: TranslationProviderProps) {
  const { tenant } = useTenant();
  const { isAuthenticated } = useAuthStore();

  // Use useSyncExternalStore to properly sync with localStorage
  // This handles hydration correctly and prevents mismatch
  const storedLanguage = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerSnapshot
  );

  // Track if we've hydrated on client
  const [isHydrated, setIsHydrated] = useState(false);

  // State
  const [languages, setLanguages] = useState<Language[]>([]);
  const [preference, setPreference] = useState<UserLanguagePreference>({
    preferredLanguage: 'en', // Start with English, will be updated on hydration
    sourceLanguage: 'en',
    autoDetectSource: true,
    rtlEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync stored language to preference state after hydration
  useEffect(() => {
    setIsHydrated(true);
    setPreference((prev) => ({ ...prev, preferredLanguage: storedLanguage }));
  }, [storedLanguage]);

  // Track if this is the initial load to avoid overwriting user changes
  const hasLoadedPreferencesRef = useRef(false);

  // Load languages and user preferences from backend
  useEffect(() => {
    async function loadTranslationData() {
      if (!tenant?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Load available languages
        const availableLanguages = await getLanguages(
          tenant.id,
          tenant.storefrontId || tenant.id
        );
        setLanguages(availableLanguages);

        // Load user preference from backend only if:
        // 1. User is authenticated
        // 2. This is the initial load (to avoid race conditions when user changes language)
        if (isAuthenticated && !hasLoadedPreferencesRef.current) {
          hasLoadedPreferencesRef.current = true;
          try {
            const userPref = await getUserLanguagePreference(
              tenant.id,
              tenant.storefrontId || tenant.id
            );
            // Only update from backend if user has a saved preference there
            // The backend preference takes precedence on initial load for cross-device sync
            if (userPref.preferredLanguage && userPref.preferredLanguage !== 'en') {
              setPreference(userPref);
              setStoredLanguage(userPref.preferredLanguage);
            }
          } catch (prefError) {
            // If fetching preference fails, keep localStorage preference
            console.warn('Could not fetch user language preference:', prefError);
          }
        }
        // For non-authenticated users, localStorage preference is already synced via useSyncExternalStore
      } catch (error) {
        console.error('Failed to load translation data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTranslationData();
  }, [tenant?.id, tenant?.storefrontId, isAuthenticated]);

  // Set preferred language
  const setPreferredLanguage = useCallback(
    async (lang: string) => {
      // Update state
      setPreference((prev) => ({ ...prev, preferredLanguage: lang }));

      // Store in localStorage (this will trigger useSyncExternalStore to update)
      setStoredLanguage(lang);

      // Save to backend if authenticated
      if (isAuthenticated && tenant?.id) {
        try {
          await updateUserLanguagePreference(
            tenant.id,
            tenant.storefrontId || tenant.id,
            { preferredLanguage: lang }
          );
        } catch (error) {
          console.error('Failed to save language preference:', error);
        }
      }
    },
    [isAuthenticated, tenant?.id, tenant?.storefrontId]
  );

  // Set auto-detect source
  const setAutoDetectSource = useCallback(
    async (enabled: boolean) => {
      setPreference((prev) => ({ ...prev, autoDetectSource: enabled }));

      // Save to backend if authenticated
      if (isAuthenticated && tenant?.id) {
        try {
          await updateUserLanguagePreference(
            tenant.id,
            tenant.storefrontId || tenant.id,
            { autoDetectSource: enabled }
          );
        } catch (error) {
          console.error('Failed to save auto-detect preference:', error);
        }
      }
    },
    [isAuthenticated, tenant?.id, tenant?.storefrontId]
  );

  // Translate single text
  // Note: We read directly from storedLanguage (useSyncExternalStore) to avoid stale closure issues
  const translate = useCallback(
    async (text: string, context?: string): Promise<string> => {
      // Get the CURRENT language from localStorage directly to avoid stale closure
      const currentLang = typeof window !== 'undefined'
        ? localStorage.getItem('preferred_language') || 'en'
        : storedLanguage;
      const sourceLang = preference.sourceLanguage || 'en';

      console.log('[TranslationContext] translate called:', {
        text: text?.substring(0, 30),
        tenantId: tenant?.id,
        currentLang,
        storedLanguage,
        preferenceLang: preference.preferredLanguage,
        sourceLang,
      });

      if (!tenant?.id) {
        console.log('[TranslationContext] Skipping: no tenant');
        return text;
      }

      // Skip if target language is English (content is already in English)
      if (currentLang === 'en') {
        console.log('[TranslationContext] Skipping: target is English');
        return text;
      }

      if (currentLang === sourceLang) {
        console.log('[TranslationContext] Skipping: current === source');
        return text;
      }

      try {
        const request: TranslateRequest = {
          text,
          targetLang: currentLang,
          sourceLang: preference.autoDetectSource ? undefined : sourceLang,
          context,
        };

        console.log('[TranslationContext] Making API call:', request);

        const response = await translateText(
          tenant.id,
          tenant.storefrontId || tenant.id,
          request
        );

        console.log('[TranslationContext] API response:', response.translatedText?.substring(0, 30));
        return response.translatedText;
      } catch (error) {
        console.error('[TranslationContext] Translation failed:', error);
        return text;
      }
    },
    [tenant?.id, tenant?.storefrontId, preference, storedLanguage]
  );

  // Translate multiple texts
  const translateMultiple = useCallback(
    async (
      items: Array<{ id?: string; text: string; context?: string }>
    ): Promise<Array<{ id: string; translatedText: string }>> => {
      if (!tenant?.id || preference.preferredLanguage === preference.sourceLanguage) {
        return items.map((item, index) => ({
          id: item.id || String(index),
          translatedText: item.text,
        }));
      }

      try {
        const results = await translateBatch(
          tenant.id,
          tenant.storefrontId || tenant.id,
          items,
          preference.preferredLanguage,
          preference.autoDetectSource ? undefined : preference.sourceLanguage
        );

        return results.map((item) => ({
          id: item.id,
          translatedText: item.translatedText,
        }));
      } catch (error) {
        console.error('Batch translation failed:', error);
        return items.map((item, index) => ({
          id: item.id || String(index),
          translatedText: item.text,
        }));
      }
    },
    [tenant?.id, tenant?.storefrontId, preference]
  );

  // Get language by code
  const getLanguageByCode = useCallback(
    (code: string): Language | undefined => {
      return languages.find((lang) => lang.code === code);
    },
    [languages]
  );

  // Check if current language is RTL
  const isRTL = useCallback((): boolean => {
    const lang = getLanguageByCode(preference.preferredLanguage);
    return lang?.rtl || preference.rtlEnabled;
  }, [getLanguageByCode, preference.preferredLanguage, preference.rtlEnabled]);

  const value = useMemo<TranslationContextValue>(
    () => ({
      languages,
      preferredLanguage: preference.preferredLanguage,
      sourceLanguage: preference.sourceLanguage,
      autoDetectSource: preference.autoDetectSource,
      rtlEnabled: preference.rtlEnabled,
      isLoading,
      isHydrated,
      setPreferredLanguage,
      setAutoDetectSource,
      translate,
      translateMultiple,
      getLanguageByCode,
      isRTL,
    }),
    [
      languages,
      preference,
      isLoading,
      isHydrated,
      setPreferredLanguage,
      setAutoDetectSource,
      translate,
      translateMultiple,
      getLanguageByCode,
      isRTL,
    ]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// ========================================
// Hooks
// ========================================

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export function usePreferredLanguage(): string {
  const { preferredLanguage } = useTranslation();
  return preferredLanguage;
}

export function useAvailableLanguages(): Language[] {
  const { languages } = useTranslation();
  return languages;
}

export function useTranslate() {
  const { translate } = useTranslation();
  return translate;
}

export function useTranslateBatch() {
  const { translateMultiple } = useTranslation();
  return translateMultiple;
}

export function useIsRTL(): boolean {
  const { isRTL } = useTranslation();
  return isRTL();
}
