'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  searchTerms?: string[]; // Additional terms to search by
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  enableSearch?: boolean; // Enable search when there are many options
  searchThreshold?: number; // Show search if options count exceeds this (default: 5)
  emptyMessage?: string;
  loading?: boolean;
  maxHeight?: number; // Max height of dropdown in pixels
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  className = '',
  error = false,
  disabled = false,
  id,
  enableSearch = true,
  searchThreshold = 5,
  emptyMessage = 'No options found',
  loading = false,
  maxHeight = 320,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const showSearch = enableSearch && options.length > searchThreshold;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter(option => {
      const labelMatch = option.label.toLowerCase().includes(query);
      const valueMatch = option.value.toLowerCase().includes(query);
      const descriptionMatch = option.description?.toLowerCase().includes(query);
      const searchTermsMatch = option.searchTerms?.some(term =>
        term.toLowerCase().includes(query)
      );
      return labelMatch || valueMatch || descriptionMatch || searchTermsMatch;
    });
  }, [options, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, showSearch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) {
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex h-14 w-full items-center justify-between rounded-xl border px-4 py-3
          text-base transition-all duration-200 outline-none
          ${disabled
            ? 'cursor-not-allowed opacity-50 bg-gray-100 dark:bg-white/5'
            : 'cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
          }
          ${error
            ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`flex items-center gap-3 truncate ${
          selectedOption
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-white/40'
        }`}>
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-white/40" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 dark:text-white/40 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#1a1a1a] shadow-xl shadow-black/10 dark:shadow-black/50
            animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150
            overflow-hidden
          `}
        >
          {/* Search Input */}
          {showSearch && (
            <div className="p-3 border-b border-gray-100 dark:border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className={`
                    w-full h-10 pl-10 pr-4 text-sm rounded-lg
                    bg-gray-50 dark:bg-white/5
                    border border-gray-200 dark:border-white/10
                    text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-white/40
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
                    transition-all
                  `}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto p-1.5"
            style={{ maxHeight: `${maxHeight}px` }}
            role="listbox"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = value === option.value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left
                      transition-colors duration-100
                      ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : isHighlighted
                          ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5'
                      }
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0 text-lg">{option.icon}</span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${
                        isSelected ? 'text-blue-600 dark:text-blue-400' : ''
                      }`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500 dark:text-white/50 truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <div className="text-gray-400 dark:text-white/40 text-sm">
                  {emptyMessage}
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {filteredOptions.length > 0 && showSearch && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <span className="text-xs text-gray-400 dark:text-white/40">
                {searchQuery
                  ? `${filteredOptions.length} of ${options.length} options`
                  : `${options.length} options`
                }
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
