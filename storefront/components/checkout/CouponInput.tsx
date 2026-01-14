'use client';

import { useState, useEffect } from 'react';
import { Tag, X, Check, Loader2, AlertCircle, Percent, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenant } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useTranslatedText } from '@/hooks/useTranslatedText';
import { validateCoupon, type Coupon, type AppliedCoupon, formatDiscount } from '@/lib/api/coupons';

interface CouponInputProps {
  orderValue: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function CouponInput({
  orderValue,
  appliedCoupon,
  onApply,
  onRemove,
  disabled = false,
}: CouponInputProps) {
  const { tenant } = useTenant();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Translated strings
  const { translatedText: placeholderText } = useTranslatedText('Enter promo code', { context: 'checkout' });
  const { translatedText: storeNotLoadedText } = useTranslatedText('Store configuration not loaded', { context: 'error' });
  const { translatedText: invalidCouponText } = useTranslatedText('Invalid coupon code', { context: 'error' });
  const { translatedText: failedValidateText } = useTranslatedText('Failed to validate coupon', { context: 'error' });
  const { translatedText: applyText } = useTranslatedText('Apply', { context: 'button' });

  useEffect(() => {
    console.log('[CouponInput] MOUNTED');
    return () => console.log('[CouponInput] UNMOUNTED');
  }, []);

  console.log('[CouponInput] Render', { isExpanded, code, disabled, appliedCoupon: !!appliedCoupon });

  const handleValidate = async () => {
    console.log('[CouponInput] handleValidate START', { code, tenantId: tenant?.id, orderValue });

    if (!code.trim()) {
      console.log('[CouponInput] No code entered');
      return;
    }

    if (!tenant) {
      console.error('[CouponInput] No tenant available');
      setError(storeNotLoadedText);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[CouponInput] Calling validateCoupon API...', { 
        tenantId: tenant.id, 
        storefrontId: tenant.storefrontId,
        code: code.trim().toUpperCase(),
        orderValue
      });
      
      const response = await validateCoupon(tenant.id, tenant.storefrontId, {
        code: code.trim().toUpperCase(),
        orderValue,
      });
      
      console.log('[CouponInput] API response received:', response);

      if (response.valid && response.coupon && response.discountAmount) {
        console.log('[CouponInput] Coupon valid, calling onApply');
        onApply({
          coupon: response.coupon,
          discountAmount: response.discountAmount,
        });
        setCode('');
        setIsExpanded(false);
      } else {
        console.warn('[CouponInput] Coupon invalid:', response.message);
        setError(response.message || invalidCouponText);
      }
    } catch (err) {
      console.error('[CouponInput] API error caught:', err);
      setError(err instanceof Error ? err.message : failedValidateText);
    } finally {
      setIsLoading(false);
      console.log('[CouponInput] handleValidate FINISHED');
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <DollarSign className="h-4 w-4" />;
      case 'free_shipping':
        return <Truck className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  // Show applied coupon
  if (appliedCoupon) {
    return (
      <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-green-800 dark:text-green-200">
                  {appliedCoupon.coupon.code}
                </span>
                {formatDiscount(appliedCoupon.coupon) && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    - {formatDiscount(appliedCoupon.coupon)}
                  </span>
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                <TranslatedUIText text="You save" /> ${appliedCoupon.discountAmount.toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => {
            console.log('[CouponInput] Expand button clicked');
            setIsExpanded(true);
          }}
          disabled={disabled}
          className="flex items-center gap-2 text-sm text-tenant-primary hover:underline disabled:opacity-50"
        >
          <Tag className="h-4 w-4" />
          <TranslatedUIText text="Have a promo code?" />
        </button>
      )}

      {/* Input form - Removed AnimatePresence for debugging */}
      {isExpanded && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholderText}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('[CouponInput] Enter key pressed');
                    handleValidate();
                  }
                }}
                disabled={disabled || isLoading}
                className="pl-9 uppercase"
              />
            </div>
            {/* Using standard button for debugging to ensure no component issues */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Safety
                console.log('[CouponInput] Native apply button clicked');
                handleValidate();
              }}
              disabled={disabled || isLoading || !code.trim()}
              className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 text-sm font-medium"
            >
              {isLoading ? '...' : applyText}
            </button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsExpanded(false);
                setCode('');
                setError(null);
              }}
              disabled={isLoading}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
