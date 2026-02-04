'use client';

import Image from 'next/image';
import { Check, Truck, CreditCard, User, Edit2, ChevronLeft, Loader2, AlertCircle, Globe, Lock, Trash2, Minus, Plus, Gift, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCheckout } from '@/context/CheckoutContext';
import { useLocalization, useFormatPrice, useCheckoutConfig } from '@/context/TenantContext';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { CartItem } from '@/types/storefront';
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';

interface CheckoutReviewStepProps {
  selectedItems: CartItem[];
  gatewayType: 'stripe' | 'razorpay';
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  loyaltyDiscount: number;
  giftCardDiscount: number;
  total: number;
  onPlaceOrder: () => void;
  onRetryPayment?: () => void;
  onRemoveItem?: (itemId: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  // Dynamic payment method info
  selectedPaymentMethodName?: string;
  selectedPaymentMethodProvider?: string;
}

export function CheckoutReviewStep({
  selectedItems,
  gatewayType,
  subtotal,
  shipping,
  tax,
  discount,
  loyaltyDiscount,
  giftCardDiscount,
  total,
  onPlaceOrder,
  onRetryPayment,
  onRemoveItem,
  onUpdateQuantity,
  selectedPaymentMethodName,
  selectedPaymentMethodProvider,
}: CheckoutReviewStepProps) {
  const {
    contactInfo,
    shippingAddress,
    selectedShippingMethod,
    termsAccepted,
    setTermsAccepted,
    orderNotes,
    setOrderNotes,
    isGiftOrder,
    setIsGiftOrder,
    giftMessage,
    setGiftMessage,
    goToStep,
    prevStep,
    isProcessing,
    error,
    pendingOrder,
  } = useCheckout();

  const localization = useLocalization();
  const formatPrice = useFormatPrice();
  const checkoutConfig = useCheckoutConfig();
  const { formatDisplayPrice, formatStorePrice, isConverted, displayCurrency, storeCurrency } = usePriceFormatting();

  // Get shipping method name
  const getShippingMethodName = (method: ShippingMethod | ShippingRate | null): string => {
    if (!method) return '';
    if ('name' in method) return method.name;
    if ('serviceDisplayName' in method) return `${method.carrierDisplayName} - ${method.serviceDisplayName}`;
    return '';
  };

  const handlePlaceOrder = () => {
    // Only check terms if the checkbox is shown
    if (checkoutConfig.showTermsCheckbox && !termsAccepted) return;
    onPlaceOrder();
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
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            <TranslatedUIText text="Review Your Order" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <TranslatedUIText text="Please review and confirm your order details" />
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">
          <TranslatedUIText text="Order Items" /> ({selectedItems.length})
        </h3>
        <div className="space-y-3">
          {selectedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                <Image
                  src={item.image || '/placeholder.svg'}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {/* Quantity controls */}
                  {onUpdateQuantity ? (
                    <div className="flex items-center gap-1 bg-background rounded border">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isProcessing}
                        className="p-1 hover:bg-muted rounded-l disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs px-2 min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isProcessing}
                        className="p-1 hover:bg-muted rounded-r disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-background rounded border">
                      <TranslatedUIText text="Qty:" /> {item.quantity}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatPrice(item.price)} <TranslatedUIText text="each" />
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-semibold text-tenant-primary">
                  {formatPrice(item.price * item.quantity)}
                </p>
                {/* Remove button */}
                {onRemoveItem && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isProcessing}
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {/* Contact Card */}
        <div className="relative rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-tenant-primary" />
              </div>
              <span className="font-medium text-sm">
                <TranslatedUIText text="Contact" />
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('contact')}
              className="h-7 text-xs text-tenant-primary hover:text-tenant-primary hover:bg-tenant-primary/10"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              <TranslatedUIText text="Edit" />
            </Button>
          </div>
          <div className="space-y-1 text-sm pl-10">
            <p className="font-medium">{contactInfo.firstName} {contactInfo.lastName}</p>
            <p className="text-muted-foreground truncate">{contactInfo.email}</p>
            {contactInfo.phone && (
              <p className="text-muted-foreground">{contactInfo.phone}</p>
            )}
          </div>
        </div>

        {/* Shipping Card */}
        <div className="relative rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-tenant-primary" />
              </div>
              <span className="font-medium text-sm">
                <TranslatedUIText text="Ship to" />
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('shipping')}
              className="h-7 text-xs text-tenant-primary hover:text-tenant-primary hover:bg-tenant-primary/10"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              <TranslatedUIText text="Edit" />
            </Button>
          </div>
          <div className="space-y-1 text-sm pl-10">
            <p className="text-muted-foreground truncate">{shippingAddress.addressLine1}</p>
            <p className="text-muted-foreground">
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
            </p>
            {selectedShippingMethod && (
              <p className="text-xs text-tenant-primary font-medium mt-2">
                {getShippingMethodName(selectedShippingMethod)}
              </p>
            )}
          </div>
        </div>

        {/* Payment Card */}
        <div className="relative rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-tenant-primary" />
              </div>
              <span className="font-medium text-sm">
                <TranslatedUIText text="Payment" />
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('shipping')}
              className="h-7 text-xs text-tenant-primary hover:text-tenant-primary hover:bg-tenant-primary/10"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              <TranslatedUIText text="Edit" />
            </Button>
          </div>
          <div className="space-y-2 text-sm pl-10">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold",
                (selectedPaymentMethodProvider === 'Razorpay' || gatewayType === 'razorpay') ? "bg-blue-600" : "bg-indigo-600"
              )}>
                {(selectedPaymentMethodProvider === 'Razorpay' || gatewayType === 'razorpay') ? 'R' :
                 selectedPaymentMethodProvider === 'PayPal' ? 'P' :
                 selectedPaymentMethodProvider === 'Afterpay' ? 'A' :
                 selectedPaymentMethodProvider === 'Zip' ? 'Z' : 'S'}
              </div>
              <span className="font-medium">
                {selectedPaymentMethodName || (gatewayType === 'razorpay' ? 'Razorpay' : 'Stripe')}
              </span>
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {localization.currency}
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-xl border p-4 mb-6">
        <h3 className="font-semibold mb-3">
          <TranslatedUIText text="Order Summary" />
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground"><TranslatedUIText text="Subtotal" /></span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              <TranslatedUIText text="Shipping" />
              {selectedShippingMethod && (
                <span className="text-xs ml-1">({getShippingMethodName(selectedShippingMethod)})</span>
              )}
            </span>
            <span>{shipping === 0 ? <TranslatedUIText text="FREE" /> : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground"><TranslatedUIText text="Tax" /></span>
            <span>{formatPrice(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span><TranslatedUIText text="Coupon Discount" /></span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-yellow-600">
              <span><TranslatedUIText text="Loyalty Points" /></span>
              <span>-{formatPrice(loyaltyDiscount)}</span>
            </div>
          )}
          {giftCardDiscount > 0 && (
            <div className="flex justify-between text-purple-600">
              <span><TranslatedUIText text="Gift Card" /></span>
              <span>-{formatPrice(giftCardDiscount)}</span>
            </div>
          )}
          <div className="pt-3 mt-3 border-t flex justify-between font-bold text-lg">
            <span><TranslatedUIText text="Total" /></span>
            <div className="text-right">
              {isConverted ? (
                <>
                  <span className="block">{formatDisplayPrice(total)}</span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    ({formatStorePrice(total)} {storeCurrency})
                  </span>
                </>
              ) : (
                <span>{formatPrice(total)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {checkoutConfig.showOrderNotes && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="orderNotes" className="font-medium">
              <TranslatedUIText text="Order Notes" />
            </Label>
            <span className="text-xs text-muted-foreground">
              (<TranslatedUIText text="optional" />)
            </span>
          </div>
          <Textarea
            id="orderNotes"
            placeholder="Add any special instructions for your order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isProcessing}
          />
        </div>
      )}

      {/* Gift Options */}
      {checkoutConfig.showGiftOptions && (
        <div className="mb-6 p-4 rounded-lg border">
          <div className="flex items-start gap-3">
            <Checkbox
              id="isGiftOrder"
              checked={isGiftOrder}
              onCheckedChange={(checked) => setIsGiftOrder(checked === true)}
              disabled={isProcessing}
            />
            <div className="flex-1">
              <Label htmlFor="isGiftOrder" className="flex items-center gap-2 cursor-pointer">
                <Gift className="h-4 w-4 text-tenant-primary" />
                <span className="font-medium">
                  <TranslatedUIText text="This is a gift" />
                </span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                <TranslatedUIText text="Add a gift message and exclude prices from the packing slip" />
              </p>
            </div>
          </div>
          {isGiftOrder && (
            <div className="mt-4 pl-6">
              <Label htmlFor="giftMessage" className="text-sm font-medium mb-2 block">
                <TranslatedUIText text="Gift Message" />
              </Label>
              <Textarea
                id="giftMessage"
                placeholder="Enter your gift message here..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isProcessing}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {giftMessage.length}/500 <TranslatedUIText text="characters" />
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trust Badges */}
      {checkoutConfig.showTrustBadges && checkoutConfig.trustBadges && checkoutConfig.trustBadges.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 rounded-lg border bg-muted/30 mb-6">
          {checkoutConfig.trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payment Icons */}
      {checkoutConfig.showPaymentIcons && checkoutConfig.paymentIconsUrls && checkoutConfig.paymentIconsUrls.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-lg border bg-muted/30 mb-6">
          <span className="text-xs text-muted-foreground mr-2">
            <TranslatedUIText text="We accept:" />
          </span>
          {checkoutConfig.paymentIconsUrls.map((iconUrl, index) => (
            <Image
              key={index}
              src={iconUrl}
              alt="Payment method"
              width={40}
              height={24}
              className="object-contain"
            />
          ))}
        </div>
      )}

      {/* Terms and Conditions */}
      {checkoutConfig.showTermsCheckbox && (
        <div className="flex items-start gap-3 p-4 rounded-lg border mb-6">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            required
          />
          <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
            {checkoutConfig.termsText ? (
              checkoutConfig.termsLink ? (
                <>
                  <TranslatedUIText text={checkoutConfig.termsText} />{' '}
                  <a
                    href={checkoutConfig.termsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tenant-primary hover:underline"
                  >
                    <TranslatedUIText text="View Terms" />
                  </a>
                </>
              ) : (
                <TranslatedUIText text={checkoutConfig.termsText} />
              )
            ) : (
              <TranslatedUIText text="I agree to the terms and conditions and understand that all sales are final." />
            )}
            <span className="text-red-500 ml-1">*</span>
          </Label>
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium"><TranslatedUIText text="Payment Issue" /></p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
          {pendingOrder && onRetryPayment && (
            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
              <p className="text-sm text-muted-foreground mb-3">
                <TranslatedUIText text="Your order" /> #{pendingOrder.orderNumber} <TranslatedUIText text="has been created. You can retry payment." />
              </p>
              <Button
                onClick={onRetryPayment}
                disabled={isProcessing}
                className="btn-tenant-primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <TranslatedUIText text="Processing..." />
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    <TranslatedUIText text="Retry Payment" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="ghost"
          size="lg"
          onClick={prevStep}
          disabled={isProcessing}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <TranslatedUIText text="Back" />
        </Button>
        <Button
          variant="tenant-glow"
          size="lg"
          className="min-w-[200px]"
          onClick={handlePlaceOrder}
          disabled={isProcessing || (checkoutConfig.showTermsCheckbox && !termsAccepted)}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <TranslatedUIText text="Processing..." />
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <TranslatedUIText text="Pay" /> {formatStorePrice(total)}
              {isConverted && (
                <span className="text-xs font-normal opacity-75">
                  ({formatDisplayPrice(total)})
                </span>
              )}
            </span>
          )}
        </Button>
      </div>

      {/* Security note */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        <Lock className="h-3 w-3 inline mr-1" />
        <TranslatedUIText text="Your payment information is encrypted and secure" />
      </p>
    </motion.div>
  );
}

export default CheckoutReviewStep;
