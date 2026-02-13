'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTenant } from '@/contexts/TenantContext';

// ========================================
// Types
// ========================================

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  region: string;
}

interface AdminLanguageContextValue {
  // Current language
  currentLanguage: string;
  currentLanguageInfo: LanguageInfo | undefined;

  // Loading state
  isLoading: boolean;
  isTranslating: boolean;

  // Actions
  setLanguage: (code: string) => Promise<void>;

  // Translation function
  translate: (text: string, context?: string) => Promise<string>;
  translateBatch: (texts: string[], context?: string) => Promise<string[]>;

  // Available languages
  supportedLanguages: LanguageInfo[];

  // RTL support
  isRTL: boolean;
}

const STORAGE_KEY = 'tesseract-admin-language';
const TRANSLATION_CACHE_KEY = 'tesseract-translation-cache';

// Supported languages with flags
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  // Global
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false, region: 'Global' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, region: 'Global' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, region: 'Global' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, region: 'Global' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false, region: 'Global' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false, region: 'Global' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false, region: 'Global' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false, region: 'Global' },

  // Indian
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', rtl: false, region: 'Indian' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', rtl: false, region: 'Indian' },

  // Asian
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false, region: 'Asian' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false, region: 'Asian' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false, region: 'Asian' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', rtl: false, region: 'Asian' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', rtl: false, region: 'Asian' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', rtl: false, region: 'Asian' },

  // Middle East (RTL)
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, region: 'Middle East' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true, region: 'Middle East' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true, region: 'Middle East' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false, region: 'Middle East' },
];

// Get language info by code
export function getLanguageInfo(code: string): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// ========================================
// Translation Cache
// ========================================

interface TranslationCacheEntry {
  text: string;
  translatedText: string;
  targetLang: string;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getLocalTranslationCache(): Map<string, TranslationCacheEntry> {
  if (typeof window === 'undefined') return new Map();

  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (cached) {
      const entries = JSON.parse(cached) as [string, TranslationCacheEntry][];
      const now = Date.now();
      // Filter out expired entries
      const validEntries = entries.filter(([, entry]) => now - entry.timestamp < CACHE_TTL);
      return new Map(validEntries);
    }
  } catch (e) {
    console.error('Failed to load translation cache:', e);
  }
  return new Map();
}

