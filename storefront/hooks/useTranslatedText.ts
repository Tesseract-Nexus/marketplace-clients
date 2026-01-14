'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from '@/context/TranslationContext';

// ========================================
// Persistent Translation Cache
// ========================================

const CACHE_KEY = 'tesserix-translations';
const CACHE_VERSION = 'v1';
const MAX_CACHE_SIZE = 500; // Maximum number of translations to cache

interface CacheEntry {
  text: string;
  timestamp: number;
}

interface TranslationCacheData {
  version: string;
  entries: Record<string, CacheEntry>;
}

// In-memory cache backed by localStorage
let memoryCache: Map<string, string> = new Map();
let cacheInitialized = false;

function initializeCache(): void {
  if (cacheInitialized || typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const data: TranslationCacheData = JSON.parse(stored);
      if (data.version === CACHE_VERSION && data.entries) {
        Object.entries(data.entries).forEach(([key, entry]) => {
          memoryCache.set(key, entry.text);
        });
      }
    }
  } catch (error) {
    console.warn('Failed to load translation cache:', error);
  }
  cacheInitialized = true;
}

function saveCache(): void {
  if (typeof window === 'undefined') return;

  try {
    // Convert to entries and limit size (keep most recent)
    const entries: Record<string, CacheEntry> = {};
    const now = Date.now();
    let count = 0;

    // Keep only the last MAX_CACHE_SIZE entries
    const cacheArray = Array.from(memoryCache.entries());
    const startIndex = Math.max(0, cacheArray.length - MAX_CACHE_SIZE);

    for (let i = startIndex; i < cacheArray.length; i++) {
      const [key, text] = cacheArray[i];
      entries[key] = { text, timestamp: now };
      count++;
    }

    const data: TranslationCacheData = {
      version: CACHE_VERSION,
      entries,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save translation cache:', error);
  }
}

// Debounce save to avoid too many writes
let saveTimeout: NodeJS.Timeout | null = null;
function debouncedSaveCache(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCache, 1000);
}

function getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
  return `${sourceLang || 'auto'}:${targetLang}:${text}`;
}

function getCachedTranslation(key: string): string | undefined {
  initializeCache();
  return memoryCache.get(key);
}

function setCachedTranslation(key: string, value: string): void {
  initializeCache();
  memoryCache.set(key, value);
  debouncedSaveCache();
}

// ========================================
// Hook Types
// ========================================

interface UseTranslatedTextOptions {
  /** Context hint for better translation (e.g., "product name", "category") */
  context?: string;
  /** Source language code (auto-detect if not provided) */
  sourceLang?: string;
  /** Skip translation if true */
  skip?: boolean;
}

interface UseTranslatedTextResult {
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
}

// ========================================
// Main Hook
// ========================================

/**
 * Hook to automatically translate text to the user's preferred language
 * Uses persistent cache to prevent flash of untranslated content
 */
// Subscribe to localStorage changes for language
const languageStorageListeners = new Set<() => void>();

function subscribeToLanguageStorage(callback: () => void) {
  languageStorageListeners.add(callback);
  return () => languageStorageListeners.delete(callback);
}

function getLanguageFromStorage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('preferred_language') || 'en';
}

// Notify listeners when language changes (call this from LanguageSelector or TranslationContext)
export function notifyLanguageChange() {
  languageStorageListeners.forEach((listener) => listener());
}

export function useTranslatedText(
  text: string | undefined | null,
  options: UseTranslatedTextOptions = {}
): UseTranslatedTextResult {
  const { preferredLanguage: contextPreferredLanguage, sourceLanguage, autoDetectSource, translate, isHydrated } = useTranslation();
  const { context, sourceLang, skip = false } = options;

  // Use useSyncExternalStore to get reactive localStorage updates
  const preferredLanguage = useSyncExternalStore(
    subscribeToLanguageStorage,
    getLanguageFromStorage,
    () => 'en' // Server snapshot
  );

  // Calculate cache key
  const effectiveSourceLang = sourceLang || (autoDetectSource ? undefined : sourceLanguage);
  const cacheKey = text ? getCacheKey(text, preferredLanguage, effectiveSourceLang) : '';

  // Get initial value from cache (synchronous - prevents flash)
  const initialValue = useMemo(() => {
    if (!text) return '';

    // Before hydration, always show original text to prevent hydration mismatch
    if (!isHydrated) return text;

    if (skip || preferredLanguage === 'en') return text;
    if (effectiveSourceLang && effectiveSourceLang === preferredLanguage) return text;

    // Check cache first - this is synchronous and prevents flash
    const cached = getCachedTranslation(cacheKey);
    if (cached) return cached;

    return text; // Fallback to original while loading
  }, [text, cacheKey, preferredLanguage, effectiveSourceLang, skip, isHydrated]);

  const [translatedText, setTranslatedText] = useState<string>(initialValue);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update state when initial value changes (e.g., language switch, hydration complete)
  useEffect(() => {
    setTranslatedText(initialValue);
  }, [initialValue]);

  useEffect(() => {
    // Debug logging
    console.log('[Translation] Effect running:', { text: text?.substring(0, 30), preferredLanguage, isHydrated, skip, effectiveSourceLang });

    // Don't translate until hydrated
    if (!isHydrated) {
      console.log('[Translation] Skipping: not hydrated');
      return;
    }

    // Reset if text is empty
    if (!text) {
      setTranslatedText('');
      return;
    }

    // Skip translation conditions
    if (skip || preferredLanguage === 'en') {
      console.log('[Translation] Skipping: English or skip flag', { skip, preferredLanguage });
      setTranslatedText(text);
      return;
    }

    // Check if source and target are the same
    if (effectiveSourceLang && effectiveSourceLang === preferredLanguage) {
      console.log('[Translation] Skipping: source === target');
      setTranslatedText(text);
      return;
    }

    // Check cache first (already done in initialValue, but recheck in case cache was updated)
    const cached = getCachedTranslation(cacheKey);
    if (cached) {
      console.log('[Translation] Using cached:', cached.substring(0, 30));
      setTranslatedText(cached);
      return;
    }

    // Translate
    const doTranslate = async () => {
      console.log('[Translation] Calling translate API for:', text?.substring(0, 30));
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsTranslating(true);
      setError(null);

      try {
        const result = await translate(text, context);
        console.log('[Translation] Got result:', result?.substring(0, 30));
        setCachedTranslation(cacheKey, result);
        setTranslatedText(result);
      } catch (err) {
        console.error('[Translation] Error:', err);
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
          setTranslatedText(text); // Fallback to original
        }
      } finally {
        setIsTranslating(false);
      }
    };

    // Small debounce to batch rapid updates
    const timeoutId = setTimeout(doTranslate, 50);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [text, preferredLanguage, effectiveSourceLang, skip, context, translate, cacheKey, isHydrated]);

  return { translatedText, isTranslating, error };
}

