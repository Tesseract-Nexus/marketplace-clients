'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { ThemeTemplate, ThemePreset, THEME_PRESETS } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  selectedTheme: ThemeTemplate;
  onThemeSelect: (theme: ThemeTemplate) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ThemeSelector({ selectedTheme, onThemeSelect, disabled, compact }: ThemeSelectorProps) {
  const [hoveredTheme, setHoveredTheme] = useState<ThemeTemplate | null>(null);

  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 gap-4')}>
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
          compact={compact}
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
  compact?: boolean;
}

function ThemeCard({
  preset,
  isSelected,
  isHovered,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  disabled,
  compact,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ease-out cursor-pointer text-left',
        'hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-border/50 hover:border-border',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0'
      )}
    >
      {/* Gradient Hero Section - 60% */}
      <div
        className={cn('relative overflow-hidden', compact ? 'h-20' : 'h-24')}
        style={{
          background: `linear-gradient(135deg, ${preset.primaryColor} 0%, ${preset.secondaryColor} 50%, ${preset.accentColor} 100%)`,
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${preset.backgroundColor}40 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${preset.backgroundColor}30 0%, transparent 40%)`,
          }}
        />

        {/* Selection indicator badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Check className="h-3 w-3 text-primary" />
          </div>
        )}

        {/* Hover description overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 flex items-center justify-center p-3 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p className="text-white text-xs text-center line-clamp-3 font-medium">
            {preset.description}
          </p>
        </div>
      </div>

      {/* Info Section - 40% */}
      <div className={cn('bg-card', compact ? 'p-2.5' : 'p-3')}>
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn('font-semibold text-foreground truncate', compact ? 'text-xs' : 'text-sm')}>
            {preset.name}
          </h4>
          {/* Compact color swatches */}
          <div className="flex gap-0.5 flex-shrink-0">
            <div
              className={cn('rounded-full border border-white/50 shadow-sm', compact ? 'h-3 w-3' : 'h-4 w-4')}
              style={{ backgroundColor: preset.primaryColor }}
            />
            <div
              className={cn('rounded-full border border-white/50 shadow-sm', compact ? 'h-3 w-3' : 'h-4 w-4')}
              style={{ backgroundColor: preset.secondaryColor }}
            />
            <div
              className={cn('rounded-full border border-white/50 shadow-sm', compact ? 'h-3 w-3' : 'h-4 w-4')}
              style={{ backgroundColor: preset.accentColor }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default ThemeSelector;
