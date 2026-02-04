'use client';

import React from 'react';
import { Check, Circle, Square, RectangleHorizontal, Layers, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BorderRadius,
  ButtonStyle,
  ButtonSize,
  CardStyleType,
  CardPadding,
  SectionSpacing,
  ShadowIntensity,
  AnimationSpeed,
} from '@/lib/api/types';

// Border Radius Picker
interface BorderRadiusPickerProps {
  label?: string;
  value: BorderRadius;
  onChange: (value: BorderRadius) => void;
}

const borderRadiusOptions: { id: BorderRadius; label: string; preview: string }[] = [
  { id: 'none', label: 'None', preview: 'rounded-none' },
  { id: 'small', label: 'Small', preview: 'rounded-sm' },
  { id: 'medium', label: 'Medium', preview: 'rounded-lg' },
  { id: 'large', label: 'Large', preview: 'rounded-2xl' },
  { id: 'full', label: 'Full', preview: 'rounded-full' },
];

export function BorderRadiusPicker({ label = 'Border Radius', value, onChange }: BorderRadiusPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">{label}</label>
      <div className="flex gap-3">
        {borderRadiusOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex flex-col items-center p-3 flex-1 rounded-lg border-2 transition-all',
              value === option.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 bg-primary/60 mb-2',
                option.preview
              )}
            />
            <span className="text-xs font-medium">{option.label}</span>
            {value === option.id && (
              <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Button Style Picker
interface ButtonStylePickerProps {
  style: ButtonStyle;
  size: ButtonSize;
  onStyleChange: (value: ButtonStyle) => void;
  onSizeChange: (value: ButtonSize) => void;
}

const buttonStyleOptions: { id: ButtonStyle; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'pill', label: 'Pill' },
];

const buttonSizeOptions: { id: ButtonSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

export function ButtonStylePicker({ style, size, onStyleChange, onSizeChange }: ButtonStylePickerProps) {
  const getButtonClass = (s: ButtonStyle, sz: ButtonSize) => {
    const radiusClass = s === 'square' ? 'rounded-none' : s === 'rounded' ? 'rounded-lg' : 'rounded-full';
    const sizeClass = sz === 'small' ? 'px-3 py-1.5 text-xs' : sz === 'medium' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base';
    return cn(radiusClass, sizeClass);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Button Style</label>
        <div className="flex gap-3">
          {buttonStyleOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onStyleChange(option.id)}
              className={cn(
                'relative flex-1 p-4 rounded-lg border-2 transition-all',
                style === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <div className="flex justify-center mb-2">
                <span
                  className={cn(
                    'bg-primary text-primary-foreground font-medium',
                    getButtonClass(option.id, 'medium')
                  )}
                >
                  Button
                </span>
              </div>
              <span className="text-xs font-medium block text-center">{option.label}</span>
              {style === option.id && (
                <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Button Size</label>
        <div className="flex gap-3">
          {buttonSizeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSizeChange(option.id)}
              className={cn(
                'relative flex-1 p-3 rounded-lg border-2 transition-all',
                size === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-4 bg-muted rounded-lg">
        <label className="block text-xs text-muted-foreground mb-3">Preview</label>
        <div className="flex gap-3 justify-center">
          <span
            className={cn(
              'bg-primary text-primary-foreground font-medium',
              getButtonClass(style, size)
            )}
          >
            Primary
          </span>
          <span
            className={cn(
              'border-2 border-primary text-primary font-medium',
              getButtonClass(style, size)
            )}
          >
            Secondary
          </span>
        </div>
      </div>
    </div>
  );
}

// Card Style Picker
interface CardStylePickerProps {
  style: CardStyleType;
  padding: CardPadding;
  onStyleChange: (value: CardStyleType) => void;
  onPaddingChange: (value: CardPadding) => void;
}

const cardStyleOptions: { id: CardStyleType; label: string; description: string }[] = [
  { id: 'flat', label: 'Flat', description: 'No border or shadow' },
  { id: 'bordered', label: 'Bordered', description: 'Subtle border' },
  { id: 'elevated', label: 'Elevated', description: 'Soft shadow' },
  { id: 'glass', label: 'Glass', description: 'Frosted glass effect' },
];

const cardPaddingOptions: { id: CardPadding; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'default', label: 'Default' },
  { id: 'spacious', label: 'Spacious' },
];

export function CardStylePicker({ style, padding, onStyleChange, onPaddingChange }: CardStylePickerProps) {
  const getCardClass = (s: CardStyleType) => {
    switch (s) {
      case 'flat':
        return 'bg-white';
      case 'bordered':
        return 'bg-card border border-border';
      case 'elevated':
        return 'bg-card shadow-lg shadow-gray-200/50';
      case 'glass':
        return 'bg-white/80 backdrop-blur border border-white/20';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Card Style</label>
        <div className="grid grid-cols-2 gap-3">
          {cardStyleOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onStyleChange(option.id)}
              className={cn(
                'relative flex flex-col items-center p-4 rounded-lg border-2 transition-all text-left',
                style === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <div
                className={cn(
                  'w-full h-16 rounded-lg mb-3',
                  getCardClass(option.id)
                )}
              >
                <div className="p-2">
                  <div className="h-6 w-full bg-muted rounded mb-1" />
                  <div className="h-2 w-2/3 bg-muted rounded" />
                </div>
              </div>
              <span className="font-medium text-sm">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
              {style === option.id && (
                <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Card Padding</label>
        <div className="flex gap-3">
          {cardPaddingOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onPaddingChange(option.id)}
              className={cn(
                'relative flex-1 p-3 rounded-lg border-2 transition-all text-center',
                padding === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Section Spacing Picker
interface SectionSpacingPickerProps {
  value: SectionSpacing;
  onChange: (value: SectionSpacing) => void;
}

const sectionSpacingOptions: { id: SectionSpacing; label: string; spacing: string }[] = [
  { id: 'compact', label: 'Compact', spacing: '48px' },
  { id: 'default', label: 'Default', spacing: '80px' },
  { id: 'spacious', label: 'Spacious', spacing: '120px' },
];

export function SectionSpacingPicker({ value, onChange }: SectionSpacingPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Section Spacing</label>
      <div className="flex gap-3">
        {sectionSpacingOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex-1 p-4 rounded-lg border-2 transition-all',
              value === option.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border'
            )}
          >
            <div className="mb-2 flex flex-col items-center gap-1">
              <div className="w-full h-3 bg-border rounded" />
              <div
                className={cn(
                  'w-full bg-primary/10',
                  option.id === 'compact' ? 'h-2' : option.id === 'default' ? 'h-4' : 'h-6'
                )}
              />
              <div className="w-full h-3 bg-border rounded" />
            </div>
            <span className="text-xs font-medium block text-center">{option.label}</span>
            <span className="text-[10px] text-muted-foreground block text-center">{option.spacing}</span>
            {value === option.id && (
              <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Shadow Intensity Picker
interface ShadowIntensityPickerProps {
  value: ShadowIntensity;
  onChange: (value: ShadowIntensity) => void;
}

const shadowOptions: { id: ShadowIntensity; label: string; shadow: string }[] = [
  { id: 'none', label: 'None', shadow: '' },
  { id: 'subtle', label: 'Subtle', shadow: 'shadow-sm' },
  { id: 'medium', label: 'Medium', shadow: 'shadow-md' },
  { id: 'strong', label: 'Strong', shadow: 'shadow-xl' },
];

export function ShadowIntensityPicker({ value, onChange }: ShadowIntensityPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Shadow Intensity</label>
      <div className="grid grid-cols-4 gap-3">
        {shadowOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              value === option.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 bg-card rounded-lg mb-2',
                option.shadow
              )}
            />
            <span className="text-xs font-medium">{option.label}</span>
            {value === option.id && (
              <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Animation Speed Picker
interface AnimationSpeedPickerProps {
  speed: AnimationSpeed;
  hoverEffects: boolean;
  onSpeedChange: (value: AnimationSpeed) => void;
  onHoverEffectsChange: (enabled: boolean) => void;
}

const animationSpeedOptions: { id: AnimationSpeed; label: string; duration: string }[] = [
  { id: 'none', label: 'None', duration: '0ms' },
  { id: 'fast', label: 'Fast', duration: '150ms' },
  { id: 'normal', label: 'Normal', duration: '200ms' },
  { id: 'slow', label: 'Slow', duration: '300ms' },
];

export function AnimationSpeedPicker({
  speed,
  hoverEffects,
  onSpeedChange,
  onHoverEffectsChange,
}: AnimationSpeedPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Animation Speed</label>
        <div className="grid grid-cols-4 gap-3">
          {animationSpeedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSpeedChange(option.id)}
              className={cn(
                'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                speed === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <Zap
                className={cn(
                  'h-6 w-6 mb-1',
                  option.id === 'none' ? 'text-muted-foreground' : 'text-primary'
                )}
              />
              <span className="text-xs font-medium">{option.label}</span>
              <span className="text-[10px] text-muted-foreground">{option.duration}</span>
              {speed === option.id && (
                <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hoverEffects}
          onChange={(e) => onHoverEffectsChange(e.target.checked)}
          className="rounded border-border text-primary focus:ring-ring focus:ring-offset-2"
        />
        <span className="text-sm">Enable hover effects on interactive elements</span>
      </label>
    </div>
  );
}

// Image Aspect Ratio Picker
interface ImageAspectRatioPickerProps {
  value: 'square' | 'portrait' | 'landscape' | 'auto';
  onChange: (value: 'square' | 'portrait' | 'landscape' | 'auto') => void;
}

const aspectRatioOptions: { id: 'square' | 'portrait' | 'landscape' | 'auto'; label: string; ratio: string }[] = [
  { id: 'square', label: 'Square', ratio: '1:1' },
  { id: 'portrait', label: 'Portrait', ratio: '3:4' },
  { id: 'landscape', label: 'Landscape', ratio: '4:3' },
  { id: 'auto', label: 'Auto', ratio: 'Original' },
];

export function ImageAspectRatioPicker({ value, onChange }: ImageAspectRatioPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Product Image Aspect Ratio</label>
      <div className="grid grid-cols-4 gap-3">
        {aspectRatioOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              value === option.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border'
            )}
          >
            <div className="mb-2 flex items-center justify-center h-12 w-12">
              <div
                className={cn(
                  'bg-primary/40 rounded',
                  option.id === 'square' && 'w-10 h-10',
                  option.id === 'portrait' && 'w-8 h-10',
                  option.id === 'landscape' && 'w-10 h-8',
                  option.id === 'auto' && 'w-10 h-7'
                )}
              />
            </div>
            <span className="text-xs font-medium">{option.label}</span>
            <span className="text-[10px] text-muted-foreground">{option.ratio}</span>
            {value === option.id && (
              <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
