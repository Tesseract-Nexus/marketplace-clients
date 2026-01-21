'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, TrendingUp, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface SearchSuggestionsProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

const STORAGE_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 5;

// Popular/trending searches - could be fetched from API
const TRENDING_SEARCHES = [
  'Headphones',
  'Laptop',
  'Watch',
  'Phone case',
  'Backpack',
];

export function SearchSuggestions({
  initialQuery = '',
  onSearch,
  className,
  autoFocus = false,
  placeholder = 'Search products...',
}: SearchSuggestionsProps) {
  const router = useRouter();
  const getNavPath = useNavPath();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save search to recent searches
  const saveSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== searchQuery.toLowerCase()
      );
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  // Remove a recent search
  const removeRecentSearch = useCallback((searchQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== searchQuery);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Handle search submission
  const handleSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      saveSearch(trimmed);
      setIsOpen(false);
      setHighlightedIndex(-1);

      if (onSearch) {
        onSearch(trimmed);
      } else {
        router.push(getNavPath(`/search?q=${encodeURIComponent(trimmed)}`));
      }
    },
    [onSearch, router, getNavPath, saveSearch]
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Get filtered suggestions based on query
  const getSuggestions = useCallback(() => {
    const suggestions: Array<{ type: 'recent' | 'trending'; text: string }> = [];
    const lowerQuery = query.toLowerCase();

    // Filter recent searches
    const filteredRecent = recentSearches.filter((s) =>
      s.toLowerCase().includes(lowerQuery)
    );
    filteredRecent.forEach((text) => suggestions.push({ type: 'recent', text }));

    // Filter trending searches (exclude those already in recent)
    const filteredTrending = TRENDING_SEARCHES.filter(
      (s) =>
        s.toLowerCase().includes(lowerQuery) &&
        !recentSearches.some((r) => r.toLowerCase() === s.toLowerCase())
    );
    filteredTrending.forEach((text) =>
      suggestions.push({ type: 'trending', text })
    );

    return suggestions.slice(0, 8);
  }, [query, recentSearches]);

  const suggestions = getSuggestions();

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSearch(suggestions[highlightedIndex].text);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className="pl-12 pr-12 h-14 text-lg rounded-full border-2 focus:border-tenant-primary"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg overflow-hidden z-50"
          >
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && !query && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <TranslatedUIText text="Recent Searches" />
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <TranslatedUIText text="Clear all" />
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={`recent-${search}`}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onClick={() => handleSearch(search)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors',
                      highlightedIndex === index
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="flex-1 text-left">{search}</span>
                    <button
                      onClick={(e) => removeRecentSearch(search, e)}
                      className="p-1 hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${search} from recent searches`}
                    >
                      <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    </button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            {/* Filtered Suggestions */}
            {query && suggestions.length > 0 && (
              <div className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.text}`}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onClick={() => handleSearch(suggestion.text)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors group',
                      highlightedIndex === index
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    {suggestion.type === 'recent' ? (
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-tenant-primary" aria-hidden="true" />
                    )}
                    <span className="flex-1 text-left">
                      {highlightMatch(suggestion.text, query)}
                    </span>
                    {suggestion.type === 'recent' && (
                      <button
                        onClick={(e) => removeRecentSearch(suggestion.text, e)}
                        className="p-1 hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${suggestion.text} from recent searches`}
                      >
                        <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      </button>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            {/* Trending Searches (when no query) */}
            {!query && (
              <div className="p-2 border-t">
                <div className="px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <TranslatedUIText text="Trending" />
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {TRENDING_SEARCHES.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                    >
                      <TrendingUp className="h-3 w-3 text-tenant-primary" aria-hidden="true" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && suggestions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <TranslatedUIText text="Press Enter to search" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200/50 dark:bg-yellow-500/30 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Escape special regex characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default SearchSuggestions;
