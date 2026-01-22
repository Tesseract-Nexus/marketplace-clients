'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Choose Your Theme</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Select a pre-built theme as your starting point. You can customize colors after selection.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        'relative rounded-xl border-2 p-4 transition-all duration-200 text-left',
        'hover:shadow-lg hover:scale-[1.02]',
        isSelected
          ? 'border-primary ring-2 ring-purple-500/20 shadow-lg'
          : 'border-border hover:border-border',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/100 rounded-full flex items-center justify-center shadow-md">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Theme preview */}
      <div
        className="h-24 rounded-lg mb-3 overflow-hidden relative"
        style={{ backgroundColor: preset.backgroundColor }}
      >
        {/* Gradient overlay for vibrant themes */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${preset.primaryColor}40 0%, ${preset.secondaryColor}40 100%)`,
          }}
        />

        {/* Mock UI elements */}
        <div className="absolute inset-0 p-2">
          {/* Header bar */}
          <div
            className="h-3 w-full rounded-full mb-2"
            style={{ backgroundColor: preset.primaryColor }}
          />

          {/* Content blocks */}
          <div className="flex gap-1">
            <div
              className="h-8 w-1/3 rounded"
              style={{ backgroundColor: preset.secondaryColor + '60' }}
            />
            <div
              className="h-8 w-1/3 rounded"
              style={{ backgroundColor: preset.primaryColor + '40' }}
            />
            <div
              className="h-8 w-1/3 rounded"
              style={{ backgroundColor: preset.accentColor + '60' }}
            />
          </div>

          {/* Button */}
          <div
            className="h-4 w-16 rounded-full mt-2 mx-auto"
            style={{ backgroundColor: preset.primaryColor }}
          />
        </div>
      </div>

      {/* Theme info */}
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground">{preset.name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1 mt-3">
        <div
          className="h-5 w-5 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: preset.primaryColor }}
          title="Primary"
        />
        <div
          className="h-5 w-5 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: preset.secondaryColor }}
          title="Secondary"
        />
        <div
          className="h-5 w-5 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: preset.accentColor }}
          title="Accent"
        />
        <div
          className="h-5 w-5 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: preset.backgroundColor }}
          title="Background"
        />
      </div>
    </button>
  );
}

export default ThemeSelector;
