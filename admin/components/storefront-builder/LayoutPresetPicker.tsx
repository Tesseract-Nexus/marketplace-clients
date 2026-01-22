'use client';

import React from 'react';
import { Check, Layout, Grid, Columns, Rows, LayoutGrid, LayoutList, Menu, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContainerWidth,
  ContentPadding,
  HomepageLayout,
  HeaderLayout,
  HeaderHeight,
  FooterLayout,
  ProductListLayout,
  ProductDetailLayout,
  CategoryLayout,
} from '@/lib/api/types';

// Container Width Picker
interface ContainerWidthPickerProps {
  value: ContainerWidth;
  onChange: (value: ContainerWidth) => void;
}

const containerWidthOptions: { id: ContainerWidth; label: string; width: string; preview: string }[] = [
  { id: 'narrow', label: 'Narrow', width: '1024px', preview: 'w-16' },
  { id: 'default', label: 'Default', width: '1280px', preview: 'w-20' },
  { id: 'wide', label: 'Wide', width: '1440px', preview: 'w-24' },
  { id: 'full', label: 'Full Width', width: '100%', preview: 'w-full' },
];

export function ContainerWidthPicker({ value, onChange }: ContainerWidthPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Container Width</label>
      <div className="grid grid-cols-4 gap-3">
        {containerWidthOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              value === option.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border'
            )}
          >
            <div className="w-full h-8 bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
              <div className={cn('h-6 bg-primary/60 rounded', option.preview)} />
            </div>
            <span className="text-xs font-medium">{option.label}</span>
            <span className="text-[10px] text-muted-foreground">{option.width}</span>
            {value === option.id && (
              <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Homepage Layout Picker
interface HomepageLayoutPickerProps {
  value: HomepageLayout;
  onChange: (value: HomepageLayout) => void;
}

const homepageLayoutOptions: { id: HomepageLayout; label: string; description: string }[] = [
  { id: 'hero-grid', label: 'Hero + Grid', description: 'Full-width hero with product grid below' },
  { id: 'carousel', label: 'Carousel', description: 'Sliding hero with featured products carousel' },
  { id: 'minimal', label: 'Minimal', description: 'Clean, text-focused with minimal images' },
  { id: 'magazine', label: 'Magazine', description: 'Editorial style with mixed content blocks' },
];

export function HomepageLayoutPicker({ value, onChange }: HomepageLayoutPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Homepage Layout</label>
      <div className="grid grid-cols-2 gap-3">
        {homepageLayoutOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left',
              value === option.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border'
            )}
          >
            {/* Thumbnail Preview */}
            <div className="w-full h-20 bg-muted rounded mb-3 overflow-hidden">
              {option.id === 'hero-grid' && (
                <div className="h-full flex flex-col">
                  <div className="h-8 bg-primary/60" />
                  <div className="flex-1 p-1 grid grid-cols-3 gap-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-border rounded" />
                    ))}
                  </div>
                </div>
              )}
              {option.id === 'carousel' && (
                <div className="h-full flex flex-col">
                  <div className="h-10 bg-primary/60 flex items-center justify-center gap-1">
                    <div className="w-1 h-1 bg-card rounded-full" />
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                  </div>
                  <div className="flex-1 p-1 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 bg-border rounded" />
                    ))}
                  </div>
                </div>
              )}
              {option.id === 'minimal' && (
                <div className="h-full p-2 flex flex-col items-center justify-center gap-1">
                  <div className="w-16 h-2 bg-border rounded" />
                  <div className="w-12 h-1 bg-border rounded" />
                  <div className="w-10 h-3 bg-primary/60 rounded mt-1" />
                </div>
              )}
              {option.id === 'magazine' && (
                <div className="h-full p-1 grid grid-cols-3 gap-1">
                  <div className="col-span-2 row-span-2 bg-primary/60 rounded" />
                  <div className="bg-border rounded" />
                  <div className="bg-border rounded" />
                </div>
              )}
            </div>
            <span className="font-medium text-sm">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
            {value === option.id && (
              <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Header Layout Picker
interface HeaderLayoutPickerProps {
  value: HeaderLayout;
  height: HeaderHeight;
  onChange: (value: HeaderLayout) => void;
  onHeightChange: (value: HeaderHeight) => void;
}

const headerLayoutOptions: { id: HeaderLayout; label: string }[] = [
  { id: 'logo-left', label: 'Logo Left' },
  { id: 'logo-center', label: 'Logo Center' },
  { id: 'mega-menu', label: 'Mega Menu' },
];

const headerHeightOptions: { id: HeaderHeight; label: string; height: string }[] = [
  { id: 'compact', label: 'Compact', height: '56px' },
  { id: 'default', label: 'Default', height: '72px' },
  { id: 'tall', label: 'Tall', height: '88px' },
];

export function HeaderLayoutPicker({ value, height, onChange, onHeightChange }: HeaderLayoutPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Header Layout</label>
        <div className="grid grid-cols-3 gap-3">
          {headerLayoutOptions.map((option) => (
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
              <div className="w-full h-8 bg-muted rounded mb-2 flex items-center px-2 gap-2">
                {option.id === 'logo-left' && (
                  <>
                    <div className="w-6 h-3 bg-primary/60 rounded" />
                    <div className="flex-1 flex gap-1 justify-end">
                      <div className="w-4 h-2 bg-border rounded" />
                      <div className="w-4 h-2 bg-border rounded" />
                      <div className="w-4 h-2 bg-border rounded" />
                    </div>
                  </>
                )}
                {option.id === 'logo-center' && (
                  <>
                    <div className="flex-1 flex gap-1">
                      <div className="w-4 h-2 bg-border rounded" />
                      <div className="w-4 h-2 bg-border rounded" />
                    </div>
                    <div className="w-6 h-3 bg-primary/60 rounded" />
                    <div className="flex-1 flex gap-1 justify-end">
                      <div className="w-4 h-2 bg-border rounded" />
                      <div className="w-4 h-2 bg-border rounded" />
                    </div>
                  </>
                )}
                {option.id === 'mega-menu' && (
                  <>
                    <div className="w-6 h-3 bg-primary/60 rounded" />
                    <div className="flex-1 flex gap-1">
                      <div className="w-4 h-2 bg-border rounded" />
                      <div className="w-4 h-2 bg-border rounded" />
                      <div className="w-4 h-2 bg-border rounded" />
                    </div>
                    <Menu className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
              </div>
              <span className="text-xs font-medium">{option.label}</span>
              {value === option.id && (
                <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Header Height</label>
        <div className="grid grid-cols-3 gap-3">
          {headerHeightOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onHeightChange(option.id)}
              className={cn(
                'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                height === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <span className="text-xs font-medium">{option.label}</span>
              <span className="text-[10px] text-muted-foreground">{option.height}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Footer Layout Picker
interface FooterLayoutPickerProps {
  value: FooterLayout;
  onChange: (value: FooterLayout) => void;
}

const footerLayoutOptions: { id: FooterLayout; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'multi-column', label: 'Multi-Column' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'centered', label: 'Centered' },
];

export function FooterLayoutPicker({ value, onChange }: FooterLayoutPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Footer Layout</label>
      <div className="grid grid-cols-4 gap-3">
        {footerLayoutOptions.map((option) => (
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
            <div className="w-full h-10 bg-muted rounded mb-2 overflow-hidden">
              {option.id === 'simple' && (
                <div className="h-full flex items-center justify-between px-2">
                  <div className="w-6 h-2 bg-border rounded" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-border rounded" />
                    <div className="w-2 h-2 bg-border rounded" />
                  </div>
                </div>
              )}
              {option.id === 'multi-column' && (
                <div className="h-full p-1 grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="h-1 bg-border rounded" />
                      <div className="h-0.5 bg-border rounded" />
                      <div className="h-0.5 bg-border rounded" />
                    </div>
                  ))}
                </div>
              )}
              {option.id === 'minimal' && (
                <div className="h-full flex items-center justify-center">
                  <div className="w-16 h-1 bg-border rounded" />
                </div>
              )}
              {option.id === 'centered' && (
                <div className="h-full flex flex-col items-center justify-center gap-1">
                  <div className="w-8 h-2 bg-border rounded" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-border rounded-full" />
                    <div className="w-2 h-2 bg-border rounded-full" />
                    <div className="w-2 h-2 bg-border rounded-full" />
                  </div>
                </div>
              )}
            </div>
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

// Product Grid Columns Picker
interface ProductGridColumnsPickerProps {
  mobile: 1 | 2;
  tablet: 2 | 3;
  desktop: 3 | 4 | 5;
  onChange: (device: 'mobile' | 'tablet' | 'desktop', value: number) => void;
}

export function ProductGridColumnsPicker({ mobile, tablet, desktop, onChange }: ProductGridColumnsPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Product Grid Columns</label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Mobile</label>
          <div className="flex gap-2">
            {[1, 2].map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => onChange('mobile', cols)}
                className={cn(
                  'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  mobile === cols
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-border'
                )}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Tablet</label>
          <div className="flex gap-2">
            {[2, 3].map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => onChange('tablet', cols)}
                className={cn(
                  'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  tablet === cols
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-border'
                )}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Desktop</label>
          <div className="flex gap-2">
            {[3, 4, 5].map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => onChange('desktop', cols)}
                className={cn(
                  'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  desktop === cols
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-border'
                )}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Detail Layout Picker
interface ProductDetailLayoutPickerProps {
  value: ProductDetailLayout;
  onChange: (value: ProductDetailLayout) => void;
}

const productDetailOptions: { id: ProductDetailLayout; label: string }[] = [
  { id: 'image-left', label: 'Image Left' },
  { id: 'image-right', label: 'Image Right' },
  { id: 'gallery-top', label: 'Gallery Top' },
  { id: 'split', label: 'Split View' },
];

export function ProductDetailLayoutPicker({ value, onChange }: ProductDetailLayoutPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Product Detail Layout</label>
      <div className="grid grid-cols-4 gap-3">
        {productDetailOptions.map((option) => (
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
            <div className="w-full h-12 bg-muted rounded mb-2 overflow-hidden p-1">
              {option.id === 'image-left' && (
                <div className="h-full flex gap-1">
                  <div className="w-1/2 bg-primary/40 rounded" />
                  <div className="w-1/2 flex flex-col gap-0.5">
                    <div className="h-2 bg-border rounded" />
                    <div className="h-1 bg-muted rounded" />
                    <div className="flex-1" />
                    <div className="h-2 bg-primary/60 rounded" />
                  </div>
                </div>
              )}
              {option.id === 'image-right' && (
                <div className="h-full flex gap-1">
                  <div className="w-1/2 flex flex-col gap-0.5">
                    <div className="h-2 bg-border rounded" />
                    <div className="h-1 bg-muted rounded" />
                    <div className="flex-1" />
                    <div className="h-2 bg-primary/60 rounded" />
                  </div>
                  <div className="w-1/2 bg-primary/40 rounded" />
                </div>
              )}
              {option.id === 'gallery-top' && (
                <div className="h-full flex flex-col gap-1">
                  <div className="flex-1 bg-primary/40 rounded" />
                  <div className="h-3 flex gap-0.5">
                    <div className="flex-1 bg-border rounded" />
                    <div className="flex-1 bg-muted rounded" />
                    <div className="flex-1 bg-primary/60 rounded" />
                  </div>
                </div>
              )}
              {option.id === 'split' && (
                <div className="h-full flex gap-0.5">
                  <div className="w-1/2 bg-primary/40 rounded" />
                  <div className="w-1/2 flex flex-col gap-0.5 justify-center">
                    <div className="h-1 bg-border rounded" />
                    <div className="h-1 bg-muted rounded" />
                    <div className="h-2 bg-primary/60 rounded mt-1" />
                  </div>
                </div>
              )}
            </div>
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

// Category Layout Picker
interface CategoryLayoutPickerProps {
  value: CategoryLayout;
  showBanner: boolean;
  onChange: (value: CategoryLayout) => void;
  onBannerChange: (show: boolean) => void;
}

const categoryLayoutOptions: { id: CategoryLayout; label: string }[] = [
  { id: 'sidebar-left', label: 'Sidebar Left' },
  { id: 'sidebar-right', label: 'Sidebar Right' },
  { id: 'no-sidebar', label: 'No Sidebar' },
];

export function CategoryLayoutPicker({ value, showBanner, onChange, onBannerChange }: CategoryLayoutPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Category Page Layout</label>
        <div className="grid grid-cols-3 gap-3">
          {categoryLayoutOptions.map((option) => (
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
              <div className="w-full h-10 bg-muted rounded mb-2 overflow-hidden p-1 flex gap-1">
                {option.id === 'sidebar-left' && (
                  <>
                    <div className="w-1/4 bg-border rounded" />
                    <div className="flex-1 grid grid-cols-3 gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-muted rounded" />
                      ))}
                    </div>
                  </>
                )}
                {option.id === 'sidebar-right' && (
                  <>
                    <div className="flex-1 grid grid-cols-3 gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-muted rounded" />
                      ))}
                    </div>
                    <div className="w-1/4 bg-border rounded" />
                  </>
                )}
                {option.id === 'no-sidebar' && (
                  <div className="w-full grid grid-cols-4 gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="bg-muted rounded" />
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{option.label}</span>
              {value === option.id && (
                <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showBanner}
          onChange={(e) => onBannerChange(e.target.checked)}
          className="rounded border-border text-primary focus:ring-purple-500"
        />
        <span className="text-sm">Show category banner image</span>
      </label>
    </div>
  );
}

// Content Padding Picker
interface ContentPaddingPickerProps {
  value: ContentPadding;
  onChange: (value: ContentPadding) => void;
}

const contentPaddingOptions: { id: ContentPadding; label: string; padding: string }[] = [
  { id: 'compact', label: 'Compact', padding: '16px' },
  { id: 'default', label: 'Default', padding: '24px' },
  { id: 'spacious', label: 'Spacious', padding: '32px' },
];

export function ContentPaddingPicker({ value, onChange }: ContentPaddingPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Content Padding</label>
      <div className="grid grid-cols-3 gap-3">
        {contentPaddingOptions.map((option) => (
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
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.padding}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Product List Layout Picker
interface ProductListLayoutPickerProps {
  value: ProductListLayout;
  onChange: (value: ProductListLayout) => void;
}

const productListLayoutOptions: { id: ProductListLayout; label: string }[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' },
  { id: 'masonry', label: 'Masonry' },
];

export function ProductListLayoutPicker({ value, onChange }: ProductListLayoutPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Product List Style</label>
      <div className="grid grid-cols-3 gap-3">
        {productListLayoutOptions.map((option) => (
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
            <div className="w-full h-10 bg-muted rounded mb-2 overflow-hidden p-1">
              {option.id === 'grid' && (
                <div className="h-full grid grid-cols-3 gap-0.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-border rounded" />
                  ))}
                </div>
              )}
              {option.id === 'list' && (
                <div className="h-full flex flex-col gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 flex gap-1">
                      <div className="w-1/4 bg-border rounded" />
                      <div className="flex-1 flex flex-col justify-center gap-0.5">
                        <div className="h-1 w-2/3 bg-border rounded" />
                        <div className="h-0.5 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {option.id === 'masonry' && (
                <div className="h-full grid grid-cols-3 gap-0.5">
                  <div className="bg-border rounded row-span-2" />
                  <div className="bg-border rounded" />
                  <div className="bg-border rounded row-span-2" />
                  <div className="bg-border rounded" />
                </div>
              )}
            </div>
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
