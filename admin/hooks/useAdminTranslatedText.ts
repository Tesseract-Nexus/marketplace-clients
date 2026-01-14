'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/contexts/AdminLanguageContext';

export interface UseAdminTranslatedTextOptions {
  context?: string;
  skip?: boolean;
}

export interface UseAdminTranslatedTextResult {
  translatedText: string;
  isTranslating: boolean;
  error: Error | null;
}

/**
 * Hook for translating text in the admin panel
 * Uses the AdminLanguageContext's translate function
 */
export function useAdminTranslatedText(
  text: string | undefined | null,
  options: UseAdminTranslatedTextOptions = {}
): UseAdminTranslatedTextResult {
  const { context, skip = false } = options;
  const { language, t, isTranslating: contextIsTranslating } = useTranslation();

  const [translatedText, setTranslatedText] = useState<string>(text || '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip translation if no text, skip is true, or language is English
    if (!text || skip || language === 'en') {
      setTranslatedText(text || '');
      return;
    }

    let cancelled = false;

    const translateText = async () => {
      setIsTranslating(true);
      setError(null);

      try {
        const result = await t(text, context);
        if (!cancelled) {
          setTranslatedText(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Translation failed'));
          setTranslatedText(text); // Fallback to original
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    translateText();

    return () => {
      cancelled = true;
    };
  }, [text, language, context, skip, t]);

  return {
    translatedText,
    isTranslating: isTranslating || contextIsTranslating,
    error,
  };
}

/**
 * Hook for batch translating multiple texts
 */
export function useAdminTranslatedTexts(
  texts: Array<{ id: string; text: string; context?: string }>,
  options: { skip?: boolean } = {}
): {
  translations: Record<string, string>;
  isTranslating: boolean;
  error: Error | null;
} {
  const { skip = false } = options;
  const { language, tBatch, isTranslating: contextIsTranslating } = useTranslation();

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize with original texts
    const initial: Record<string, string> = {};
    texts.forEach(item => {
      initial[item.id] = item.text;
    });

    // Skip if no texts, skip is true, or language is English
    if (texts.length === 0 || skip || language === 'en') {
      setTranslations(initial);
      return;
    }

    let cancelled = false;

    const translateTexts = async () => {
      setIsTranslating(true);
      setError(null);

      try {
        const textsToTranslate = texts.map(item => item.text);
        const results = await tBatch(textsToTranslate, 'admin-ui');

        if (!cancelled) {
          const newTranslations: Record<string, string> = {};
          texts.forEach((item, index) => {
            newTranslations[item.id] = results[index] || item.text;
          });
          setTranslations(newTranslations);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Batch translation failed'));
          setTranslations(initial); // Fallback to originals
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    translateTexts();

    return () => {
      cancelled = true;
    };
  }, [texts, language, skip, tBatch]);

  return {
    translations,
    isTranslating: isTranslating || contextIsTranslating,
    error,
  };
}

export default useAdminTranslatedText;
