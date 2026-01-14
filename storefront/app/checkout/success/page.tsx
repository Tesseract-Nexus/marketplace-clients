'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight, Home, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { PostOrderCreateAccount } from '@/components/checkout/PostOrderCreateAccount';

interface SessionDetails {
  sessionId: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed';
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  isGuest?: boolean;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { tenant, getNavPath } = useTenant();
  const { clearCart } = useCartStore();
  const { customer, accessToken } = useAuthStore();
  const isAuthenticated = !!(customer && accessToken);

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

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
            }, 1500);
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

  const storeName = tenant?.name || 'Store';
  const isPaid = sessionDetails?.paymentStatus === 'succeeded';

  // Parse customer name into first/last for the modal
  const nameParts = (sessionDetails?.customerName || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {isPaid ? 'Payment Successful!' : 'Order Confirmed!'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              Thank you for your order at {storeName}.
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              We&apos;ve sent a confirmation email with your order details.
            </p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">
                    {isPaid ? 'Payment Confirmed' : 'Order Processing'}
                  </span>
                </div>

                {sessionDetails?.orderNumber && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
                    <p className="text-lg font-semibold text-tenant-primary">
                      #{sessionDetails.orderNumber}
                    </p>
                  </div>
                )}

                {sessionDetails?.amount && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount Paid</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: sessionDetails.currency || 'USD',
                      }).format(sessionDetails.amount)}
                    </p>
                  </div>
                )}

                {sessionDetails?.customerEmail && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confirmation sent to</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {sessionDetails.customerEmail}
                    </p>
                  </div>
                )}

                {sessionId && !sessionDetails?.orderNumber && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Session ID</p>
                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                      {sessionId}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              What happens next?
            </h2>
            <ul className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">1.</span>
                <span>You&apos;ll receive an order confirmation email shortly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">2.</span>
                <span>We&apos;ll notify you when your order ships.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">3.</span>
                <span>Track your order status in your account.</span>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild variant="outline" size="lg">
              <Link href={getNavPath('/account/orders')}>
                <Package className="w-4 h-4 mr-2" />
                View Orders
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href={getNavPath('/products')}>
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Back to Home Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <Link
              href={getNavPath('/')}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Home className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
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
