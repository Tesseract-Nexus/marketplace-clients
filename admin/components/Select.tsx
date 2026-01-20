"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'filter';
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  leftIcon,
  className,
  variant = 'default',
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 transition-all text-left",
          variant === 'filter'
            ? "px-4 py-2.5 border-2 border-border rounded-xl text-sm font-semibold bg-white hover:border-border shadow-sm"
            : "pl-12 pr-10 py-3.5 border-2 border-border rounded-xl font-medium bg-white hover:border-border shadow-sm",
          isOpen && "ring-2 ring-blue-500 border-primary",
          disabled && "opacity-50 cursor-not-allowed bg-muted",
          className
        )}
      >
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Selected Value */}
        <span className="flex-1 truncate">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-xl border-2 border-primary/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left transition-all",
                    isSelected
                      ? "bg-muted text-primary font-semibold"
                      : "text-foreground hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.icon && <span>{option.icon}</span>}
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
