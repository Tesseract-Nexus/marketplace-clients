'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string | React.ReactNode;
}

interface SimpleSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
}

export function SimpleSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  error = false,
  id,
}: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex h-14 w-full items-center justify-between rounded-xl border px-4 py-3
          bg-[var(--surface)] text-[var(--foreground)] text-base
          transition-all duration-200
          ${error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20 hover:border-[var(--border-strong)]'
          }
          ${className}
        `}
      >
        <span className={selectedOption ? 'text-[var(--foreground)]' : 'text-[var(--foreground-tertiary)]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--foreground-tertiary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="max-h-80 overflow-auto p-1">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    relative flex w-full cursor-pointer items-center rounded-md px-3 py-2.5 text-base
                    transition-colors duration-150
                    ${value === option.value
                      ? 'bg-[var(--surface-secondary)] text-[var(--foreground)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                    }
                  `}
                >
                  <span className="flex-1 text-left">{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-[var(--primary)]" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2.5 text-base text-[var(--foreground-tertiary)] text-center">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
