'use client';

import React from 'react';
import {
  Smartphone,
  Menu,
  LayoutGrid,
  Fingerprint,
  Vibrate,
  ZoomIn,
  Home,
  ShoppingBag,
  Heart,
  User,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// TYPES
// =============================================================================

export interface MobileConfig {
  menuStyle?: 'slide' | 'fullscreen' | 'dropdown';
  showBottomNav?: boolean;
  bottomNavItems?: string[];
  headerStyle?: 'default' | 'compact' | 'minimal';
  stickyAddToCart?: boolean;
  touchFriendlyButtons?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  enableSwipeGestures?: boolean;
  enablePinchZoom?: boolean;
  hapticFeedback?: boolean;
  reducedMotion?: boolean;
  lowDataMode?: boolean;
}

interface MobileEditorProps {
  config: MobileConfig;
  onChange: (config: MobileConfig) => void;
  disabled?: boolean;
}

// =============================================================================
// BOTTOM NAV ITEMS
// =============================================================================

const BOTTOM_NAV_OPTIONS = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'search', label: 'Search', icon: Search },
  { value: 'categories', label: 'Categories', icon: LayoutGrid },
  { value: 'cart', label: 'Cart', icon: ShoppingBag },
  { value: 'wishlist', label: 'Wishlist', icon: Heart },
  { value: 'account', label: 'Account', icon: User },
];

// =============================================================================
// MOBILE PREVIEW
// =============================================================================

