'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { ThemeTemplate, ThemePreset, THEME_PRESETS } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  selectedTheme: ThemeTemplate;
  onThemeSelect: (theme: ThemeTemplate) => void;
  disabled?: boolean;
}

export function ThemeSelector({ selectedTheme, onThemeSelect, disabled }: ThemeSelectorProps) {
  const [hoveredTheme, setHoveredTheme] = useState<ThemeTemplate | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {THEME_PRESETS.map((preset) => (
        <ThemeCard
          key={preset.id}
          preset={preset}
          isSelected={selectedTheme === preset.id}
          isHovered={hoveredTheme === preset.id}
          onSelect={() => !disabled && onThemeSelect(preset.id)}
          onMouseEnter={() => setHoveredTheme(preset.id)}
          onMouseLeave={() => setHoveredTheme(null)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface ThemeCardProps {
  preset: ThemePreset;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  disabled?: boolean;
}

function ThemeCard({
  preset,
  isSelected,
  isHovered,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  disabled,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      className={cn(
        'group relative p-3 rounded-xl border-2 transition-all duration-200 text-left',
        'hover:shadow-md hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-border/80',
        disabled && 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none'
      )}
    >
      {/* Theme name */}
      <h4 className={cn(
        'font-medium text-sm mb-2.5 truncate',
        isSelected ? 'text-primary' : 'text-foreground'
      )}>
        {preset.name}
      </h4>

      {/* Color palette bars - THE HERO */}
      <div className="flex gap-1.5 mb-2">
        <div
          className="h-10 flex-1 rounded-md shadow-sm"
          style={{ backgroundColor: preset.primaryColor }}
          title="Primary"
        />
        <div
          className="h-10 flex-1 rounded-md shadow-sm"
          style={{ backgroundColor: preset.secondaryColor }}
          title="Secondary"
        />
        <div
          className="h-10 flex-1 rounded-md shadow-sm"
          style={{ backgroundColor: preset.accentColor }}
          title="Accent"
        />
      </div>

      {/* Description - visible on hover or when selected */}
      <p className={cn(
        'text-xs text-muted-foreground line-clamp-2 transition-opacity duration-200 min-h-[2rem]',
        isSelected || isHovered ? 'opacity-100' : 'opacity-0'
      )}>
        {preset.description}
      </p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </button>
  );
}

export default ThemeSelector;
