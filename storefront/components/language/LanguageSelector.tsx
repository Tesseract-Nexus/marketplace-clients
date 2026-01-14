'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2, Globe } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { clearTranslationCache } from '@/hooks/useTranslatedText';
import { Language } from '@/lib/api/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

// Flag emoji mapping for all 30 supported languages
const languageFlags: Record<string, string> = {
  // Global languages
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇧🇷',
  nl: '🇳🇱',
  ru: '🇷🇺',
  // Asian languages
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
  // Indian languages
  hi: '🇮🇳',
  ta: '🇮🇳',
  te: '🇮🇳',
  bn: '🇧🇩',
  mr: '🇮🇳',
  gu: '🇮🇳',
  kn: '🇮🇳',
  ml: '🇮🇳',
  pa: '🇮🇳',
  or: '🇮🇳', // Odia
  // Southeast Asian languages
  th: '🇹🇭',
  vi: '🇻🇳',
  id: '🇮🇩',
  ms: '🇲🇾',
  tl: '🇵🇭', // Filipino
  // Middle Eastern languages
  ar: '🇸🇦',
  fa: '🇮🇷', // Persian
  he: '🇮🇱', // Hebrew
  tr: '🇹🇷',
  // Polish (if needed)
  pl: '🇵🇱',
};

export function LanguageSelector({ variant = 'compact', className = '' }: LanguageSelectorProps) {
  const {
    languages,
    preferredLanguage,
    setPreferredLanguage,
    isLoading,
    getLanguageByCode,
  } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = getLanguageByCode(preferredLanguage);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = async (language: Language) => {
    if (language.code === preferredLanguage) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      // Clear the translation cache before changing language
      clearTranslationCache();
      await setPreferredLanguage(language.code);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const getFlag = (code: string): string => {
    return languageFlags[code] || '🌐';
  };

  // Don't show if no languages available or only one language
  if (languages.length <= 1) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`} data-testid="language-selector">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-testid="language-selector-button"
      >
        {(isLoading || isChanging) ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <Globe className="h-4 w-4 text-gray-500" />
        )}
        {variant === 'full' ? (
          <>
            <span className="text-base">{getFlag(preferredLanguage)}</span>
            <span>{currentLanguage?.nativeName || preferredLanguage.toUpperCase()}</span>
          </>
        ) : (
          <>
            <span className="text-base">{getFlag(preferredLanguage)}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {preferredLanguage.toUpperCase()}
            </span>
          </>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="listbox"
          aria-label="Select display language"
        >
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
            Translate content to:
          </div>
          <div className="max-h-64 overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleSelect(language)}
                disabled={isChanging}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  language.code === preferredLanguage
                    ? 'bg-primary/5 text-primary'
                    : 'text-gray-700 dark:text-gray-300'
                } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="option"
                aria-selected={language.code === preferredLanguage}
              >
                <span className="text-lg">{getFlag(language.code)}</span>
                <div className="flex-1">
                  <div className="font-medium">
                    {language.nativeName}
                    {language.code === 'en' && (
                      <span className="ml-1.5 text-xs text-gray-400">(Default)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language.name}
                  </div>
                </div>
                {language.code === preferredLanguage && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
