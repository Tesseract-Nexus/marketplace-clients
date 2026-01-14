'use client';

import React from 'react';
import { Type, Heading1, Heading2, ALargeSmall } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// GOOGLE FONTS
// =============================================================================

export const GOOGLE_FONTS = [
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'sans-serif' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', category: 'sans-serif' },
  { value: 'Nunito', label: 'Nunito', category: 'sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'sans-serif' },
  { value: 'Work Sans', label: 'Work Sans', category: 'sans-serif' },
  { value: 'DM Sans', label: 'DM Sans', category: 'sans-serif' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'serif' },
  { value: 'Lora', label: 'Lora', category: 'serif' },
  { value: 'PT Serif', label: 'PT Serif', category: 'serif' },
  { value: 'Source Serif Pro', label: 'Source Serif Pro', category: 'serif' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'serif' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif' },
  { value: 'Fira Code', label: 'Fira Code', category: 'monospace' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'monospace' },
  { value: 'Source Code Pro', label: 'Source Code Pro', category: 'monospace' },
];

// =============================================================================
// TYPES
// =============================================================================

export interface TypographyConfig {
  headingFont?: string;
  bodyFont?: string;
  baseFontSize?: number;
  headingScale?: 'compact' | 'default' | 'large';
  headingWeight?: number;
  bodyWeight?: number;
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  letterSpacing?: 'tight' | 'normal' | 'wide';
}

interface TypographyEditorProps {
  config: TypographyConfig;
  onChange: (config: TypographyConfig) => void;
  disabled?: boolean;
}

// =============================================================================
// TYPOGRAPHY PREVIEW
// =============================================================================

function TypographyPreview({ config }: { config: TypographyConfig }) {
  const headingFont = config.headingFont || 'Inter';
  const bodyFont = config.bodyFont || 'Inter';
  const baseFontSize = config.baseFontSize || 16;
  const scale = config.headingScale === 'compact' ? 1.2 : config.headingScale === 'large' ? 1.333 : 1.25;

  const h1Size = Math.round(baseFontSize * Math.pow(scale, 4));
  const h2Size = Math.round(baseFontSize * Math.pow(scale, 3));
  const h3Size = Math.round(baseFontSize * Math.pow(scale, 2));
  const pSize = baseFontSize;

  const lineHeight = config.lineHeight === 'tight' ? 1.3 : config.lineHeight === 'relaxed' ? 1.8 : 1.5;
  const letterSpacing = config.letterSpacing === 'tight' ? '-0.02em' : config.letterSpacing === 'wide' ? '0.02em' : '0';

  return (
    <div className="p-6 bg-background border rounded-lg space-y-4">
      <h1
        style={{
          fontFamily: headingFont,
          fontSize: `${h1Size}px`,
          fontWeight: config.headingWeight || 700,
          lineHeight: 1.2,
          letterSpacing,
        }}
      >
        Heading 1
      </h1>
      <h2
        style={{
          fontFamily: headingFont,
          fontSize: `${h2Size}px`,
          fontWeight: config.headingWeight || 700,
          lineHeight: 1.3,
          letterSpacing,
        }}
      >
        Heading 2
      </h2>
      <h3
        style={{
          fontFamily: headingFont,
          fontSize: `${h3Size}px`,
          fontWeight: config.headingWeight || 600,
          lineHeight: 1.4,
          letterSpacing,
        }}
      >
        Heading 3
      </h3>
      <p
        style={{
          fontFamily: bodyFont,
          fontSize: `${pSize}px`,
          fontWeight: config.bodyWeight || 400,
          lineHeight,
          letterSpacing,
        }}
        className="text-muted-foreground"
      >
        Body text looks like this. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Vestibulum efficitur nunc at sapien vestibulum, vel volutpat libero commodo.
      </p>
      <p
        style={{
          fontFamily: bodyFont,
          fontSize: `${pSize - 2}px`,
          fontWeight: config.bodyWeight || 400,
          lineHeight,
          letterSpacing,
        }}
        className="text-muted-foreground/80"
      >
        Smaller text for captions and labels.
      </p>
    </div>
  );
}

// =============================================================================
// TYPOGRAPHY EDITOR
// =============================================================================

export function TypographyEditor({ config, onChange, disabled = false }: TypographyEditorProps) {
  const updateConfig = (updates: Partial<TypographyConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font Families
          </CardTitle>
          <CardDescription>
            Choose fonts for headings and body text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Select
                value={config.headingFont || 'Inter'}
                onValueChange={(value) => updateConfig({ headingFont: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="text-xs text-muted-foreground px-2 py-1.5">Sans-serif</div>
                  {GOOGLE_FONTS.filter((f) => f.category === 'sans-serif').map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                  <div className="text-xs text-muted-foreground px-2 py-1.5 mt-2">Serif</div>
                  {GOOGLE_FONTS.filter((f) => f.category === 'serif').map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Body Font</Label>
              <Select
                value={config.bodyFont || 'Inter'}
                onValueChange={(value) => updateConfig({ bodyFont: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="text-xs text-muted-foreground px-2 py-1.5">Sans-serif</div>
                  {GOOGLE_FONTS.filter((f) => f.category === 'sans-serif').map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                  <div className="text-xs text-muted-foreground px-2 py-1.5 mt-2">Serif</div>
                  {GOOGLE_FONTS.filter((f) => f.category === 'serif').map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Size & Scale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ALargeSmall className="w-4 h-4" />
            Size & Scale
          </CardTitle>
          <CardDescription>
            Adjust base size and heading scale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Base Font Size</Label>
              <span className="text-sm text-muted-foreground">{config.baseFontSize || 16}px</span>
            </div>
            <Slider
              value={[config.baseFontSize || 16]}
              onValueChange={(values: number[]) => updateConfig({ baseFontSize: values[0] })}
              min={12}
              max={20}
              step={1}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Heading Scale</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'default', 'large'] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => updateConfig({ headingScale: scale })}
                  disabled={disabled}
                  className={cn(
                    'p-3 border rounded-lg text-center transition-colors',
                    (config.headingScale || 'default') === scale
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  )}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {scale === 'compact' ? '1.2' : scale === 'large' ? '1.333' : '1.25'}
                  </div>
                  <div className="font-medium capitalize">{scale}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heading1 className="w-4 h-4" />
            Font Weights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heading Weight</Label>
              <Select
                value={String(config.headingWeight || 700)}
                onValueChange={(value) => updateConfig({ headingWeight: Number(value) })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                  <SelectItem value="900">Black (900)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Body Weight</Label>
              <Select
                value={String(config.bodyWeight || 400)}
                onValueChange={(value) => updateConfig({ bodyWeight: Number(value) })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Height & Letter Spacing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heading2 className="w-4 h-4" />
            Spacing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Line Height</Label>
              <Select
                value={config.lineHeight || 'normal'}
                onValueChange={(value) => updateConfig({ lineHeight: value as TypographyConfig['lineHeight'] })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight (1.3)</SelectItem>
                  <SelectItem value="normal">Normal (1.5)</SelectItem>
                  <SelectItem value="relaxed">Relaxed (1.8)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Letter Spacing</Label>
              <Select
                value={config.letterSpacing || 'normal'}
                onValueChange={(value) => updateConfig({ letterSpacing: value as TypographyConfig['letterSpacing'] })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight (-0.02em)</SelectItem>
                  <SelectItem value="normal">Normal (0)</SelectItem>
                  <SelectItem value="wide">Wide (0.02em)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyPreview config={config} />
        </CardContent>
      </Card>
    </div>
  );
}

export default TypographyEditor;
