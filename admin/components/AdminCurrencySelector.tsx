'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, DollarSign, ArrowRightLeft, Search } from 'lucide-react';
import { useAdminCurrencySelector } from '@/contexts/AdminCurrencyContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminCurrencySelectorProps {
  compact?: boolean;
}

export function AdminCurrencySelector({ compact = false }: AdminCurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedCurrency,
    selectedCurrencyInfo,
    setCurrency,
    currencies,
    isConverted,
  } = useAdminCurrencySelector();

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

  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          isConverted
            ? compact
              ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              : "bg-primary text-primary-foreground border-transparent hover:bg-primary/90"
            : compact
              ? "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              : "bg-background hover:bg-muted text-foreground border-border"
        )}
      >
        {selectedCurrencyInfo?.flag && (
          <span className={compact ? "text-sm" : "text-base"}>{selectedCurrencyInfo.flag}</span>
        )}
        <span className="font-semibold">{selectedCurrency}</span>
        {isConverted && !compact && (
          <ArrowRightLeft className="h-3 w-3" />
        )}
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute w-72 bg-card rounded-xl shadow-xl border border-border z-[9999] animate-in fade-in duration-200 flex flex-col",
          "top-full mt-2 right-0 slide-in-from-top-2",
          compact && "max-h-[min(400px,calc(100vh-120px))]"
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Display Currency</h3>
              </div>
              {isConverted && (
                <div className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  Converting
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              View all figures in your preferred currency
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
                placeholder="Search currencies..."
                className="w-full h-10 pl-10 pr-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          {/* Currency Options */}
          <div className="flex-1 min-h-0 overflow-y-auto py-1">
            {filteredCurrencies.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No currencies found
              </div>
            ) : (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    setCurrency(currency.code);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                    selectedCurrency === currency.code
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currency.flag}</span>
                    <div className="text-left">
                      <span className="font-semibold">{currency.code}</span>
                      <span className="text-muted-foreground ml-2">{currency.symbol}</span>
                      <p className="text-xs text-muted-foreground">{currency.name}</p>
                    </div>
                  </div>
                  {selectedCurrency === currency.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-border bg-muted">
            <p className="text-xs text-muted-foreground">
              {isConverted
                ? 'Amounts are converted using live exchange rates'
                : 'Showing amounts in store currency'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version showing only flag and code
export function AdminCurrencySelectorCompact() {
  const { selectedCurrency, selectedCurrencyInfo, isConverted } = useAdminCurrencySelector();

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
        isConverted
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      )}
      title={`Display currency: ${selectedCurrencyInfo?.name || selectedCurrency}`}
    >
      {selectedCurrencyInfo?.flag && (
        <span className="text-sm">{selectedCurrencyInfo.flag}</span>
      )}
      <span>{selectedCurrency}</span>
    </div>
  );
}