function MobilePreview({ config }: { config: MobileConfig }) {
  const bottomNavItems = config.bottomNavItems || ['home', 'search', 'categories', 'cart', 'account'];

  return (
    <div className="relative w-[280px] h-[560px] mx-auto">
      {/* Phone Frame */}
      <div className="absolute inset-0 border-[12px] border-foreground rounded-[36px] bg-background overflow-hidden">
        {/* Status Bar */}
        <div className="h-6 bg-muted flex items-center justify-between px-4">
          <span className="text-[10px] text-muted-foreground">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-border" />
            <div className="w-3 h-3 rounded-full bg-border" />
            <div className="w-3 h-3 rounded-full bg-border" />
          </div>
        </div>

        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-3 bg-background border-b',
            config.headerStyle === 'compact' ? 'h-10' : config.headerStyle === 'minimal' ? 'h-8' : 'h-12'
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="font-semibold text-sm">Store</span>
          <ShoppingBag className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 bg-muted p-2 space-y-2" style={{ height: config.showBottomNav !== false ? 'calc(100% - 6rem - 48px)' : 'calc(100% - 6rem)' }}>
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
          <div className="h-20 bg-muted rounded" />
        </div>

        {/* Sticky Add to Cart */}
        {config.stickyAddToCart !== false && (
          <div className="absolute bottom-16 left-0 right-0 px-3">
            <div
              className={cn(
                'bg-primary text-white text-center rounded-lg font-medium',
                config.buttonSize === 'lg' ? 'py-4 text-base' : config.buttonSize === 'sm' ? 'py-2 text-xs' : 'py-3 text-sm'
              )}
            >
              Add to Cart
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        {config.showBottomNav !== false && (
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-background border-t flex items-center justify-around px-2">
            {bottomNavItems.slice(0, 5).map((item) => {
              const option = BOTTOM_NAV_OPTIONS.find((o) => o.value === item);
              if (!option) return null;
              const Icon = option.icon;
              return (
                <div key={item} className="flex flex-col items-center gap-0.5">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{option.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground/80 rounded-full" />
    </div>
  );
}

// =============================================================================
// MOBILE EDITOR
// =============================================================================

export function MobileEditor({ config, onChange, disabled = false }: MobileEditorProps) {
  const updateConfig = (updates: Partial<MobileConfig>) => {
    onChange({ ...config, ...updates });
  };

  const toggleBottomNavItem = (item: string) => {
    const items = config.bottomNavItems || ['home', 'search', 'categories', 'cart', 'account'];
    if (items.includes(item)) {
      updateConfig({ bottomNavItems: items.filter((i) => i !== item) });
    } else if (items.length < 5) {
      updateConfig({ bottomNavItems: [...items, item] });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings */}
      <div className="space-y-6">
        {/* Menu Style */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Mobile Menu
            </CardTitle>
            <CardDescription>
              Configure the mobile navigation menu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Menu Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['slide', 'fullscreen', 'dropdown'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateConfig({ menuStyle: style })}
                    disabled={disabled}
                    className={cn(
                      'p-3 border rounded-lg text-center transition-colors',
                      (config.menuStyle || 'slide') === style
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50'
                    )}
                  >
                    <div className="font-medium capitalize">{style}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Header Style</Label>
              <Select
                value={config.headerStyle || 'default'}
                onValueChange={(value) => updateConfig({ headerStyle: value as MobileConfig['headerStyle'] })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (48px)</SelectItem>
                  <SelectItem value="compact">Compact (40px)</SelectItem>
                  <SelectItem value="minimal">Minimal (32px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Bottom Navigation
            </CardTitle>
            <CardDescription>
              Configure the bottom navigation bar (max 5 items)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Bottom Navigation</Label>
              <Switch
                checked={config.showBottomNav !== false}
                onCheckedChange={(checked) => updateConfig({ showBottomNav: checked })}
                disabled={disabled}
              />
            </div>

            {config.showBottomNav !== false && (
              <div className="space-y-2">
                <Label>Navigation Items</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BOTTOM_NAV_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = (config.bottomNavItems || ['home', 'search', 'categories', 'cart', 'account']).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleBottomNavItem(option.value)}
                        disabled={disabled}
                        className={cn(
                          'flex items-center gap-2 p-2 border rounded-lg transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Touch & Gestures */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              Touch & Gestures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sticky Add to Cart</Label>
                <p className="text-sm text-muted-foreground">Show add to cart button at bottom of product pages</p>
              </div>
              <Switch
                checked={config.stickyAddToCart !== false}
                onCheckedChange={(checked) => updateConfig({ stickyAddToCart: checked })}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Touch-Friendly Buttons</Label>
                <p className="text-sm text-muted-foreground">Larger touch targets for better accessibility</p>
              </div>
              <Switch
                checked={config.touchFriendlyButtons !== false}
                onCheckedChange={(checked) => updateConfig({ touchFriendlyButtons: checked })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Button Size</Label>
              <Select
                value={config.buttonSize || 'md'}
                onValueChange={(value) => updateConfig({ buttonSize: value as MobileConfig['buttonSize'] })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Swipe Gestures
                </Label>
                <p className="text-sm text-muted-foreground">Enable swipe to navigate</p>
              </div>
              <Switch
                checked={config.enableSwipeGestures !== false}
                onCheckedChange={(checked) => updateConfig({ enableSwipeGestures: checked })}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Pinch to Zoom</Label>
                <p className="text-sm text-muted-foreground">Enable pinch zoom on product images</p>
              </div>
              <Switch
                checked={config.enablePinchZoom !== false}
                onCheckedChange={(checked) => updateConfig({ enablePinchZoom: checked })}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accessibility & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Vibrate className="w-4 h-4" />
              Accessibility & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Haptic Feedback</Label>
                <p className="text-sm text-muted-foreground">Vibration on button taps</p>
              </div>
              <Switch
                checked={config.hapticFeedback}
                onCheckedChange={(checked) => updateConfig({ hapticFeedback: checked })}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">Respect user's motion preferences</p>
              </div>
              <Switch
                checked={config.reducedMotion !== false}
                onCheckedChange={(checked) => updateConfig({ reducedMotion: checked })}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Low Data Mode</Label>
                <p className="text-sm text-muted-foreground">Load smaller images on slow connections</p>
              </div>
              <Switch
                checked={config.lowDataMode}
                onCheckedChange={(checked) => updateConfig({ lowDataMode: checked })}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MobilePreview config={config} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MobileEditor;
