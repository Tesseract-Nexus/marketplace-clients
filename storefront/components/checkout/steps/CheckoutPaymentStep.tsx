'use client';

import { CreditCard, Shield, ChevronRight, ChevronLeft, Globe, Ticket, Gift, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCheckout } from '@/context/CheckoutContext';
import { useLocalization } from '@/context/TenantContext';
import { CouponInput } from '@/components/checkout/CouponInput';
import { GiftCardInput } from '@/components/checkout/GiftCardInput';
import { LoyaltyPointsRedemption } from '@/components/checkout/LoyaltyPointsRedemption';
import { PaymentMethodSelector, EnabledPaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import { useCartStore } from '@/store/cart';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';

interface CheckoutPaymentStepProps {
  gatewayType: 'stripe' | 'razorpay';
  orderSubtotal: number;
  shipping: number;
  tax: number;
  // New props for dynamic payment methods
  enabledPaymentMethods?: EnabledPaymentMethod[];
  selectedPaymentMethod?: string | null;
  onPaymentMethodSelect?: (code: string) => void;
  isLoadingPaymentMethods?: boolean;
}

export function CheckoutPaymentStep({
  gatewayType,
  orderSubtotal,
  shipping,
  tax,
  enabledPaymentMethods = [],
  selectedPaymentMethod = null,
  onPaymentMethodSelect,
  isLoadingPaymentMethods = false,
}: CheckoutPaymentStepProps) {
  const {
    billingAddressSameAsShipping,
    setBillingAddressSameAsShipping,
    loyaltyPointsApplied,
    loyaltyDiscount,
    setLoyaltyPoints,
    nextStep,
    prevStep,
    setError,
    error,
    isProcessing,
  } = useCheckout();

  const localization = useLocalization();

  const {
    appliedCoupon,
    setAppliedCoupon,
    clearAppliedCoupon,
    appliedGiftCards,
    addGiftCard,
    removeGiftCard,
    updateGiftCardAmount,
    getGiftCardTotal,
  } = useCartStore();

  const discount = appliedCoupon?.discountAmount ?? 0;
  const giftCardDiscount = getGiftCardTotal();
  const orderTotal = Math.max(0, orderSubtotal + shipping + tax - discount - loyaltyDiscount - giftCardDiscount);

  // Validate and proceed
  const handleContinue = () => {
    setError(null);

    // If dynamic payment methods are available, ensure one is selected
    if (enabledPaymentMethods.length > 0 && !selectedPaymentMethod) {
      setError('Please select a payment method to continue.');
      return;
    }

    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-xl border p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-tenant-primary/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-tenant-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            <TranslatedUIText text="Payment" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <TranslatedUIText text="Apply discounts and review payment method" />
          </p>
        </div>
      </div>

      {/* Payment Method Selection */}
      {enabledPaymentMethods.length > 0 || isLoadingPaymentMethods ? (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <TranslatedUIText text="Select Payment Method" />
          </h3>
          <PaymentMethodSelector
            methods={enabledPaymentMethods}
            selectedMethod={selectedPaymentMethod}
            onSelect={onPaymentMethodSelect || (() => {})}
            isLoading={isLoadingPaymentMethods}
            disabled={isProcessing}
            orderTotal={orderTotal}
            currency={localization.currency}
          />
          {/* Currency info */}
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <TranslatedUIText text="Currency:" /> {localization.currency}
          </div>
        </div>
      ) : (
        /* Fallback: Legacy Payment Gateway Info (when no dynamic methods available) */
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-muted/30 to-transparent mb-6">
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Gateway Logo */}
              <div className={cn(
                "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-md",
                gatewayType === 'razorpay'
                  ? "bg-gradient-to-br from-blue-500 to-blue-700"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600"
              )}>
                {gatewayType === 'razorpay' ? (
                  <span className="text-white font-bold text-xl">R</span>
                ) : (
                  <span className="text-white font-bold text-xl">S</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-lg">
                    {gatewayType === 'razorpay' ? 'Razorpay' : 'Stripe'} <TranslatedUIText text="Checkout" />
                  </h4>
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    <Shield className="h-3 w-3" />
                    <TranslatedUIText text="Secure" />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  <TranslatedUIText text="You'll be redirected to complete payment securely after placing your order." />
                </p>

                {/* Supported Payment Methods */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-background rounded border flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Cards
                  </span>
                  {gatewayType === 'razorpay' && (
                    <>
                      <span className="text-xs px-2 py-1 bg-background rounded border">UPI</span>
                      <span className="text-xs px-2 py-1 bg-background rounded border">Netbanking</span>
                      <span className="text-xs px-2 py-1 bg-background rounded border">Wallets</span>
                    </>
                  )}
                  {gatewayType === 'stripe' && (
                    <>
                      <span className="text-xs px-2 py-1 bg-background rounded border">Apple Pay</span>
                      <span className="text-xs px-2 py-1 bg-background rounded border">Google Pay</span>
                      <span className="text-xs px-2 py-1 bg-background rounded border">Link</span>
                    </>
                  )}
                </div>

                {/* Currency info */}
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <TranslatedUIText text="Currency:" /> {localization.currency}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Address Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-lg border mb-6">
        <Checkbox
          id="billingAddress"
          checked={billingAddressSameAsShipping}
          onCheckedChange={(checked) => setBillingAddressSameAsShipping(checked === true)}
        />
        <Label htmlFor="billingAddress" className="cursor-pointer flex-1">
          <span className="font-medium">
            <TranslatedUIText text="Billing address same as shipping" />
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            <TranslatedUIText text="Use my shipping address for billing" />
          </p>
        </Label>
      </div>

      {/* Discounts Section */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          <TranslatedUIText text="Discounts & Rewards" />
        </h3>

        {/* Coupon Code */}
        <div className="p-4 rounded-lg border">
          <CouponInput
            orderValue={orderSubtotal}
            appliedCoupon={appliedCoupon}
            onApply={setAppliedCoupon}
            onRemove={clearAppliedCoupon}
            disabled={isProcessing}
          />
        </div>

        {/* Gift Card */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-sm">
              <TranslatedUIText text="Gift Card" />
            </span>
          </div>
          <GiftCardInput
            orderTotal={orderTotal + giftCardDiscount} // Add back gift card to show available amount
            appliedGiftCards={appliedGiftCards}
            onApply={addGiftCard}
            onRemove={removeGiftCard}
            onUpdateAmount={updateGiftCardAmount}
            disabled={isProcessing}
          />
        </div>

        {/* Loyalty Points */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-sm">
              <TranslatedUIText text="Loyalty Points" />
            </span>
          </div>
          <LoyaltyPointsRedemption
            orderSubtotal={orderSubtotal}
            appliedPoints={loyaltyPointsApplied}
            onApplyPoints={(points, dollarValue) => {
              setLoyaltyPoints(points, dollarValue);
            }}
            onRemovePoints={() => {
              setLoyaltyPoints(0, 0);
            }}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Applied Discounts Summary */}
      {(discount > 0 || loyaltyDiscount > 0 || giftCardDiscount > 0) && (
        <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
            <TranslatedUIText text="Applied Discounts" />
          </h4>
          <div className="space-y-1 text-sm">
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  <TranslatedUIText text="Coupon" /> ({appliedCoupon?.coupon.code})
                </span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-yellow-600">
                <span>
                  <TranslatedUIText text="Loyalty Points" /> ({loyaltyPointsApplied.toLocaleString()})
                </span>
                <span>-${loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            {giftCardDiscount > 0 && (
              <div className="flex justify-between text-purple-600">
                <span>
                  <TranslatedUIText text={appliedGiftCards.length > 1 ? 'Gift Cards' : 'Gift Card'} />
                </span>
                <span>-${giftCardDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-800 flex justify-between font-medium text-green-700 dark:text-green-400">
              <span><TranslatedUIText text="Total Savings" /></span>
              <span>-${(discount + loyaltyDiscount + giftCardDiscount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6 pt-6 border-t">
        <Button
          variant="ghost"
          size="lg"
          onClick={prevStep}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <TranslatedUIText text="Back" />
        </Button>
        <Button
          variant="tenant-primary"
          size="lg"
          onClick={handleContinue}
          className="min-w-[200px]"
        >
          <TranslatedUIText text="Review Order" />
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

export default CheckoutPaymentStep;