// ========================================
// Batch Translation Hook
// ========================================

/**
 * Hook to translate multiple texts at once (more efficient for lists)
 */
export function useTranslatedTexts(
  texts: Array<{ id: string; text: string; context?: string }>,
  options: Omit<UseTranslatedTextOptions, 'context'> = {}
): {
  translations: Map<string, string>;
  isTranslating: boolean;
  error: string | null;
} {
  const { preferredLanguage, sourceLanguage, autoDetectSource, translateMultiple, isHydrated } = useTranslation();
  const { sourceLang, skip = false } = options;

  const effectiveSourceLang = sourceLang || (autoDetectSource ? undefined : sourceLanguage);

  // Get initial values from cache (synchronous)
  const initialMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!texts.length) return map;

    texts.forEach((item) => {
      // Before hydration, always show original text
      if (!isHydrated || skip || preferredLanguage === 'en') {
        map.set(item.id, item.text);
      } else {
        const cacheKey = getCacheKey(item.text, preferredLanguage, effectiveSourceLang);
        const cached = getCachedTranslation(cacheKey);
        map.set(item.id, cached || item.text);
      }
    });

    return map;
  }, [texts, preferredLanguage, effectiveSourceLang, skip, isHydrated]);

  const [translations, setTranslations] = useState<Map<string, string>>(initialMap);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update when initial map changes
  useEffect(() => {
    setTranslations(initialMap);
  }, [initialMap]);

  useEffect(() => {
    // Don't translate until hydrated
    if (!isHydrated || !texts.length || skip || preferredLanguage === 'en') {
      return;
    }

    // Find texts that need translation (not in cache)
    const needsTranslation: Array<{ id: string; text: string; context?: string }> = [];

    texts.forEach((item) => {
      const cacheKey = getCacheKey(item.text, preferredLanguage, effectiveSourceLang);
      const cached = getCachedTranslation(cacheKey);
      if (!cached) {
        needsTranslation.push(item);
      }
    });

    // If everything is cached, we're done
    if (needsTranslation.length === 0) {
      return;
    }

    const doTranslate = async () => {
      setIsTranslating(true);
      setError(null);

      try {
        const results = await translateMultiple(needsTranslation);

        // Update cache and build final map
        const finalMap = new Map(translations);
        results.forEach((result) => {
          const originalItem = needsTranslation.find((t) => t.id === result.id);
          if (originalItem) {
            const cacheKey = getCacheKey(originalItem.text, preferredLanguage, effectiveSourceLang);
            setCachedTranslation(cacheKey, result.translatedText);
          }
          finalMap.set(result.id, result.translatedText);
        });

        setTranslations(finalMap);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsTranslating(false);
      }
    };

    const timeoutId = setTimeout(doTranslate, 50);
    return () => clearTimeout(timeoutId);
  }, [texts, preferredLanguage, effectiveSourceLang, skip, translateMultiple, translations, isHydrated]);

  return { translations, isTranslating, error };
}

// ========================================
// Cache Management
// ========================================

/**
 * Clear the translation cache (useful when language changes)
 * Only clears in-memory cache, localStorage cache is preserved
 * for faster loading on next visit
 */
export function clearTranslationCache(): void {
  // Don't clear localStorage - keep it for faster initial load
  // Just clear in-memory for current session to force re-fetch
  memoryCache.clear();
  cacheInitialized = false;
}

/**
 * Completely clear all translation caches including localStorage
 */
export function clearAllTranslationCaches(): void {
  memoryCache.clear();
  cacheInitialized = false;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}
