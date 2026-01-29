'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { orderService } from '@/lib/services/orderService';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  ValidTransitionsResponse,
} from '@/lib/api/types';
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Loader2,
  ArrowLeft,
  CreditCard,
  ArrowRight,
  PackageCheck,
  PackageX,
  TrendingUp,
  Mail,
  Phone,
  RefreshCw,
  Hash,
  FileText,
  Download,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { ShippingCard } from '@/components/orders/ShippingCard';

// Currency formatting helper - uses order's currency or defaults to INR for Indian stores
const formatCurrency = (amount: string | number | null | undefined, currencyCode: string = 'INR'): string => {
  const numAmount = amount == null ? 0 : (typeof amount === 'string' ? parseFloat(amount) : amount);
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$' };
  const symbol = symbols[currencyCode] || currencyCode + ' ';
  return `${symbol}${(isNaN(numAmount) ? 0 : numAmount).toFixed(2)}`;
};

// Dynamic font size based on text length to fit in container
const getDynamicFontSize = (text: string): string => {
  const len = text.length;
  if (len <= 8) return 'text-xl';
  if (len <= 10) return 'text-lg';
  if (len <= 12) return 'text-base';
  return 'text-sm';
};

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg", className)} {...props}>
    {children}
  </div>
);

const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validTransitions, setValidTransitions] = useState<ValidTransitionsResponse | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrder(orderId);
      const orderData = response?.data || response;
      setOrder(orderData as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchValidTransitions = async () => {
    try {
      const response = await orderService.getValidTransitions(orderId);
      const data = response?.data || response;
      if (data && data.validOrderStatuses) {
        setValidTransitions(data as ValidTransitionsResponse);
      }
    } catch (err) {
      console.error('Error fetching valid transitions:', err);
    }
  };

  useEffect(() => {
    loadOrder();
    fetchValidTransitions();
  }, [loadOrder]);

  const handleOrderStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus });
      await fetchValidTransitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus: PaymentStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await orderService.updatePaymentStatus(order.id, newStatus);
      setOrder({ ...order, paymentStatus: newStatus });
      await fetchValidTransitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFulfillmentStatusUpdate = async (newStatus: FulfillmentStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await orderService.updateFulfillmentStatus(order.id, newStatus);
      setOrder({ ...order, fulfillmentStatus: newStatus });
      await fetchValidTransitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fulfillment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!order) return;
    setGeneratingReceipt(true);
    try {
      const response = await orderService.generateReceipt(order.id);
      const result = response?.data || response;
      const doc = result as Record<string, unknown>;
      setOrder({
        ...order,
        receiptNumber: (doc.receiptNumber as string) || order.receiptNumber,
        receiptShortUrl: (doc.shortUrl as string) || order.receiptShortUrl,
        receiptDocumentId: (doc.id as string) || order.receiptDocumentId,
        receiptGeneratedAt: (doc.createdAt as string) || new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate receipt');
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      PLACED: 'bg-warning-muted text-warning-foreground border-warning/30',
      CONFIRMED: 'bg-primary/20 text-primary border-primary/30',
      PROCESSING: 'bg-primary/10 text-primary border-primary/30',
      SHIPPED: 'bg-primary/10 text-primary border-primary/30',
      DELIVERED: 'bg-success-muted text-success border-success/30',
      COMPLETED: 'bg-success/10 text-success border-success/30',
      CANCELLED: 'bg-error-muted text-error border-error/30',
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    const styles: Record<PaymentStatus, string> = {
      PENDING: 'bg-warning-muted text-warning-foreground border-warning/30',
      PAID: 'bg-success/10 text-success border-success/30',
      FAILED: 'bg-error-muted text-error border-error/30',
      PARTIALLY_REFUNDED: 'bg-warning-muted text-warning border-warning/30',
      REFUNDED: 'bg-warning-muted text-warning border-warning/30',
    };
    return <Badge className={styles[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getFulfillmentBadge = (status: FulfillmentStatus) => {
    const styles: Record<FulfillmentStatus, string> = {
      UNFULFILLED: 'bg-muted text-foreground border-border',
      PROCESSING: 'bg-primary/20 text-primary border-primary/30',
      PACKED: 'bg-primary/10 text-primary border-primary/30',
      DISPATCHED: 'bg-accent text-accent-foreground border-accent',
      IN_TRANSIT: 'bg-info/10 text-info border-info/30',
      OUT_FOR_DELIVERY: 'bg-success-muted text-success border-success/30',
      DELIVERED: 'bg-success/10 text-success border-success/30',
      FAILED_DELIVERY: 'bg-error-muted text-error border-error/30',
      RETURNED: 'bg-warning-muted text-warning border-warning/30',
    };
    const labels: Record<FulfillmentStatus, string> = {
      UNFULFILLED: 'Unfulfilled',
      PROCESSING: 'Processing',
      PACKED: 'Packed',
      DISPATCHED: 'Dispatched',
      IN_TRANSIT: 'In Transit',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      FAILED_DELIVERY: 'Failed',
      RETURNED: 'Returned',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getFulfillmentProgress = (status: FulfillmentStatus): number => {
    const progressMap: Record<FulfillmentStatus, number> = {
      UNFULFILLED: 0,
      PROCESSING: 15,
      PACKED: 30,
      DISPATCHED: 45,
      IN_TRANSIT: 60,
      OUT_FOR_DELIVERY: 80,
      DELIVERED: 100,
      FAILED_DELIVERY: 0,
      RETURNED: 0,
    };
    return progressMap[status] || 0;
  };

  // Helper to get order date with fallback
  const getOrderDate = (order: Order): Date => {
    const dateStr = order.orderDate || (order as any).createdAt;
    if (!dateStr) return new Date();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const formatDate = (order: Order): string => {
    return getOrderDate(order).toLocaleDateString();
  };

  const formatDateTime = (order: Order): string => {
    return getOrderDate(order).toLocaleString();
  };

  // Order status workflow steps
  const orderStatusSteps: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PROCESSING', 'COMPLETED'];
  const paymentStatusSteps: PaymentStatus[] = ['PENDING', 'PAID'];
  const fulfillmentStatusSteps: FulfillmentStatus[] = ['UNFULFILLED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const getOrderStatusStep = (status: OrderStatus): number => {
    if (status === 'CANCELLED') return -1;
    return orderStatusSteps.indexOf(status);
  };

  const getPaymentStatusStep = (status: PaymentStatus): number => {
    if (status === 'FAILED' || status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') return -1;
    return paymentStatusSteps.indexOf(status);
  };

  const getFulfillmentStatusStep = (status: FulfillmentStatus): number => {
    if (status === 'FAILED_DELIVERY' || status === 'RETURNED') return -1;
    return fulfillmentStatusSteps.indexOf(status);
  };

  const getStatusDescription = (status: OrderStatus | PaymentStatus | FulfillmentStatus): string => {
    const descriptions: Record<string, string> = {
      // Order statuses
      PLACED: 'Order received and awaiting confirmation',
      CONFIRMED: 'Order confirmed and ready for processing',
      PROCESSING: 'Order is being prepared',
      COMPLETED: 'Order successfully completed',
      CANCELLED: 'Order has been cancelled',
      // Payment statuses
      PENDING: 'Awaiting payment',
      PAID: 'Payment received successfully',
      FAILED: 'Payment failed',
      PARTIALLY_REFUNDED: 'Partial refund issued',
      REFUNDED: 'Full refund issued',
      // Fulfillment statuses
      UNFULFILLED: 'Not yet started',
      PACKED: 'Items packed and ready',
      DISPATCHED: 'Handed to carrier',
      IN_TRANSIT: 'On the way',
      OUT_FOR_DELIVERY: 'Out for delivery today',
      DELIVERED: 'Successfully delivered',
      FAILED_DELIVERY: 'Delivery attempt failed',
      RETURNED: 'Returned to sender',
    };
    return descriptions[status] || status;
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ReactNode> = {
      PLACED: <Clock className="w-4 h-4" />,
      CONFIRMED: <CheckCircle className="w-4 h-4" />,
      PROCESSING: <Package className="w-4 h-4" />,
      SHIPPED: <Truck className="w-4 h-4" />,
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
    };
    return icons[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="border-error/30">
            <CardContent className="p-12 text-center">
              <XCircle className="w-16 h-16 mx-auto text-error mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">{error || 'The requested order could not be found.'}</p>
              <Button onClick={() => router.push('/orders')} className="bg-primary hover:bg-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ORDERS_VIEW}
      fallback="styled"
      fallbackTitle="Order Details Access Required"
      fallbackDescription="You don't have the required permissions to view order details. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={`Order ${order.orderNumber}`}
          description={`Placed on ${formatDate(order)}`}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
            { label: order.orderNumber },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => { loadOrder(); fetchValidTransitions(); }}
                disabled={loading}
                className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" onClick={() => router.push('/orders')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
            </div>
          }
        />

        {/* Order Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary text-primary-foreground p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{order.orderNumber}</h2>
                    <p className="text-primary/30 text-sm flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(order)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary/30 text-sm mb-1">Order Total</p>
                <p className="text-4xl font-bold">{formatCurrency(order.total, order.currencyCode)}</p>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-2">
                {getStatusIcon(order.status)}
                {order.status}
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {order.paymentStatus?.replace('_', ' ') || 'Unknown'}
              </div>
              {order.fulfillmentStatus && (
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {order.fulfillmentStatus.replace(/_/g, ' ')}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Status Management - Full Width */}
        {/* Unified Order Workflow */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {/* Header with Current Status and Payment Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  order.status === 'CANCELLED' ? "bg-error-muted" :
                  order.status === 'DELIVERED' || order.status === 'COMPLETED' ? "bg-success/10" : "bg-primary/20"
                )}>
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{getStatusDescription(order.status)}</p>
                </div>
              </div>

              {/* Payment Badge */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border",
                order.paymentStatus === 'PAID' ? "bg-success/10 border-success/30" :
                order.paymentStatus === 'FAILED' ? "bg-error-muted border-error/30" :
                order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED' ? "bg-warning-muted border-warning/30" :
                "bg-warning-muted border-warning/30"
              )}>
                <CreditCard className={cn(
                  "w-4 h-4",
                  order.paymentStatus === 'PAID' ? "text-success" :
                  order.paymentStatus === 'FAILED' ? "text-error" :
                  order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED' ? "text-warning" :
                  "text-warning"
                )} />
                <span className={cn(
                  "text-sm font-semibold",
                  order.paymentStatus === 'PAID' ? "text-success" :
                  order.paymentStatus === 'FAILED' ? "text-error" :
                  order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED' ? "text-warning" :
                  "text-warning-foreground"
                )}>
                  {order.paymentStatus === 'PAID' ? 'Paid' :
                   order.paymentStatus === 'PENDING' ? 'Payment Pending' :
                   order.paymentStatus === 'FAILED' ? 'Payment Failed' :
                   order.paymentStatus?.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-bold text-foreground">{formatCurrency(order.total, order.currencyCode)}</span>
              </div>
            </div>

            {/* Progress Stepper */}
            {order.status !== 'CANCELLED' && (
              <div className="mb-8 py-4 px-2">
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute top-4 left-8 right-8 h-1 bg-muted rounded-full">
                    <div
                      className="absolute h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(getOrderStatusStep(order.status) / (orderStatusSteps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Step indicators */}
                  <div className="relative flex items-start justify-between">
                    {orderStatusSteps.map((step, index) => {
                      const currentStep = getOrderStatusStep(order.status);
                      const isCompleted = index <= currentStep;
                      const isCurrent = index === currentStep;
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10",
                            isCompleted ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground",
                            isCurrent && "ring-4 ring-primary/20 scale-110"
                          )}>
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                          </div>
                          <span className={cn(
                            "text-xs mt-3 text-center",
                            isCompleted ? "text-primary font-semibold" : "text-muted-foreground"
                          )}>
                            {step.charAt(0) + step.slice(1).toLowerCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Cancelled State */}
            {order.status === 'CANCELLED' && (
              <div className="mb-6 p-4 bg-error-muted rounded-xl border border-error/30">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-error" />
                  <div>
                    <p className="font-semibold text-error">Order Cancelled</p>
                    <p className="text-sm text-error">This order has been cancelled and cannot be processed further.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Available Actions */}
            {validTransitions && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Order Status Actions */}
                  {validTransitions.validOrderStatuses.map((status) => (
                    <button
                      key={`order-${status}`}
                      onClick={() => handleOrderStatusUpdate(status)}
                      disabled={updatingStatus}
                      className={cn(
                        "group px-4 py-3 text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium",
                        status === 'CANCELLED'
                          ? "bg-error-muted hover:bg-error-muted text-error border border-error/30"
                          : "bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 hover:border-primary"
                      )}
                    >
                      {status === 'CANCELLED' ? <XCircle className="w-5 h-5" /> :
                       status === 'CONFIRMED' ? <CheckCircle className="w-5 h-5" /> :
                       status === 'PROCESSING' ? <Package className="w-5 h-5" /> :
                       status === 'SHIPPED' ? <Truck className="w-5 h-5" /> :
                       status === 'DELIVERED' ? <PackageCheck className="w-5 h-5" /> :
                       <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                      <div className="text-left flex-1">
                        <p className="font-semibold">{status === 'CANCELLED' ? 'Cancel Order' : `Mark ${status}`}</p>
                      </div>
                      {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                    </button>
                  ))}

                </div>

                {validTransitions.validOrderStatuses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-xl">
                    {order.status === 'CANCELLED' ? 'No actions available for cancelled orders' :
                     order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'Order completed - no further actions needed' :
                     'No actions available'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Order Details */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    Order Summary
                  </h3>
                  <div className="px-3 py-1 bg-success/10 border border-success/30 rounded-full">
                    <span className="text-success text-sm font-semibold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {order.totalItems ?? order.items?.length ?? 0} items
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Subtotal</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(order.subtotal, order.currencyCode)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Tax</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(order.tax, order.currencyCode)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Shipping</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(order.shippingCost, order.currencyCode)}</p>
                    {order.shipping?.markupAmount && order.shipping.markupAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Carrier: {formatCurrency(order.shipping.baseRate, order.currencyCode)} + Markup: {formatCurrency(order.shipping.markupAmount, order.currencyCode)}
                      </p>
                    )}
                  </div>
                  <div className="bg-success p-4 rounded-xl shadow-lg">
                    <p className="text-xs text-success-foreground/80 font-semibold mb-1">Total</p>
                    <p className={`${getDynamicFontSize(formatCurrency(order.total, order.currencyCode))} font-bold text-white whitespace-nowrap`}>{formatCurrency(order.total, order.currencyCode)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fulfillment Progress */}
            {order.fulfillmentStatus && order.fulfillmentStatus !== 'UNFULFILLED' && (
              <Card className="bg-primary/5 border-primary/30">
                <CardContent>
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Fulfillment Progress
                  </h3>
                  <div className="relative">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${getFulfillmentProgress(order.fulfillmentStatus)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-semibold text-muted-foreground">
                      <span>Processing</span>
                      <span>In Transit</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-card rounded-xl border-2 border-primary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          {order.fulfillmentStatus === 'DELIVERED' ? (
                            <PackageCheck className="w-5 h-5 text-primary" />
                          ) : order.fulfillmentStatus === 'FAILED_DELIVERY' ? (
                            <PackageX className="w-5 h-5 text-error" />
                          ) : (
                            <Truck className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Current Status</p>
                          <p className="text-sm text-muted-foreground">{order.fulfillmentStatus.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{getFulfillmentProgress(order.fulfillmentStatus)}%</p>
                        <p className="text-xs text-muted-foreground">Complete</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Card */}
            <ShippingCard order={order} onShipmentCreated={loadOrder} />

            {/* Order Items */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  Order Items ({order.items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(order.items || []).map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-muted hover:from-blue-50 hover:to-cyan-50 rounded-xl border border-border transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/20 text-primary font-bold rounded-lg text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">Quantity: <span className="font-semibold">{item.quantity}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{formatCurrency(item.totalPrice, order.currencyCode)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice, order.currencyCode)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Name</p>
                      <p className="font-semibold text-foreground">
                        {order.customerName || (order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 'N/A') || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Email</p>
                      <p className="font-semibold text-foreground break-all">
                        {order.customerEmail || order.customer?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {(order.customer?.phone || order.shippingAddress?.phone) && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                      <div className="p-2 bg-success-muted rounded-lg">
                        <Phone className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Phone</p>
                        <p className="font-semibold text-foreground">
                          {order.customer?.phone || order.shippingAddress?.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card>
                <CardContent>
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    Shipping Address
                  </h3>
                  <div className="p-4 bg-muted rounded-xl">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p className="text-foreground">{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && <p className="text-foreground">{order.shippingAddress.addressLine2}</p>}
                      <p className="text-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                      <p className="text-foreground font-semibold">{order.shippingAddress.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Receipt / Invoice */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  Receipt / Invoice
                </h3>
                {order.receiptNumber ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-semibold">Receipt Number</p>
                        <p className="font-semibold text-foreground">{order.receiptNumber}</p>
                      </div>
                    </div>
                    {order.invoiceNumber && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Hash className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-semibold">Invoice Number</p>
                          <p className="font-semibold text-foreground">{order.invoiceNumber}</p>
                        </div>
                      </div>
                    )}
                    {order.receiptGeneratedAt && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                        <div className="p-2 bg-success-muted rounded-lg">
                          <Calendar className="w-4 h-4 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-semibold">Generated At</p>
                          <p className="font-semibold text-foreground">{new Date(order.receiptGeneratedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      {order.receiptShortUrl && (
                        <a
                          href={order.receiptShortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Receipt
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </a>
                      )}
                      <button
                        onClick={() => window.open(`/api/orders/${order.id}/receipt?format=html`, '_blank')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    {order.paymentStatus === 'PAID' ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">No receipt has been generated for this order yet.</p>
                        <button
                          onClick={handleGenerateReceipt}
                          disabled={generatingReceipt}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {generatingReceipt ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          {generatingReceipt ? 'Generating...' : 'Generate Receipt'}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Receipt will be available once payment is completed.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