function saveLocalTranslationCache(cache: Map<string, TranslationCacheEntry>) {
  if (typeof window === 'undefined') return;

  try {
    const entries = Array.from(cache.entries());
    // Limit cache size
    const limitedEntries = entries.slice(-1000);
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(limitedEntries));
  } catch (e) {
    console.error('Failed to save translation cache:', e);
  }
}

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text}`;
}

// ========================================
// Context
// ========================================

const AdminLanguageContext = createContext<AdminLanguageContextValue | undefined>(undefined);

// ========================================
// Provider
// ========================================

interface AdminLanguageProviderProps {
  children: React.ReactNode;
}

export function AdminLanguageProvider({ children }: AdminLanguageProviderProps) {
  const { user } = useUser();
  const { currentTenant } = useTenant();

  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<Map<string, TranslationCacheEntry>>(new Map());

  // Initialize from localStorage and server
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load local cache
    setTranslationCache(getLocalTranslationCache());

    // Load stored preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const isValid = SUPPORTED_LANGUAGES.some(l => l.code === stored);
      if (isValid) {
        setCurrentLanguageState(stored);
      }
    }

    // Try to fetch user preference from server
    if (user?.id && currentTenant?.id) {
      fetchUserLanguagePreference();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, currentTenant?.id]);

  // Fetch user's language preference from translation service
  const fetchUserLanguagePreference = async () => {
    try {
      const response = await fetch('/api/translations?endpoint=users/me/language', {
        headers: {
          'x-jwt-claim-tenant-id': currentTenant?.id || '',
          'x-jwt-claim-sub': user?.id || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.preferred_language || data.data?.preferredLanguage) {
          const lang = data.data.preferred_language || data.data.preferredLanguage;
          const isValid = SUPPORTED_LANGUAGES.some(l => l.code === lang);
          if (isValid) {
            setCurrentLanguageState(lang);
            localStorage.setItem(STORAGE_KEY, lang);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set language and persist
  const setLanguage = useCallback(async (code: string) => {
    const isValid = SUPPORTED_LANGUAGES.some(l => l.code === code);
    if (!isValid) return;

    setCurrentLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);

    // Update document direction for RTL
    const langInfo = getLanguageInfo(code);
    if (langInfo?.rtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = code;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = code;
    }

    // Persist to server if user is logged in
    if (user?.id && currentTenant?.id) {
      try {
        await fetch('/api/translations?endpoint=users/me/language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-jwt-claim-tenant-id': currentTenant.id,
            'x-jwt-claim-sub': user.id,
          },
          body: JSON.stringify({
            preferred_language: code,
            auto_detect_source: true,
          }),
        });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  }, [user?.id, currentTenant?.id]);

  // Translate single text
  const translate = useCallback(async (text: string, context?: string): Promise<string> => {
    // Don't translate if already in English or target is English
    if (currentLanguage === 'en' || !text || text.trim() === '') {
      return text;
    }

    if (!currentTenant?.id) {
      return text;
    }

    // Check local cache
    const cacheKey = getCacheKey(text, currentLanguage);
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.translatedText;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translations?endpoint=translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': currentTenant.id,
        },
        body: JSON.stringify({
          text,
          source_lang: 'en',
          target_lang: currentLanguage,
          context: context || 'admin-ui',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translatedText = data.translated_text || data.translatedText || text;

        // Update cache
        const newCache = new Map(translationCache);
        newCache.set(cacheKey, {
          text,
          translatedText,
          targetLang: currentLanguage,
          timestamp: Date.now(),
        });
        setTranslationCache(newCache);
        saveLocalTranslationCache(newCache);

        return translatedText;
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }

    return text;
  }, [currentLanguage, translationCache, currentTenant?.id]);

  // Translate batch of texts
  const translateBatch = useCallback(async (texts: string[], context?: string): Promise<string[]> => {
    if (currentLanguage === 'en' || texts.length === 0) {
      return texts;
    }

    if (!currentTenant?.id) {
      return texts;
    }

    // Check cache for all texts
    const results: string[] = [];
    const uncachedTexts: { index: number; text: string }[] = [];

    texts.forEach((text, index) => {
      if (!text || text.trim() === '') {
        results[index] = text;
        return;
      }

      const cacheKey = getCacheKey(text, currentLanguage);
      const cached = translationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results[index] = cached.translatedText;
      } else {
        uncachedTexts.push({ index, text });
      }
    });

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return results;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translations?endpoint=translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': currentTenant.id,
        },
        body: JSON.stringify({
          items: uncachedTexts.map((item, idx) => ({
            id: String(idx),
            text: item.text,
            source_lang: 'en',
            context: context || 'admin-ui',
          })),
          source_lang: 'en',
          target_lang: currentLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCache = new Map(translationCache);

        (data.items || []).forEach((item: { id: string; translatedText?: string; translated_text?: string; originalText?: string; original_text?: string }) => {
          const idx = parseInt(item.id, 10);
          const originalItem = uncachedTexts[idx];
          if (originalItem) {
            const translatedText = item.translatedText || item.translated_text || originalItem.text;
            results[originalItem.index] = translatedText;

            // Update cache
            const cacheKey = getCacheKey(originalItem.text, currentLanguage);
            newCache.set(cacheKey, {
              text: originalItem.text,
              translatedText,
              targetLang: currentLanguage,
              timestamp: Date.now(),
            });
          }
        });

        setTranslationCache(newCache);
        saveLocalTranslationCache(newCache);
      }
    } catch (error) {
      console.error('Batch translation failed:', error);
      // Return original texts for uncached items on error
      uncachedTexts.forEach(item => {
        if (results[item.index] === undefined) {
          results[item.index] = item.text;
        }
      });
    } finally {
      setIsTranslating(false);
    }

    return results;
  }, [currentLanguage, translationCache, currentTenant?.id]);

  const currentLanguageInfo = useMemo(() => getLanguageInfo(currentLanguage), [currentLanguage]);
  const isRTL = useMemo(() => currentLanguageInfo?.rtl || false, [currentLanguageInfo]);

  const value = useMemo<AdminLanguageContextValue>(() => ({
    currentLanguage,
    currentLanguageInfo,
    isLoading,
    isTranslating,
    setLanguage,
    translate,
    translateBatch,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL,
  }), [
    currentLanguage,
    currentLanguageInfo,
    isLoading,
    isTranslating,
    setLanguage,
    translate,
    translateBatch,
    isRTL,
  ]);

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

// ========================================
// Hooks
// ========================================

export function useAdminLanguageContext(): AdminLanguageContextValue {
  const context = useContext(AdminLanguageContext);
  if (context === undefined) {
    throw new Error('useAdminLanguageContext must be used within an AdminLanguageProvider');
  }
  return context;
}

/**
 * Convenience hook for the language selector
 */
export function useAdminLanguageSelector() {
  const {
    currentLanguage,
    currentLanguageInfo,
    setLanguage,
    supportedLanguages,
    isRTL,
  } = useAdminLanguageContext();

  return {
    selectedLanguage: currentLanguage,
    selectedLanguageInfo: currentLanguageInfo,
    setLanguage,
    languages: supportedLanguages,
    isRTL,
  };
}

/**
 * Hook for translating text
 */
export function useTranslation() {
  const {
    currentLanguage,
    translate,
    translateBatch,
    isTranslating,
  } = useAdminLanguageContext();

  return {
    language: currentLanguage,
    t: translate,
    tBatch: translateBatch,
    isTranslating,
  };
}
