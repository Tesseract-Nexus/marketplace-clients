'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Languages, Search, Globe } from 'lucide-react';
import { useAdminLanguageSelector, LanguageInfo } from '@/contexts/AdminLanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Group languages by region for organized display
const REGION_ORDER = ['Global', 'Indian', 'Asian', 'Middle East'];

interface AdminLanguageSelectorProps {
  compact?: boolean;
}

export function AdminLanguageSelector({ compact = false }: AdminLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedLanguage,
    selectedLanguageInfo,
    setLanguage,
    languages,
    isRTL,
  } = useAdminLanguageSelector();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opening
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    return languages.filter(lang =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [languages, searchQuery]);

  // Group filtered languages by region
  const groupedLanguages = useMemo(() => {
    const grouped: Record<string, LanguageInfo[]> = {};
    filteredLanguages.forEach(lang => {
      if (!grouped[lang.region]) {
        grouped[lang.region] = [];
      }
      grouped[lang.region].push(lang);
    });
    return grouped;
  }, [filteredLanguages]);

  const handleLanguageSelect = async (code: string) => {
    await setLanguage(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={compact ? "ghost" : "default"}
        size={compact ? "sm" : "default"}
        className={cn(
          "flex items-center gap-1.5 font-medium transition-all duration-200",
          compact
            ? "h-7 px-2 py-1 text-xs rounded-md"
            : "px-3 py-1.5 text-sm rounded-lg border hover:shadow-md",
          selectedLanguage !== 'en'
            ? compact
              ? "bg-info-muted text-info hover:bg-info/20 hover:text-info"
              : "bg-primary text-primary-foreground border-transparent hover:bg-primary/90"
            : compact
              ? "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              : "bg-background hover:bg-muted text-foreground border-border"
        )}
      >
        {selectedLanguageInfo?.flag && (
          <span className={compact ? "text-sm" : "text-base"}>{selectedLanguageInfo.flag}</span>
        )}
        <span className="font-semibold uppercase">{selectedLanguage}</span>
        {isRTL && !compact && (
          <span className="text-[10px] opacity-75">RTL</span>
        )}
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute w-80 bg-card rounded-xl shadow-xl border border-border z-[9999] animate-in fade-in duration-200 flex flex-col",
          "top-full mt-2 right-0 slide-in-from-top-2",
          compact && "max-h-[min(420px,calc(100vh-120px))]"
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Display Language</h3>
              </div>
              {selectedLanguage !== 'en' && (
                <div className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                  Translating
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              View admin panel in your preferred language
            </p>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full h-10 pl-10 pr-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          {/* Language Options */}
          <div className="flex-1 min-h-0 overflow-y-auto py-1">
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No languages found
              </div>
            ) : (
              REGION_ORDER.map(region => {
                const regionLanguages = groupedLanguages[region];
                if (!regionLanguages || regionLanguages.length === 0) return null;

                return (
                  <div key={region}>
                    {/* Region Header */}
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-y border-border">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3" />
                        {region}
                      </div>
                    </div>

                    {/* Languages in this region */}
                    {regionLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                          selectedLanguage === lang.code
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{lang.flag}</span>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{lang.name}</span>
                              {lang.rtl && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-warning-muted text-warning-foreground rounded font-medium">
                                  RTL
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                          </div>
                        </div>
                        {selectedLanguage === lang.code && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-border bg-muted">
            <p className="text-xs text-muted-foreground">
              {selectedLanguage !== 'en'
                ? `Translating UI text to ${selectedLanguageInfo?.name || selectedLanguage}`
                : 'Showing content in English (default)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version showing only flag and code
export function AdminLanguageSelectorCompact() {
  const { selectedLanguage, selectedLanguageInfo, isRTL } = useAdminLanguageSelector();

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
        selectedLanguage !== 'en'
          ? "bg-primary/20 text-primary"
          : "bg-muted text-muted-foreground"
      )}
      title={`Display language: ${selectedLanguageInfo?.name || selectedLanguage}`}
    >
      {selectedLanguageInfo?.flag && (
        <span className="text-sm">{selectedLanguageInfo.flag}</span>
      )}
      <span className="uppercase">{selectedLanguage}</span>
      {isRTL && <span className="opacity-75">RTL</span>}
    </div>
  );
}
