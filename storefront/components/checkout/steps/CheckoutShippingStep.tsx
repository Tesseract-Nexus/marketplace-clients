'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, Edit2, ChevronRight, ChevronLeft, Loader2, CreditCard, Ticket, Gift, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCheckout } from '@/context/CheckoutContext';
import { AddressSelector } from '@/components/checkout/AddressSelector';
import { ShippingMethodSelector } from '@/components/checkout/ShippingMethodSelector';
import { LocationConfirmationModal } from '@/components/checkout/LocationConfirmationModal';
import { AddressAutocomplete, type ParsedAddressData } from '@/components/AddressAutocomplete';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { CustomerAddress } from '@/lib/api/customers';
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import type { DetectedLocation } from '@/hooks/useLocationDetection';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { CheckoutTrustFooter } from '@/components/checkout/CheckoutTrustFooter';
import { useLocalization } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { PaymentMethodSelector, EnabledPaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import { CouponInput } from '@/components/checkout/CouponInput';
import { GiftCardInput } from '@/components/checkout/GiftCardInput';
import { LoyaltyPointsRedemption } from '@/components/checkout/LoyaltyPointsRedemption';
import { useCartStore } from '@/store/cart';

interface Country {
  id: string;
  name: string;
  flagEmoji: string;
}

interface State {
  id: string;
  name: string;
  code: string;
}

interface CheckoutShippingStepProps {
  isAuthenticated: boolean;
  orderSubtotal: number;
  packageWeight: number;
  packageDimensions?: {
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit: 'cm' | 'in';
  };
  isLoadingProductShipping?: boolean;
  // Payment-related props (combined step)
  shipping: number;
  tax: number;
  enabledPaymentMethods?: EnabledPaymentMethod[];
  selectedPaymentMethod?: string | null;
  onPaymentMethodSelect?: (code: string) => void;
  isLoadingPaymentMethods?: boolean;
}

export function CheckoutShippingStep({
  isAuthenticated,
  orderSubtotal,
  packageWeight,
  packageDimensions,
  isLoadingProductShipping = false,
  shipping,
  tax,
  enabledPaymentMethods = [],
  selectedPaymentMethod = null,
  onPaymentMethodSelect,
  isLoadingPaymentMethods = false,
}: CheckoutShippingStepProps) {
  const {
    addressMode,
    setAddressMode,
    selectedSavedAddress,
    setSelectedSavedAddress,
    shippingAddress,
    setShippingAddress,
    contactInfo,
    setContactInfo,
    selectedShippingMethod,
    setShippingMethod,
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

  // Get store localization settings (country configured by admin)
  const localization = useLocalization();
  const storeCountryCode = localization.countryCode;

  // Location detection
  const { location, isLoading: isLocationLoading, isAutoDetected } = useLocationDetection(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasShownLocationModal, setHasShownLocationModal] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Address entry mode (autocomplete vs manual form)
  const [useAutocomplete, setUseAutocomplete] = useState(true);

  // Countries and states
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingStates, setIsLoadingStates] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/location/countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Set default country from store settings when component mounts
  useEffect(() => {
    if (storeCountryCode && !shippingAddress.countryCode) {
      setShippingAddress({
        country: storeCountryCode,
        countryCode: storeCountryCode,
      });
    }
  }, [storeCountryCode, shippingAddress.countryCode, setShippingAddress]);

  // Fetch states when country changes
  const fetchStates = useCallback(async (countryId: string) => {
    if (!countryId) return;
    setIsLoadingStates(true);
    try {
      const response = await fetch(`/api/location/countries/${countryId}/states`);
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      }
    } catch (error) {
      console.error('Failed to fetch states:', error);
      setStates([]);
    } finally {
      setIsLoadingStates(false);
    }
  }, []);

  useEffect(() => {
    if (shippingAddress.countryCode) {
      fetchStates(shippingAddress.countryCode);
    }
  }, [shippingAddress.countryCode, fetchStates]);

  // Show location confirmation modal when location is detected
  useEffect(() => {
    if (location && !hasShownLocationModal && !isLocationLoading && addressMode === 'manual' && !hasAutoFilled) {
      setShowLocationModal(true);
      setHasShownLocationModal(true);
    }
  }, [location, hasShownLocationModal, isLocationLoading, addressMode, hasAutoFilled]);

  // Handle location confirmation
  const handleLocationConfirm = (confirmedLocation: DetectedLocation) => {
    const stateCode = confirmedLocation.state?.includes('-')
      ? confirmedLocation.state.split('-')[1]
      : confirmedLocation.state;

    setShippingAddress({
      city: confirmedLocation.city || '',
      state: stateCode || '',
      stateCode: stateCode || '',
      zip: confirmedLocation.postalCode || '',
      country: confirmedLocation.country || 'US',
      countryCode: confirmedLocation.country || 'US',
    });
    setHasAutoFilled(true);
    setShowLocationModal(false);
  };

  // Handle address autocomplete selection
  const handleAutocompleteSelect = (address: ParsedAddressData) => {
    setShippingAddress({
      addressLine1: address.streetAddress,
      city: address.city,
      state: address.stateCode || address.state,
      stateCode: address.stateCode || address.state,
      zip: address.postalCode,
      country: address.countryCode || address.country,
      countryCode: address.countryCode || address.country,
    });
    setHasAutoFilled(true);
    // Switch to manual mode to show filled fields
    setUseAutocomplete(false);
  };

  // Handle saved address selection
  const handleSavedAddressSelect = (address: CustomerAddress) => {
    setSelectedSavedAddress(address);
    // Pre-fill contact info from saved address
    setContactInfo({
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone || contactInfo.phone,
    });
    // Pre-fill shipping address
    const countryCode = address.countryCode || address.country;
    setShippingAddress({
      addressLine1: address.addressLine1,
      city: address.city,
      state: address.state,
      zip: address.postalCode,
      country: countryCode,
      countryCode: countryCode,
    });
    setHasAutoFilled(true);
  };

  // Handle shipping method selection
  const handleShippingMethodSelect = (method: ShippingMethod | ShippingRate, cost: number) => {
    setShippingMethod(method, cost);
  };

  // Validate and proceed
  const handleContinue = () => {
    if (isAuthenticated && addressMode === 'saved') {
      if (!selectedSavedAddress) {
        setError('Please select a shipping address');
        return;
      }
    } else {
      if (!shippingAddress.addressLine1?.trim()) {
        setError('Please enter your street address');
        return;
      }
      if (!shippingAddress.city?.trim()) {
        setError('Please enter your city');
        return;
      }
      if (!shippingAddress.state?.trim()) {
        setError('Please select your state');
        return;
      }
      if (!shippingAddress.zip?.trim()) {
        setError('Please enter your ZIP/postal code');
        return;
      }
    }

    if (!selectedShippingMethod) {
      setError('Please select a shipping method');
      return;
    }

    // Validate payment method if dynamic methods are available
    if (enabledPaymentMethods.length > 0 && !selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setError(null);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tenant-primary/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-tenant-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              <TranslatedUIText text="Shipping Address" />
            </h2>
            <p className="text-sm text-muted-foreground">
              <TranslatedUIText text="Where should we deliver your order?" />
            </p>
          </div>
        </div>

        {/* Location detection indicator */}
        {isLocationLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <TranslatedUIText text="Detecting location..." />
          </div>
        ) : isAutoDetected && location && addressMode === 'manual' ? (
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            {location.flagEmoji} {location.city}, {location.countryName}
            <Edit2 className="h-3 w-3 ml-1" />
          </button>
        ) : null}
      </div>

      {/* Address mode toggle for authenticated users */}
      {isAuthenticated && (
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setAddressMode('saved')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all min-h-[44px]',
                addressMode === 'saved'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MapPin className="h-4 w-4" />
              <TranslatedUIText text="Saved Addresses" />
            </button>
            <button
              onClick={() => setAddressMode('manual')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all min-h-[44px]',
                addressMode === 'manual'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Edit2 className="h-4 w-4" />
              <TranslatedUIText text="New Address" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Saved Address Selector */}
        {isAuthenticated && addressMode === 'saved' && (
          <motion.div
            key="saved-addresses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <AddressSelector
              selectedAddressId={selectedSavedAddress?.id}
              onSelectAddress={handleSavedAddressSelect}
              addressType="SHIPPING"
            />
          </motion.div>
        )}

        {/* Manual Address Entry */}
        {(!isAuthenticated || addressMode === 'manual') && (
          <motion.div
            key="manual-entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid gap-4">
              {/* Address Autocomplete Search */}
              {useAutocomplete && !hasAutoFilled && (
                <div className="space-y-2">
                  <Label>
                    <TranslatedUIText text="Search Your Address" />
                  </Label>
                  <AddressAutocomplete
                    onAddressSelect={handleAutocompleteSelect}
                    onManualEntryToggle={(isManual) => setUseAutocomplete(!isManual)}
                    placeholder="Start typing your address..."
                    countryRestriction={storeCountryCode}
                    showCurrentLocation={true}
                  />
                </div>
              )}

              {/* Show editable fields after autocomplete or in manual mode */}
              {(!useAutocomplete || hasAutoFilled) && (
                <>
                  {/* Edit button to re-search */}
                  {hasAutoFilled && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseAutocomplete(true);
                        setHasAutoFilled(false);
                        // Keep store country when re-searching
                        setShippingAddress({
                          addressLine1: '',
                          city: '',
                          state: '',
                          stateCode: '',
                          zip: '',
                          country: storeCountryCode || '',
                          countryCode: storeCountryCode || '',
                        });
                      }}
                      className="text-sm text-tenant-primary hover:underline flex items-center gap-1 mb-2"
                    >
                      <MapPin className="h-4 w-4" />
                      <TranslatedUIText text="Search for a different address" />
                    </button>
                  )}

                  {/* Street Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      <TranslatedUIText text="Street Address" /> *
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street, Apt 4B"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({ addressLine1: e.target.value })}
                      required
                    />
                  </div>

              {/* City, State, ZIP */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    <TranslatedUIText text="City" /> *
                  </Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">
                    <TranslatedUIText text="State" /> *
                  </Label>
                  <Select
                    value={shippingAddress.state}
                    onValueChange={(value) =>
                      setShippingAddress({ state: value, stateCode: value })
                    }
                    disabled={isLoadingStates}
                  >
                    <SelectTrigger>
                      {isLoadingStates ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <SelectValue placeholder="Select state" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {states.length > 0 ? (
                        states.map((state) => (
                          <SelectItem key={state.id} value={state.code || state.id}>
                            {state.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_no_states" disabled>
                          No states available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">
                    <TranslatedUIText text="ZIP Code" /> *
                  </Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    value={shippingAddress.zip}
                    onChange={(e) => setShippingAddress({ zip: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">
                  <TranslatedUIText text="Country" /> *
                </Label>
                <Select
                  value={shippingAddress.countryCode}
                  onValueChange={(value) => {
                    setShippingAddress({
                      country: value,
                      countryCode: value,
                      state: '',
                      stateCode: '',
                    });
                  }}
                  disabled={true} // Country is set by store location - customers cannot change
                >
                  <SelectTrigger>
                    {isLoadingCountries ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select country" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {countries.length > 0 ? (
                      countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.flagEmoji} {country.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_no_countries" disabled>
                        No countries available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shipping Method Selection */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <TranslatedUIText text="Shipping Method" />
        </h3>
        {isLoadingProductShipping ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-gray-500">Loading shipping options...</span>
          </div>
        ) : (
          <ShippingMethodSelector
            orderSubtotal={orderSubtotal}
            countryCode={shippingAddress.countryCode || shippingAddress.country}
            postalCode={shippingAddress.zip}
            city={shippingAddress.city}
            state={shippingAddress.state}
            selectedMethodId={selectedShippingMethod?.id}
            onSelect={handleShippingMethodSelect}
            disabled={isProcessing}
            packageWeight={packageWeight}
            weightUnit="kg"
            packageDimensions={packageDimensions}
            useCarrierRates={true}
          />
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <TranslatedUIText text="Payment Method" />
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

        {/* Billing Address Toggle */}
        <div className="flex items-center gap-3 p-4 rounded-lg border mt-4">
          <Checkbox
            id="billingAddress"
            checked={billingAddressSameAsShipping}
            onCheckedChange={(checked) => setBillingAddressSameAsShipping(checked === true)}
          />
          <Label htmlFor="billingAddress" className="cursor-pointer flex-1">
            <span className="font-medium">
              <TranslatedUIText text="Billing address same as shipping" />
            </span>
          </Label>
        </div>
      </div>

      {/* Discounts Section */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          <TranslatedUIText text="Discounts & Rewards" />
        </h3>

        <div className="space-y-4">
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
              orderTotal={orderTotal + giftCardDiscount}
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
              onApplyPoints={(points, dollarValue) => setLoyaltyPoints(points, dollarValue)}
              onRemovePoints={() => setLoyaltyPoints(0, 0)}
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
                  <span><TranslatedUIText text="Coupon" /> ({appliedCoupon?.coupon.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-yellow-600">
                  <span><TranslatedUIText text="Loyalty Points" /> ({loyaltyPointsApplied.toLocaleString()})</span>
                  <span>-${loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              {giftCardDiscount > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span><TranslatedUIText text="Gift Card" /></span>
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
      </div>

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

      {/* Trust indicators */}
      <CheckoutTrustFooter />

      {/* Location Confirmation Modal */}
      <LocationConfirmationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
        onSkip={() => setShowLocationModal(false)}
        detectedLocation={location}
        isDetecting={isLocationLoading}
      />
    </motion.div>
  );
}

export default CheckoutShippingStep;
