'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, ChevronRight, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckout } from '@/context/CheckoutContext';
import { useCheckoutConfig, useNavPath } from '@/context/TenantContext';
import { GuestCheckoutBanner } from '@/components/checkout/GuestCheckoutBanner';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CheckoutContactStepProps {
  isAuthenticated: boolean;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

export function CheckoutContactStep({
  isAuthenticated,
  customerEmail,
  customerName,
  customerPhone,
}: CheckoutContactStepProps) {
  const {
    contactInfo,
    setContactInfo,
    isGuestMode,
    setGuestMode,
    nextStep,
    setError,
    error,
  } = useCheckout();
  const checkoutConfig = useCheckoutConfig();
  const getNavPath = useNavPath();

  const [showGuestBanner, setShowGuestBanner] = useState(!isAuthenticated && !isGuestMode);

  // Hide guest banner if user becomes authenticated (e.g., after session rehydration)
  // and auto-populate contact form from customer profile
  useEffect(() => {
    if (isAuthenticated) {
      setShowGuestBanner(false);
      // Auto-populate contact form from customer data if fields are empty/default
      const isEmpty = !contactInfo.firstName && !contactInfo.lastName && !contactInfo.phone;
      if (isEmpty) {
        const updates: Partial<typeof contactInfo> = {};
        if (customerEmail) updates.email = customerEmail;
        if (customerPhone) updates.phone = customerPhone;
        if (customerName) {
          const [firstName, ...lastNameParts] = customerName.split(' ');
          updates.firstName = firstName || '';
          updates.lastName = lastNameParts.join(' ') || '';
        }
        if (Object.keys(updates).length > 0) {
          setContactInfo(updates);
        }
      }
    }
  }, [isAuthenticated, customerEmail, customerName, customerPhone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate and proceed
  const handleContinue = () => {
    // Validate email
    if (!contactInfo.email?.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone if required or guest mode
    if (
      (checkoutConfig.requirePhone || isGuestMode) &&
      !contactInfo.phone?.trim()
    ) {
      setError(
        isGuestMode
          ? 'Phone number is required for guest checkout'
          : 'Please enter your phone number'
      );
      return;
    }

    setError(null);
    nextStep();
  };

  // Pre-fill from customer data if authenticated
  const handleUseAccountInfo = () => {
    const updates: Partial<typeof contactInfo> = {};
    if (customerEmail) updates.email = customerEmail;
    if (customerPhone) updates.phone = customerPhone;
    if (customerName) {
      const [firstName, ...lastNameParts] = customerName.split(' ');
      updates.firstName = firstName || '';
      updates.lastName = lastNameParts.join(' ') || '';
    }
    setContactInfo(updates);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-xl border p-6"
    >
      {/* Guest Checkout Banner */}
      {!isAuthenticated && showGuestBanner && !isGuestMode && (
        <GuestCheckoutBanner
          onContinueAsGuest={() => {
            setGuestMode(true);
            setShowGuestBanner(false);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-tenant-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-tenant-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            <TranslatedUIText text="Contact Information" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <TranslatedUIText text="We'll use this to send order updates" />
          </p>
        </div>
      </div>

      {/* Authenticated user info */}
      {isAuthenticated && customerEmail && (
        <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-tenant-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-tenant-primary" />
              </div>
              <div>
                <p className="font-medium">{customerName || 'Account User'}</p>
                <p className="text-sm text-muted-foreground">{customerEmail}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUseAccountInfo}
              className="text-tenant-primary"
            >
              <TranslatedUIText text="Use this" />
            </Button>
          </div>
        </div>
      )}

      {/* Contact Form */}
      <div className="space-y-4">
        {/* Name fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              <TranslatedUIText text="First Name" /> *
            </Label>
            <Input
              id="firstName"
              placeholder="John"
              value={contactInfo.firstName}
              onChange={(e) => setContactInfo({ firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">
              <TranslatedUIText text="Last Name" /> *
            </Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={contactInfo.lastName}
              onChange={(e) => setContactInfo({ lastName: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            <TranslatedUIText text="Email Address" /> *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={contactInfo.email}
              onChange={(e) => setContactInfo({ email: e.target.value })}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <TranslatedUIText text="Order confirmation and updates will be sent here" />
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            <TranslatedUIText text="Phone Number" />
            {(checkoutConfig.requirePhone || isGuestMode) && ' *'}
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo({ phone: e.target.value })}
              className="pl-10"
              required={checkoutConfig.requirePhone}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <TranslatedUIText text="For delivery updates and carrier contact" />
          </p>
        </div>
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

      {/* Login prompt for guests */}
      {!isAuthenticated && isGuestMode && (
        <div className="mt-6 p-4 rounded-lg border border-dashed">
          <div className="flex items-center gap-3">
            <LogIn className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm">
                <TranslatedUIText text="Already have an account?" />
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={getNavPath('/auth/login?redirect=/checkout')}>
                <TranslatedUIText text="Log In" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Continue button */}
      <div className="flex justify-end mt-6 pt-6 border-t">
        <Button
          variant="tenant-primary"
          size="lg"
          onClick={handleContinue}
          className="min-w-[200px]"
        >
          <TranslatedUIText text="Continue to Shipping" />
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

export default CheckoutContactStep;
