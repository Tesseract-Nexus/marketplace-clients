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
            ? 'cursor-not-allowed opacity-50 bg-warm-100'
            : 'cursor-pointer bg-warm-50 hover:bg-warm-100'
          }
          ${error
            ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
            : isOpen
              ? 'border-terracotta-500 ring-2 ring-terracotta-500/20'
              : 'border-warm-200 hover:border-warm-300'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`flex items-center gap-3 truncate ${
          selectedOption
            ? 'text-foreground'
            : 'text-foreground-tertiary'
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
              className="p-1 rounded-full hover:bg-warm-200 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-foreground-tertiary" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-foreground-tertiary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 w-full rounded-xl border border-warm-200
            bg-white shadow-sm
            animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150
            overflow-hidden
          `}
        >
          {/* Search Input */}
          {showSearch && (
            <div className="p-3 border-b border-warm-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
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
                    bg-warm-50
                    border border-warm-200
                    text-foreground
                    placeholder:text-foreground-tertiary
                    focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500/20
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-warm-200"
                  >
                    <X className="w-3.5 h-3.5 text-foreground-tertiary" />
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
                <div className="w-6 h-6 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
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
                        ? 'bg-warm-50 text-terracotta-600'
                        : isHighlighted
                          ? 'bg-warm-100 text-foreground'
                          : 'text-foreground hover:bg-warm-50'
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
                        isSelected ? 'text-terracotta-600' : ''
                      }`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-foreground-secondary truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 flex-shrink-0 text-terracotta-500" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <div className="text-foreground-tertiary text-sm">
                  {emptyMessage}
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-terracotta-500 hover:text-terracotta-600"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {filteredOptions.length > 0 && showSearch && (
            <div className="px-3 py-2 border-t border-warm-200 bg-warm-50">
              <span className="text-xs text-foreground-tertiary">
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
