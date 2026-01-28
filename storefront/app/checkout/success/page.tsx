'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Package, ArrowRight, Home, Loader2, MapPin, Truck, CreditCard, Clock, Copy, Check, Receipt, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { PostOrderCreateAccount } from '@/components/checkout/PostOrderCreateAccount';
import { storefrontToast } from '@/components/ui/sonner';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  imageUrl?: string;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface ShippingInfo {
  method?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cost?: number;
}

interface SessionDetails {
  sessionId: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed';
  orderId?: string;
  orderNumber?: string;
  orderDate?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  isGuest?: boolean;
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  total?: number;
  shippingAddress?: ShippingAddress;
  shipping?: ShippingInfo;
  paymentMethod?: string;
}

// Auto-redirect timeout in seconds (10 minutes)
const AUTO_REDIRECT_SECONDS = 10 * 60;

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const { tenant, getNavPath } = useTenant();
  const { clearCart } = useCartStore();
  const { customer, accessToken } = useAuthStore();
  const isAuthenticated = !!(customer && accessToken);

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [copied, setCopied] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [orderCancelled, setOrderCancelled] = useState(false);

  // Clear cart on successful checkout
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Fetch session/payment details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/session/${sessionId}`, {
          headers: {
            'X-Tenant-ID': tenant?.id || '',
            'X-Storefront-ID': tenant?.storefrontId || '',
          },
        });

        if (response.ok) {
          const data: SessionDetails = await response.json();
          setSessionDetails(data);

          // Show create account modal for guest users after a short delay
          if (data.isGuest && data.paymentStatus === 'succeeded' && !isAuthenticated) {
            setTimeout(() => {
              setShowCreateAccountModal(true);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, tenant?.id, tenant?.storefrontId, isAuthenticated]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (countdown <= 0) {
      router.push(getNavPath('/'));
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router, getNavPath]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatPrice = useCallback((amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const copyOrderNumber = useCallback(() => {
    if (sessionDetails?.orderNumber) {
      navigator.clipboard.writeText(sessionDetails.orderNumber);
      setCopied(true);
      storefrontToast.success('Order number copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [sessionDetails?.orderNumber]);

  const CANCEL_REASONS = [
    'Changed my mind',
    'Found a better price',
    'Ordered by mistake',
    'Item no longer needed',
    'Other',
  ];

  const handleCancelOrder = useCallback(async () => {
    if (!sessionDetails?.orderNumber || !sessionDetails?.customerEmail || !cancelReason) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || '',
          'X-Storefront-ID': tenant?.storefrontId || '',
        },
        body: JSON.stringify({
          orderNumber: sessionDetails.orderNumber,
          reason: cancelReason,
        }),
      });
      if (res.ok) {
        setOrderCancelled(true);
        setShowCancelDialog(false);
        setCancelReason('');
        storefrontToast.success('Order cancelled successfully');
      } else {
        storefrontToast.error('Unable to cancel this order');
      }
    } catch {
      storefrontToast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  }, [sessionDetails?.orderNumber, sessionDetails?.customerEmail, cancelReason, tenant?.id, tenant?.storefrontId]);

  const storeName = tenant?.name || 'Store';
  const isPaid = sessionDetails?.paymentStatus?.toLowerCase() === 'succeeded';
  const currency = sessionDetails?.currency || 'USD';

  // Parse customer name into first/last for the modal
  const nameParts = (sessionDetails?.customerName || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isPaid ? 'Payment Successful!' : 'Order Confirmed!'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Thank you for your order at {storeName}
            </p>

            {/* Countdown Timer */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Redirecting to home in {formatTime(countdown)}</span>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Order Details - Left Column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Order Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-tenant-primary to-tenant-secondary p-4">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm opacity-90">Order Number</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold">#{sessionDetails?.orderNumber || 'N/A'}</p>
                          <button
                            onClick={copyOrderNumber}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Copy order number"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Receipt className="w-10 h-10 opacity-50" />
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-medium">{formatDate(sessionDetails?.orderDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment Status</p>
                        <p className="font-medium text-green-600">
                          {isPaid ? 'Paid' : sessionDetails?.paymentStatus}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{sessionDetails?.customerEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {sessionDetails?.items && sessionDetails.items.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-tenant-primary" />
                      Order Items ({sessionDetails.items.length})
                    </h2>
                    <div className="space-y-4">
                      {sessionDetails.items.map((item, index) => (
                        <motion.div
                          key={item.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            {item.sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              Qty: {item.quantity} × {formatPrice(item.price, currency)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(item.totalPrice, currency)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping & Delivery Info */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Shipping Address */}
                  {sessionDetails?.shippingAddress && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-tenant-primary" />
                        Shipping Address
                      </h2>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">
                          {sessionDetails.shippingAddress.firstName} {sessionDetails.shippingAddress.lastName}
                        </p>
                        <p className="text-muted-foreground">{sessionDetails.shippingAddress.addressLine1}</p>
                        {sessionDetails.shippingAddress.addressLine2 && (
                          <p className="text-muted-foreground">{sessionDetails.shippingAddress.addressLine2}</p>
                        )}
                        <p className="text-muted-foreground">
                          {sessionDetails.shippingAddress.city}, {sessionDetails.shippingAddress.state} {sessionDetails.shippingAddress.postalCode}
                        </p>
                        <p className="text-muted-foreground">{sessionDetails.shippingAddress.country}</p>
                        {sessionDetails.shippingAddress.phone && (
                          <p className="text-muted-foreground mt-2">Phone: {sessionDetails.shippingAddress.phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Info */}
                  {sessionDetails?.shipping && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-tenant-primary" />
                        Delivery Information
                      </h2>
                      <div className="text-sm space-y-2">
                        {sessionDetails.shipping.method && (
                          <div>
                            <p className="text-muted-foreground">Shipping Method</p>
                            <p className="font-medium">{sessionDetails.shipping.method}</p>
                          </div>
                        )}
                        {sessionDetails.shipping.carrier && (
                          <div>
                            <p className="text-muted-foreground">Carrier</p>
                            <p className="font-medium">{sessionDetails.shipping.carrier}</p>
                          </div>
                        )}
                        {sessionDetails.shipping.trackingNumber && (
                          <div>
                            <p className="text-muted-foreground">Tracking Number</p>
                            <p className="font-medium font-mono">{sessionDetails.shipping.trackingNumber}</p>
                          </div>
                        )}
                        {sessionDetails.shipping.estimatedDelivery && (
                          <div>
                            <p className="text-muted-foreground">Estimated Delivery</p>
                            <p className="font-medium">{sessionDetails.shipping.estimatedDelivery}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Order Summary - Right Column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-1"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-tenant-primary" />
                    Payment Summary
                  </h2>

                  <div className="space-y-3 text-sm">
                    {sessionDetails?.subtotal !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(sessionDetails.subtotal, currency)}</span>
                      </div>
                    )}
                    {sessionDetails?.discount !== undefined && sessionDetails.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(sessionDetails.discount, currency)}</span>
                      </div>
                    )}
                    {sessionDetails?.shippingCost !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {sessionDetails.shippingCost === 0
                            ? 'FREE'
                            : formatPrice(sessionDetails.shippingCost, currency)}
                        </span>
                      </div>
                    )}
                    {sessionDetails?.tax !== undefined && sessionDetails.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatPrice(sessionDetails.tax, currency)}</span>
                      </div>
                    )}

                    <Separator className="my-3" />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Paid</span>
                      <span className="text-tenant-primary">
                        {formatPrice(sessionDetails?.total || sessionDetails?.amount || 0, currency)}
                      </span>
                    </div>

                    {sessionDetails?.paymentMethod && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Paid via {sessionDetails.paymentMethod}
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* What's Next */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                    <h3 className="font-semibold text-sm mb-2">What happens next?</h3>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">1.</span>
                        <span>Confirmation email sent to {sessionDetails?.customerEmail}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">2.</span>
                        <span>We&apos;ll notify you when your order ships</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">3.</span>
                        <span>Track your order in your account</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button asChild className="w-full" size="lg">
                      <Link href={getNavPath('/account/orders')}>
                        <Package className="w-4 h-4 mr-2" />
                        View My Orders
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link href={getNavPath('/products')}>
                        Continue Shopping
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => router.push(getNavPath('/'))}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Return to Home
                    </Button>
                  </div>

                  {/* Cancel Order */}
                  {isPaid && !orderCancelled && (
                    <div className="mt-4 pt-4 border-t">
                      {!showCancelDialog ? (
                        <Button
                          variant="ghost"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          size="sm"
                          onClick={() => setShowCancelDialog(true)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Order
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Why do you want to cancel?</p>
                          <div className="space-y-2">
                            {CANCEL_REASONS.map((reason) => (
                              <label
                                key={reason}
                                className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 text-sm"
                              >
                                <input
                                  type="radio"
                                  name="cancelReason"
                                  value={reason}
                                  checked={cancelReason === reason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  className="accent-red-600"
                                />
                                {reason}
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setShowCancelDialog(false);
                                setCancelReason('');
                              }}
                            >
                              Keep Order
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              disabled={!cancelReason || cancelling}
                              onClick={handleCancelOrder}
                            >
                              {cancelling ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                              )}
                              Confirm Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {orderCancelled && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-red-600 font-medium text-center">
                        Order has been cancelled
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Post-order create account modal for guest users */}
      {sessionDetails?.isGuest && sessionDetails.customerEmail && (
        <PostOrderCreateAccount
          open={showCreateAccountModal}
          onOpenChange={setShowCreateAccountModal}
          email={sessionDetails.customerEmail}
          firstName={firstName}
          lastName={lastName}
          orderNumber={sessionDetails.orderNumber}
          onAccountCreated={() => {
            // Optionally refresh auth state
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// Loading fallback for Suspense
function CheckoutSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
