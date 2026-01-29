'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  CreditCard,
  Download,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Scale,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavPath } from '@/context/TenantContext';
import { Order, OrderTracking, OrderTimelineEvent, Return } from '@/lib/api/storefront';
import { cn } from '@/lib/utils';
import { ReportIssueDialog } from '@/components/account/ReportIssueDialog';
import { CancelOrderDialog } from '@/components/account/CancelOrderDialog';
import { RequestReturnDialog } from '@/components/account/RequestReturnDialog';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const timelineLineVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

interface OrderDetailsClientProps {
  order: Order;
  tracking: OrderTracking | null;
  returns: Return[];
}

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ElementType;
  bgColor: string;
}

const defaultStatus: StatusConfig = {
  label: 'Pending',
  color: 'text-amber-600 dark:text-amber-400',
  icon: Clock,
  bgColor: 'bg-amber-100 dark:bg-amber-900/30',
};

const statusConfig: Record<string, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    icon: Clock,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-600 dark:text-blue-400',
    icon: CheckCircle,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'text-purple-600 dark:text-purple-400',
    icon: Package,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'text-indigo-600 dark:text-indigo-400',
    icon: Truck,
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'text-green-600 dark:text-green-400',
    icon: CheckCircle,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-600 dark:text-red-400',
    icon: XCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'text-gray-600 dark:text-gray-400',
    icon: RefreshCw,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

function getStatusConfig(status: string | undefined): StatusConfig {
  if (!status) return defaultStatus;
  return statusConfig[status] || defaultStatus;
}

const returnStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending Review', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  APPROVED: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  RECEIVED: { label: 'Received', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  INSPECTING: { label: 'Inspecting', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export function OrderDetailsClient({ order, tracking, returns }: OrderDetailsClientProps) {
  const getNavPath = useNavPath();
  const [copiedTrackingNumber, setCopiedTrackingNumber] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  // Check if order can be cancelled
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  const status = getStatusConfig(order.status);
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const copyTrackingNumber = () => {
    const trackingNum = order.shippingDetails?.trackingNumber || order.trackingNumber;
    if (trackingNum) {
      navigator.clipboard.writeText(trackingNum);
      setCopiedTrackingNumber(true);
      setTimeout(() => setCopiedTrackingNumber(false), 2000);
    }
  };

  // Get timeline from tracking or order
  const timeline = tracking?.timeline || order.timeline || [];

  // Calculate tax display
  const taxAmount = order.taxAmount || order.tax || 0;
  const shippingCost = order.shippingCost || order.shipping || 0;
  const discountAmount = order.discountAmount || order.discount || 0;

  // Determine if it's GST (India) or other tax
  const hasGST = (order.cgstAmount || 0) + (order.sgstAmount || 0) + (order.igstAmount || 0) > 0;
  const hasVAT = (order.vatAmount || 0) > 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container-tenant py-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <Link
          href={getNavPath('/account/orders')}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-tenant-primary transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Order {order.orderNumber || `#${order.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <Calendar className="h-4 w-4" />
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex items-center gap-3"
          >
            <Badge className={cn(status.bgColor, status.color, 'border-0 px-3 py-1.5 text-sm')}>
              <StatusIcon className="h-4 w-4 mr-1.5" />
              {status.label}
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-[var(--tenant-primary)]/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-tenant-primary" />
                  </div>
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {timeline.length > 0 ? (
                  <div className="relative">
                    {timeline.map((event, index) => {
                      const eventStatus = getStatusConfig(event.status);
                      const EventIcon = eventStatus.icon;
                      const isLast = index === timeline.length - 1;
                      const isFirst = index === 0;

                      return (
                        <motion.div
                          key={event.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
                          className="flex gap-4 pb-8 last:pb-0"
                        >
                          <div className="relative flex flex-col items-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.15 + 0.1, type: 'spring', stiffness: 300 }}
                              className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center ring-4 ring-background z-10',
                                eventStatus.bgColor,
                                isFirst && 'ring-[var(--tenant-primary)]/20'
                              )}
                            >
                              <EventIcon className={cn('h-5 w-5', eventStatus.color)} />
                            </motion.div>
                            {!isLast && (
                              <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: index * 0.15 + 0.2, duration: 0.3 }}
                                className="w-0.5 flex-1 bg-gradient-to-b from-muted-foreground/30 to-muted origin-top"
                                style={{ minHeight: '2rem' }}
                              />
                            )}
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-semibold">{event.description || eventStatus.label}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {formatDate(event.timestamp)}
                            </p>
                            {event.createdBy && (
                              <p className="text-xs text-muted-foreground mt-1 bg-muted/50 inline-block px-2 py-0.5 rounded">
                                by {event.createdBy}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">No timeline events yet</p>
                    <p className="text-sm mt-1">Order updates will appear here</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 rounded-lg bg-muted/30"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={getNavPath(`/products/${item.productId}`)}
                        className="font-medium hover:text-tenant-primary truncate block"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">{item.variant}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item.price, order.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.price * item.quantity, order.currency)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tracking Information */}
          {(order.shippingDetails?.trackingNumber || order.trackingNumber) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium">
                        {order.shippingDetails?.trackingNumber || order.trackingNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyTrackingNumber}
                        className="h-8 w-8 p-0"
                      >
                        {copiedTrackingNumber ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {order.shippingDetails?.carrier && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Carrier: {order.shippingDetails.carrier}
                      </p>
                    )}
                  </div>
                  {order.shippingDetails?.trackingUrl && (
                    <Button variant="outline" asChild>
                      <a
                        href={order.shippingDetails.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Track Package
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
                {order.shippingDetails?.estimatedDeliveryDate && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Estimated Delivery: </span>
                      <span className="font-medium">
                        {new Date(order.shippingDetails.estimatedDeliveryDate).toLocaleDateString(
                          'en-US',
                          { weekday: 'long', month: 'long', day: 'numeric' }
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Returns Section */}
          {returns && returns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Return Requests ({returns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {returns.map((ret) => {
                    const statusInfo = returnStatusConfig[ret.status] ?? { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' };
                    return (
                      <motion.div
                        key={ret.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{ret.rmaNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(ret.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <Badge className={cn(statusInfo.bgColor, statusInfo.color, 'border-0')}>
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reason</span>
                            <span className="capitalize">{ret.reason.replace(/_/g, ' ').toLowerCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="capitalize">{ret.returnType.toLowerCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Refund Amount</span>
                            <span className="font-medium">{formatCurrency(ret.refundAmount, order.currency)}</span>
                          </div>
                        </div>

                        {ret.items && ret.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Items:</p>
                            {ret.items.map((item, idx) => (
                              <div key={item.id || idx} className="flex justify-between text-sm">
                                <span className="truncate flex-1">{item.productName}</span>
                                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {ret.status === 'REJECTED' && ret.rejectionReason && (
                          <div className="mt-3 p-2 rounded bg-red-50 text-red-700 text-sm">
                            <p className="font-medium">Rejection reason:</p>
                            <p>{ret.rejectionReason}</p>
                          </div>
                        )}

                        {ret.status === 'APPROVED' && (
                          <div className="mt-3 p-2 rounded bg-green-50 text-green-700 text-sm">
                            Please ship your items back. You will receive shipping instructions via email.
                          </div>
                        )}

                        {ret.status === 'COMPLETED' && (
                          <div className="mt-3 p-2 rounded bg-emerald-50 text-emerald-700 text-sm">
                            Your refund of {formatCurrency(ret.refundAmount, order.currency)} has been processed.
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>

              {shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(shippingCost, order.currency)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount, order.currency)}</span>
                </div>
              )}

              {/* Tax Breakdown */}
              {taxAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(taxAmount, order.currency)}</span>
                  </div>

                  {hasGST && (
                    <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                      {order.isInterstate ? (
                        <div className="flex justify-between">
                          <span>IGST</span>
                          <span>{formatCurrency(order.igstAmount || 0, order.currency)}</span>
                        </div>
                      ) : (
                        <>
                          {(order.cgstAmount || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>CGST</span>
                              <span>{formatCurrency(order.cgstAmount || 0, order.currency)}</span>
                            </div>
                          )}
                          {(order.sgstAmount || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>SGST</span>
                              <span>{formatCurrency(order.sgstAmount || 0, order.currency)}</span>
                            </div>
                          )}
                        </>
                      )}
                      {(order.gstCess || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>GST Cess</span>
                          <span>{formatCurrency(order.gstCess || 0, order.currency)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hasVAT && (
                    <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                      <div className="flex justify-between">
                        <span>VAT</span>
                        <span>{formatCurrency(order.vatAmount || 0, order.currency)}</span>
                      </div>
                      {order.isVatReverseCharge && (
                        <p className="text-xs italic">Reverse charge applied</p>
                      )}
                    </div>
                  )}

                  {order.taxBreakdown && order.taxBreakdown.length > 0 && !hasGST && !hasVAT && (
                    <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                      {order.taxBreakdown.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.jurisdictionName} ({item.rate}%)
                          </span>
                          <span>{formatCurrency(item.taxAmount, order.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {(order.shippingDetails || order.shippingAddress) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.customer && (
                  <p className="font-medium">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                )}
                {order.shippingDetails ? (
                  <>
                    <p className="text-sm text-muted-foreground">{order.shippingDetails.address1}</p>
                    {order.shippingDetails.address2 && (
                      <p className="text-sm text-muted-foreground">{order.shippingDetails.address2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {order.shippingDetails.city}, {order.shippingDetails.state}{' '}
                      {order.shippingDetails.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.shippingDetails.country}</p>
                  </>
                ) : order.shippingAddress ? (
                  <>
                    <p className="text-sm text-muted-foreground">{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && (
                      <p className="text-sm text-muted-foreground">{order.shippingAddress.address2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">{order.payment.method.toLowerCase()}</span>
                  </div>
                  {order.payment.gateway && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gateway</span>
                      <span className="capitalize">{order.payment.gateway}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={order.payment.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {order.payment.status}
                    </Badge>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs">{order.payment.transactionId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt / Invoice */}
          {order.receiptNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receipt No.</span>
                  <span className="font-mono font-medium">{order.receiptNumber}</span>
                </div>
                {order.invoiceNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice No.</span>
                    <span className="font-mono font-medium">{order.invoiceNumber}</span>
                  </div>
                )}
                {order.receiptGeneratedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Generated</span>
                    <span>{new Date(order.receiptGeneratedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {order.receiptShortUrl ? (
                <Button variant="outline" className="w-full" asChild>
                  <a href={order.receiptShortUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-60" />
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              )}

              <Button variant="secondary" className="w-full" onClick={() => setShowReportDialog(true)}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>

              {order.status === 'DELIVERED' && !returns.some(r => ['PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING'].includes(r.status)) && (
                <Button variant="outline" className="w-full" onClick={() => setShowReturnDialog(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Return
                </Button>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href={getNavPath('/cancellation-policy')}>
                  <Scale className="h-4 w-4 mr-2" />
                  Cancellation Policy
                </Link>
              </Button>

              {canCancel && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReportIssueDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />

      <CancelOrderDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderTotal={order.total}
        orderCreatedAt={order.createdAt}
        orderStatus={order.status}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onCancelled={() => {
          // Refresh the page to show updated status
          window.location.reload();
        }}
      />

      <RequestReturnDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        items={order.items}
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        onSuccess={() => {
          // Refresh the page to show updated status
          window.location.reload();
        }}
      />
    </motion.div>
  );
}