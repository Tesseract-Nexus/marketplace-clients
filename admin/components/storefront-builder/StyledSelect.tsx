'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

interface StyledSelectProps {
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  description?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}

export function StyledSelect({
  label,
  value,
  options,
  onChange,
  description,
  icon,
  placeholder = 'Select an option',
}: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use loose equality to handle string/number comparison
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left',
          isOpen
            ? 'border-purple-500 ring-2 ring-purple-500/20'
            : 'border-border hover:border-border'
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <div>
            <span className="font-medium text-foreground">
              {selectedOption?.label || placeholder}
            </span>
            {selectedOption?.description && (
              <span className="text-xs text-muted-foreground ml-2">({selectedOption.description})</span>
            )}
          </div>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                    String(value) === String(option.value) ? 'bg-purple-50' : 'hover:bg-muted'
                  )}
                >
                  <div>
                    <span className="font-medium text-foreground">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground ml-2">{option.description}</span>
                    )}
                  </div>
                  {String(value) === String(option.value) && <Check className="h-5 w-5 text-purple-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
