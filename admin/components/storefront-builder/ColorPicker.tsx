'use client';

import { useState, useEffect, useCallback } from 'react';
import { Palette, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { themeUtils } from '@/lib/api/storefront';

interface ColorPickerProps {
  label: string;
  description?: string;
  value: string;
  onChange: (color: string) => void;
  defaultValue?: string;
  showContrastWarning?: boolean;
  contrastAgainst?: string;
  disabled?: boolean;
}

export function ColorPicker({
  label,
  description,
  value,
  onChange,
  defaultValue,
  showContrastWarning = true,
  contrastAgainst,
  disabled,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validateAndUpdate = useCallback(
    (newValue: string) => {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      const isValidHex = hexRegex.test(newValue);
      setIsValid(isValidHex);

      if (isValidHex) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Add # if not present
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }

    setInputValue(newValue);
    validateAndUpdate(newValue);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsValid(true);
  };

  const handleReset = () => {
    if (defaultValue) {
      setInputValue(defaultValue);
      onChange(defaultValue);
      setIsValid(true);
    }
  };

  // Calculate contrast warning (only if both colors are valid hex)
  const isValidHexColor = (color: string) =>
    color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

  const showWarning =
    showContrastWarning &&
    contrastAgainst &&
    isValidHexColor(value) &&
    isValidHexColor(contrastAgainst) &&
    !hasGoodContrast(value, contrastAgainst);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-foreground">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {defaultValue && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || value === defaultValue}
            className={cn(
              'text-xs text-muted-foreground hover:text-foreground flex items-center gap-1',
              (disabled || value === defaultValue) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Native color picker */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorPickerChange}
            disabled={disabled}
            className={cn(
              'w-12 h-12 rounded-lg cursor-pointer border-2 border-border',
              'hover:border-border transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ padding: 0 }}
          />
          {!isValid && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive/100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Hex input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder="#000000"
              maxLength={7}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm font-mono uppercase',
                'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary',
                isValid ? 'border-border' : 'border-destructive bg-destructive/10',
                disabled && 'opacity-50 cursor-not-allowed bg-muted'
              )}
            />
            {isValid && value && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="h-4 w-4 text-success" />
              </div>
            )}
          </div>
          {!isValid && (
            <p className="text-xs text-destructive mt-1">Please enter a valid hex color</p>
          )}
        </div>

        {/* Color preview with variants */}
        {value && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) && (
          <div className="flex flex-col gap-1">
            <div
              className="w-8 h-4 rounded border border-border"
              style={{ backgroundColor: themeUtils.lightenColor(value, 20) }}
              title="Light variant"
            />
            <div
              className="w-8 h-4 rounded border border-border"
              style={{ backgroundColor: value }}
              title="Base color"
            />
            <div
              className="w-8 h-4 rounded border border-border"
              style={{ backgroundColor: themeUtils.darkenColor(value, 20) }}
              title="Dark variant"
            />
          </div>
        )}
      </div>

      {/* Contrast warning */}
      {showWarning && (
        <div className="flex items-center gap-2 text-xs text-warning bg-warning-muted px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Low contrast with background. Text may be hard to read.</span>
        </div>
      )}
    </div>
  );
}

/**
 * Check if two colors have good contrast (WCAG AA standard)
 */
function hasGoodContrast(color1: string, color2: string): boolean {
  const luminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = luminance(color1);
  const l2 = luminance(color2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return ratio >= 4.5; // WCAG AA standard for normal text
}

interface ColorPairPickerProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
  defaultPrimary?: string;
  defaultSecondary?: string;
  disabled?: boolean;
}

export function ColorPairPicker({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
  defaultPrimary,
  defaultSecondary,
  disabled,
}: ColorPairPickerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Customize Colors</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ColorPicker
          label="Primary Color"
          description="Used for buttons, links, and accents"
          value={primaryColor}
          onChange={onPrimaryChange}
          defaultValue={defaultPrimary}
          disabled={disabled}
        />
        <ColorPicker
          label="Secondary Color"
          description="Used for highlights and gradients"
          value={secondaryColor}
          onChange={onSecondaryChange}
          defaultValue={defaultSecondary}
          disabled={disabled}
        />
      </div>

      {/* Gradient preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Gradient Preview</label>
        <div
          className="h-16 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        />
      </div>
    </div>
  );
}

export default ColorPicker;
