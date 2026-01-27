'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package,
  Search,
  XCircle,
  Truck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface GuestOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image: string;
}

interface GuestOrderData {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  items: GuestOrderItem[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shipping?: {
    method: string;
    city: string;
    state: string;
    country: string;
    street?: string;
    postalCode?: string;
    carrier?: string;
    trackingNumber?: string;
  };
  fulfillmentStatus?: string;
  canCancel: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price',
  'Ordered by mistake',
  'Item no longer needed',
  'Other',
];

function GuestOrderContent() {
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get('order') || ''
  );
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const token = searchParams.get('token') || '';

  const [order, setOrder] = useState<GuestOrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(
    async (on: string, em: string, tk: string) => {
      setLoading(true);
      setError(null);
      setOrder(null);

      try {
        const params = new URLSearchParams({
          order_number: on,
          email: em,
          token: tk,
        });
        const res = await fetch(`/api/orders/guest?${params.toString()}`);
        if (!res.ok) {
          setError('Order not found or link expired');
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch {
        setError('Failed to load order. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-fetch on mount if URL has token
  useEffect(() => {
    if (token && orderNumber && email) {
      fetchOrder(orderNumber, email, token);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    if (!token) {
      setError('A valid order link is required to view order details');
      return;
    }
    fetchOrder(orderNumber, email, token);
  };

  const handleCancel = async () => {
    if (!order || !cancelReason) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/orders/guest/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: order.orderNumber,
          email,
          token,
          reason: cancelReason,
        }),
      });
      if (!res.ok) {
        setError('Unable to cancel this order');
        return;
      }
      const data = await res.json();
      setOrder(data);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch {
      setError('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-8 w-8 text-tenant-primary" />
          <div>
            <h1 className="text-2xl font-bold">Order Lookup</h1>
            <p className="text-muted-foreground text-sm">
              View your order details and status
            </p>
          </div>
        </div>

        {/* Manual lookup form (shown when no order loaded) */}
        {!order && !loading && (
          <form
            onSubmit={handleManualLookup}
            className="bg-card rounded-xl border p-6 mb-6"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="ORD-123456"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!token}>
                <Search className="h-4 w-4 mr-2" />
                Look Up Order
              </Button>
              {!token && (
                <p className="text-xs text-muted-foreground text-center">
                  Please use the link from your order confirmation email
                </p>
              )}
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-card rounded-xl border p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-tenant-primary" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order header */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {order.orderNumber}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Items</h3>
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.totalPrice, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing summary */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatCurrency(order.subtotal, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {formatCurrency(order.shippingCost, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    {formatCurrency(order.taxAmount, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            {order.shipping && (
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping
                </h3>
                <div className="text-sm space-y-1">
                  <p>
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  {order.shipping.street && <p>{order.shipping.street}</p>}
                  <p>
                    {order.shipping.city}, {order.shipping.state}{' '}
                    {order.shipping.postalCode}
                  </p>
                  <p>{order.shipping.country}</p>
                </div>
                {order.shipping.carrier && (
                  <div className="mt-4 pt-4 border-t text-sm">
                    <p>
                      <span className="text-muted-foreground">Carrier:</span>{' '}
                      {order.shipping.carrier}
                    </p>
                    {order.shipping.trackingNumber && (
                      <p>
                        <span className="text-muted-foreground">
                          Tracking:
                        </span>{' '}
                        {order.shipping.trackingNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cancel button */}
            {order.canCancel && (
              <div className="bg-card rounded-xl border p-6">
                {!showCancelDialog ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Cancel Order</h3>
                    <p className="text-sm text-muted-foreground">
                      Please select a reason for cancellation:
                    </p>
                    <div className="space-y-2">
                      {CANCEL_REASONS.map((reason) => (
                        <label
                          key={reason}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        >
                          <input
                            type="radio"
                            name="cancelReason"
                            value={reason}
                            checked={cancelReason === reason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="accent-red-600"
                          />
                          <span className="text-sm">{reason}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCancelDialog(false);
                          setCancelReason('');
                        }}
                        className="flex-1"
                      >
                        Keep Order
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={!cancelReason || cancelling}
                        className="flex-1"
                      >
                        {cancelling ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirm Cancellation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function GuestOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GuestOrderContent />
    </Suspense>
  );
}
