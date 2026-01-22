'use client';

import React from 'react';
import {
  Megaphone,
  Gift,
  Star,
  Users,
  ShoppingCart,
  Mail,
  Percent,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// TYPES
// =============================================================================

export interface MarketingConfig {
  enablePromoBanners?: boolean;
  enableProductPromotions?: boolean;
  enablePersonalizedOffers?: boolean;
  enableReferralProgram?: boolean;
  enableLoyaltyProgram?: boolean;
  enableAbandonedCartRecovery?: boolean;
  enableRecentlyViewed?: boolean;
  enableProductRecommendations?: boolean;
  enableWishlistReminders?: boolean;
  enablePriceDropAlerts?: boolean;
  enableBackInStockAlerts?: boolean;
  enableFlashSales?: boolean;
}

interface MarketingEditorProps {
  config: MarketingConfig;
  onChange: (config: MarketingConfig) => void;
  disabled?: boolean;
}

// =============================================================================
// MARKETING FEATURE CARD
// =============================================================================

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  badge?: string;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  disabled,
  badge,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border rounded-lg transition-colors',
        enabled ? 'bg-primary/5 border-primary/30' : 'bg-background'
      )}
    >
      <div
        className={cn(
          'p-2.5 rounded-lg shrink-0',
          enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label className="font-medium">{title}</Label>
          {badge && (
            <span className="text-xs px-1.5 py-0.5 bg-warning-muted text-warning-foreground rounded">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

// =============================================================================
// MARKETING EDITOR
// =============================================================================

export function MarketingEditor({ config, onChange, disabled = false }: MarketingEditorProps) {
  const updateConfig = (updates: Partial<MarketingConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Promotions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Promotions & Banners
          </CardTitle>
          <CardDescription>
            Display promotional content to drive sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureCard
            icon={Megaphone}
            title="Promo Banners"
            description="Show promotional banners on homepage and product pages"
            enabled={config.enablePromoBanners !== false}
            onToggle={(checked) => updateConfig({ enablePromoBanners: checked })}
            disabled={disabled}
          />
          <FeatureCard
            icon={Percent}
            title="Product Promotions"
            description="Display sale badges and discounts on product cards"
            enabled={config.enableProductPromotions !== false}
            onToggle={(checked) => updateConfig({ enableProductPromotions: checked })}
            disabled={disabled}
          />
          <FeatureCard
            icon={Clock}
            title="Flash Sales"
            description="Time-limited deals with countdown timers"
            enabled={config.enableFlashSales ?? false}
            onToggle={(checked) => updateConfig({ enableFlashSales: checked })}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Personalization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Personalization
          </CardTitle>
          <CardDescription>
            Tailored experiences for each customer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureCard
            icon={Target}
            title="Personalized Offers"
            description="Show targeted offers based on browsing history"
            enabled={config.enablePersonalizedOffers ?? false}
            onToggle={(checked) => updateConfig({ enablePersonalizedOffers: checked })}
            disabled={disabled}
            badge="AI"
          />
          <FeatureCard
            icon={ShoppingCart}
            title="Product Recommendations"
            description="AI-powered product suggestions throughout the store"
            enabled={config.enableProductRecommendations !== false}
            onToggle={(checked) => updateConfig({ enableProductRecommendations: checked })}
            disabled={disabled}
            badge="AI"
          />
          <FeatureCard
            icon={Clock}
            title="Recently Viewed"
            description="Show products the customer has recently viewed"
            enabled={config.enableRecentlyViewed !== false}
            onToggle={(checked) => updateConfig({ enableRecentlyViewed: checked })}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Loyalty & Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4" />
            Loyalty & Referrals
          </CardTitle>
          <CardDescription>
            Reward customers and encourage referrals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureCard
            icon={Star}
            title="Loyalty Program"
            description="Points-based rewards for purchases and engagement"
            enabled={config.enableLoyaltyProgram ?? false}
            onToggle={(checked) => updateConfig({ enableLoyaltyProgram: checked })}
            disabled={disabled}
          />
          <FeatureCard
            icon={Users}
            title="Referral Program"
            description="Reward customers for referring friends"
            enabled={config.enableReferralProgram ?? false}
            onToggle={(checked) => updateConfig({ enableReferralProgram: checked })}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Recovery & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Recovery & Alerts
          </CardTitle>
          <CardDescription>
            Re-engage customers with timely notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureCard
            icon={ShoppingCart}
            title="Abandoned Cart Recovery"
            description="Send reminders for items left in cart"
            enabled={config.enableAbandonedCartRecovery ?? false}
            onToggle={(checked) => updateConfig({ enableAbandonedCartRecovery: checked })}
            disabled={disabled}
          />
          <FeatureCard
            icon={Gift}
            title="Wishlist Reminders"
            description="Notify customers about wishlist items on sale"
            enabled={config.enableWishlistReminders ?? false}
            onToggle={(checked) => updateConfig({ enableWishlistReminders: checked })}
            disabled={disabled}
          />
          <FeatureCard
            icon={Percent}
            title="Price Drop Alerts"
            description="Alert customers when watched items go on sale"
            enabled={config.enablePriceDropAlerts ?? false}
            onToggle={(checked) => updateConfig({ enablePriceDropAlerts: checked })}
            disabled={disabled}
          />
          <FeatureCard
            icon={Mail}
            title="Back in Stock Alerts"
            description="Notify customers when out-of-stock items return"
            enabled={config.enableBackInStockAlerts ?? false}
            onToggle={(checked) => updateConfig({ enableBackInStockAlerts: checked })}
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default MarketingEditor;
