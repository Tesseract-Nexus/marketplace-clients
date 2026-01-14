'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Percent,
  Gift,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Copy,
  Sparkles,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant, useMarketingConfig } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface ProductPromotion {
  id: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y' | 'BUNDLE' | 'TIERED';
  title: string;
  description: string;
  discountValue?: number;
  minimumQuantity?: number;
  freeQuantity?: number;
  code?: string;
  expiresAt?: string;
  tierThresholds?: TierThreshold[];
}

interface TierThreshold {
  minSpend: number;
  discountPercent: number;
}

interface ProductPromotionProps {
  productId: string;
  productPrice: number;
  className?: string;
}

// ========================================
// Main Component
// ========================================

export function ProductPromotion({ productId, productPrice, className }: ProductPromotionProps) {
  const { tenant } = useTenant();
  const marketingConfig = useMarketingConfig();
  const [promotions, setPromotions] = useState<ProductPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Don't render if product promotions are disabled
  if (!marketingConfig.enableProductPromotions) {
    return null;
  }

  useEffect(() => {
    const fetchPromotions = async () => {
      if (!tenant || !productId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/${productId}/promotions`, {
          headers: {
            'X-Tenant-ID': tenant.id,
            'X-Storefront-ID': tenant.storefrontId,
          },
        });

        if (!response.ok) {
          // Use sample promotions if endpoint not available
          setPromotions(getSamplePromotions(productPrice));
          return;
        }

        const data = await response.json();
        setPromotions(data.promotions || data || []);
      } catch (error) {
        console.error('Failed to fetch product promotions:', error);
        setPromotions(getSamplePromotions(productPrice));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, [tenant, productId, productPrice]);

  if (isLoading || promotions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence>
        {promotions.map((promo, index) => (
          <PromotionCard key={promo.id} promotion={promo} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ========================================
// Promotion Card
// ========================================

function PromotionCard({ promotion, index }: { promotion: ProductPromotion; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (promotion.code) {
      navigator.clipboard.writeText(promotion.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPromoConfig = () => {
    switch (promotion.type) {
      case 'PERCENTAGE':
        return {
          icon: Percent,
          gradient: 'from-rose-500 to-pink-500',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
        };
      case 'FIXED_AMOUNT':
        return {
          icon: TrendingDown,
          gradient: 'from-green-500 to-emerald-500',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'FREE_SHIPPING':
        return {
          icon: ShoppingBag,
          gradient: 'from-blue-500 to-cyan-500',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'BUY_X_GET_Y':
        return {
          icon: Gift,
          gradient: 'from-purple-500 to-violet-500',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
        };
      case 'BUNDLE':
        return {
          icon: Sparkles,
          gradient: 'from-orange-500 to-amber-500',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
        };
      case 'TIERED':
        return {
          icon: Tag,
          gradient: 'from-indigo-500 to-blue-500',
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
        };
      default:
        return {
          icon: Tag,
          gradient: 'from-gray-500 to-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
        };
    }
  };

  const config = getPromoConfig();
  const Icon = config.icon;

  const hasExpiry = promotion.expiresAt && new Date(promotion.expiresAt) > new Date();
  const hoursUntilExpiry = hasExpiry
    ? Math.ceil((new Date(promotion.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-xl border p-4 transition-all hover:shadow-md',
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          `bg-gradient-to-br ${config.gradient}`
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-gray-900">{promotion.title}</h4>
              <p className="text-sm text-gray-600 mt-0.5">{promotion.description}</p>
            </div>

            {/* Expiry Badge */}
            {hoursUntilExpiry !== null && hoursUntilExpiry <= 24 && (
              <Badge variant="outline" className="shrink-0 border-orange-300 text-orange-700 bg-orange-50">
                <Clock className="h-3 w-3 mr-1" />
                {hoursUntilExpiry <= 1 ? 'Ending soon' : `${hoursUntilExpiry}h left`}
              </Badge>
            )}
          </div>

          {/* Tiered Discounts */}
          {promotion.type === 'TIERED' && promotion.tierThresholds && (
            <div className="mt-3 flex flex-wrap gap-2">
              {promotion.tierThresholds.map((tier, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-gray-200"
                >
                  Spend ${tier.minSpend}+ = {tier.discountPercent}% OFF
                </span>
              ))}
            </div>
          )}

          {/* Coupon Code */}
          {promotion.code && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed text-sm font-mono font-semibold transition-all',
                  copied
                    ? 'border-green-500 bg-green-100 text-green-700'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {promotion.code}
                  </>
                )}
              </button>
              <span className="text-xs text-gray-500">Use at checkout</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Sample Promotions (fallback)
// ========================================

function getSamplePromotions(productPrice: number): ProductPromotion[] {
  const promotions: ProductPromotion[] = [];

  // Show BOGO if price is reasonable
  if (productPrice > 10 && productPrice < 100) {
    promotions.push({
      id: 'bogo-1',
      type: 'BUY_X_GET_Y',
      title: 'Buy 2 Get 1 Free',
      description: 'Add 3 to cart, pay for 2!',
      minimumQuantity: 2,
      freeQuantity: 1,
    });
  }

  // Tiered discount
  promotions.push({
    id: 'tiered-1',
    type: 'TIERED',
    title: 'Spend More, Save More',
    description: 'Bigger cart = Bigger savings',
    tierThresholds: [
      { minSpend: 50, discountPercent: 10 },
      { minSpend: 100, discountPercent: 15 },
      { minSpend: 200, discountPercent: 20 },
    ],
  });

  // Free shipping
  if (productPrice < 50) {
    promotions.push({
      id: 'freeship-1',
      type: 'FREE_SHIPPING',
      title: 'Free Shipping',
      description: `Add $${(50 - productPrice).toFixed(0)} more for free shipping`,
      code: 'FREESHIP50',
    });
  }

  return promotions;
}
