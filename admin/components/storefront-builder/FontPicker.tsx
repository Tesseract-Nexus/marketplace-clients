'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOOGLE_FONTS } from '@/lib/api/types';

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  description?: string;
}

type FontCategory = 'all' | 'sans-serif' | 'serif' | 'display' | 'monospace';

// Load Google Font dynamically
const loadGoogleFont = (fontName: string) => {
  const formattedName = fontName.replace(/\s+/g, '+');
  const linkId = `google-font-${formattedName}`;

  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export function FontPicker({ label, value, onChange, description }: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<FontCategory>('all');

  // Load the selected font
  useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    return GOOGLE_FONTS.filter((font) => {
      const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || font.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, category]);

  // Load fonts for visible options
  useEffect(() => {
    if (isOpen) {
      filteredFonts.slice(0, 10).forEach((font) => loadGoogleFont(font.name));
    }
  }, [isOpen, filteredFonts]);

  const selectedFont = GOOGLE_FONTS.find((f) => f.name === value);

  const categories: { id: FontCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'sans-serif', label: 'Sans Serif' },
    { id: 'serif', label: 'Serif' },
    { id: 'display', label: 'Display' },
    { id: 'monospace', label: 'Mono' },
  ];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left',
          isOpen
            ? 'border-primary ring-2 ring-purple-500/20'
            : 'border-border hover:border-border'
        )}
      >
        <div className="flex items-center gap-3">
          <Type className="h-5 w-5 text-muted-foreground" />
          <div>
            <span
              className="font-medium text-foreground"
              style={{ fontFamily: value ? `'${value}', ${selectedFont?.category || 'sans-serif'}` : 'inherit' }}
            >
              {value || 'Select a font'}
            </span>
            {selectedFont && (
              <span className="text-xs text-muted-foreground ml-2 capitalize">({selectedFont.category})</span>
            )}
          </div>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden">
            {/* Search and Filter */}
            <div className="p-3 border-b border-border">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full transition-colors',
                      category === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredFonts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No fonts found</div>
              ) : (
                filteredFonts.map((font) => (
                  <button
                    key={font.name}
                    type="button"
                    onMouseEnter={() => loadGoogleFont(font.name)}
                    onClick={() => {
                      onChange(font.name);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                      value === font.name ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <div>
                      <span
                        className="text-lg"
                        style={{ fontFamily: `'${font.name}', ${font.category}` }}
                      >
                        {font.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">{font.category}</span>
                    </div>
                    {value === font.name && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))
              )}
            </div>

            {/* Preview */}
            {value && (
              <div className="p-4 border-t border-border bg-muted">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <p
                  className="text-2xl text-foreground"
                  style={{ fontFamily: `'${value}', ${selectedFont?.category || 'sans-serif'}` }}
                >
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Typography Preview Component
interface TypographyPreviewProps {
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  headingWeight: number;
  bodyWeight: number;
  headingLineHeight: 'tight' | 'normal' | 'relaxed';
  bodyLineHeight: 'tight' | 'normal' | 'relaxed';
  headingLetterSpacing: 'tight' | 'normal' | 'wide';
  headingScale: 'compact' | 'default' | 'large';
}

const lineHeightValues = { tight: 1.1, normal: 1.3, relaxed: 1.5 };
const bodyLineHeightValues = { tight: 1.4, normal: 1.6, relaxed: 1.8 };
const letterSpacingValues = { tight: '-0.02em', normal: '0', wide: '0.02em' };
const headingScales = {
  compact: { h1: 2, h2: 1.75, h3: 1.5, h4: 1.25 },
  default: { h1: 2.5, h2: 2, h3: 1.75, h4: 1.5 },
  large: { h1: 3, h2: 2.5, h3: 2, h4: 1.75 },
};

export function TypographyPreview({
  headingFont,
  bodyFont,
  baseFontSize,
  headingWeight,
  bodyWeight,
  headingLineHeight,
  bodyLineHeight,
  headingLetterSpacing,
  headingScale,
}: TypographyPreviewProps) {
  const headingStyle = {
    fontFamily: `'${headingFont}', sans-serif`,
    fontWeight: headingWeight,
    lineHeight: lineHeightValues[headingLineHeight],
    letterSpacing: letterSpacingValues[headingLetterSpacing],
  };

  const bodyStyle = {
    fontFamily: `'${bodyFont}', sans-serif`,
    fontWeight: bodyWeight,
    lineHeight: bodyLineHeightValues[bodyLineHeight],
    fontSize: `${baseFontSize}px`,
  };

  const scale = headingScales[headingScale];

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Live Preview</h4>

      <h1 style={{ ...headingStyle, fontSize: `${baseFontSize * scale.h1}px` }}>
        Heading One
      </h1>
      <h2 style={{ ...headingStyle, fontSize: `${baseFontSize * scale.h2}px` }}>
        Heading Two
      </h2>
      <h3 style={{ ...headingStyle, fontSize: `${baseFontSize * scale.h3}px` }}>
        Heading Three
      </h3>
      <h4 style={{ ...headingStyle, fontSize: `${baseFontSize * scale.h4}px` }}>
        Heading Four
      </h4>

      <hr className="border-border" />

      <p style={bodyStyle}>
        This is a sample paragraph demonstrating the body text style. The quick brown fox jumps over
        the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua.
      </p>

      <p style={{ ...bodyStyle, fontWeight: bodyWeight + 100 }}>
        <strong>Bold text</strong> and <em>italic text</em> can be used for emphasis within paragraphs.
      </p>
    </div>
  );
}
