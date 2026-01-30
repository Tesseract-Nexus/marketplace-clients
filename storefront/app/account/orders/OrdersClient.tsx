'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, Truck, CheckCircle2, Clock, XCircle, ShoppingBag, ArrowRight, Ban, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { Order } from '@/lib/api/storefront';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { CancelOrderDialog } from '@/components/account/CancelOrderDialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15, delay: 0.2 },
  },
};

const previewVariants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

interface OrdersClientProps {
  orders: Order[];
}

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  color: string;
  dotColor?: string;
  showPulse?: boolean;
}

const defaultStatus: StatusConfig = { label: 'Pending', icon: Clock, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', dotColor: 'bg-gray-500' };

const statusConfig: Record<string, StatusConfig> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', dotColor: 'bg-amber-500', showPulse: true },
  PENDING: { label: 'Pending', icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', dotColor: 'bg-amber-500', showPulse: true },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', dotColor: 'bg-blue-500' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', dotColor: 'bg-blue-500' },
  processing: { label: 'Processing', icon: Package, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', dotColor: 'bg-purple-500', showPulse: true },
  PROCESSING: { label: 'Processing', icon: Package, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', dotColor: 'bg-purple-500', showPulse: true },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', dotColor: 'bg-indigo-500', showPulse: true },
  SHIPPED: { label: 'Shipped', icon: Truck, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', dotColor: 'bg-indigo-500', showPulse: true },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', dotColor: 'bg-green-500' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', dotColor: 'bg-green-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', dotColor: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', dotColor: 'bg-red-500' },
  refunded: { label: 'Refunded', icon: XCircle, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', dotColor: 'bg-gray-500' },
  REFUNDED: { label: 'Refunded', icon: XCircle, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', dotColor: 'bg-gray-500' },
};

function getStatusConfig(status: string | undefined): StatusConfig {
  if (!status) return defaultStatus;
  return statusConfig[status] || defaultStatus;
}

export function OrdersClient({ orders: ordersProp }: OrdersClientProps) {
  const { settings } = useTenant();
  const getNavPath = useNavPath();
  const [activeTab, setActiveTab] = useState('all');
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelOrderNumber, setCancelOrderNumber] = useState<string | undefined>();
  const [cancelOrderTotal, setCancelOrderTotal] = useState<number | undefined>();
  const [cancelOrderCreatedAt, setCancelOrderCreatedAt] = useState<string | undefined>();
  const [cancelOrderStatus, setCancelOrderStatus] = useState<string | undefined>();
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const orders = ordersProp || [];

  const filteredOrders =
    activeTab === 'all'
      ? orders
      : orders.filter(
          (order) =>
            (order.status || '').toLowerCase() === activeTab.toLowerCase()
        );

  const handleMouseEnter = useCallback((orderId: string) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => {
      setHoveredOrderId(orderId);
    }, 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredOrderId(null);
    }, 200);
  }, []);

  const handlePreviewEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handlePreviewLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredOrderId(null);
    }, 200);
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-tenant-primary" />
            <TranslatedUIText text="Order History" />
          </h2>
          <span className="text-sm text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-muted/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TranslatedUIText text="All Orders" />
            </TabsTrigger>
            <TabsTrigger value="processing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TranslatedUIText text="Processing" />
            </TabsTrigger>
            <TabsTrigger value="shipped" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TranslatedUIText text="Shipped" />
            </TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TranslatedUIText text="Delivered" />
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="space-y-1"
            >
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const status = getStatusConfig(order.status);
                  const items = order.items || [];
                  const itemCount = items.length;
                  const thumbs = items.slice(0, 3);
                  const isCancellable = order.status === 'PENDING' || order.status === 'CONFIRMED';

                  return (
                    <motion.div
                      key={order.id}
                      variants={itemVariants}
                      layout
                      className="relative"
                    >
                      {/* Compact Row */}
                      <Link
                        href={getNavPath(`/account/orders/${order.id}`)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group',
                          'hover:bg-muted/50',
                          hoveredOrderId === order.id && 'bg-muted/50'
                        )}
                        onMouseEnter={() => handleMouseEnter(order.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Thumbnail Stack */}
                        <div className="relative shrink-0" style={{ width: `${24 + (thumbs.length - 1) * 14}px`, height: '24px' }}>
                          {thumbs.map((item, i) => (
                            <div
                              key={item.id}
                              className="absolute top-0 w-6 h-6 rounded-full overflow-hidden ring-2 ring-card bg-muted"
                              style={{ left: `${i * 14}px`, zIndex: thumbs.length - i }}
                            >
                              <Image
                                src={item.image || '/placeholder.svg'}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Order Info */}
                        <span className="font-mono text-sm font-medium shrink-0">
                          {order.orderNumber || `#${order.id.slice(0, 8)}`}
                        </span>
                        <span className="text-muted-foreground text-sm hidden sm:inline">·</span>
                        <span className="text-sm text-muted-foreground hidden sm:inline shrink-0">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-muted-foreground text-sm hidden sm:inline">·</span>
                        <span className="text-sm text-muted-foreground hidden sm:inline shrink-0">
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-muted-foreground text-sm">·</span>
                        <span className="text-sm font-bold text-tenant-primary shrink-0">
                          ${order.total.toFixed(2)}
                        </span>

                        {/* Spacer */}
                        <div className="flex-1 min-w-0" />

                        {/* Cancel Button (hover only, desktop) */}
                        {isCancellable && (
                          <button
                            className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center w-7 h-7 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                            title="Cancel Order"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCancelOrderId(order.id);
                              setCancelOrderNumber(order.orderNumber);
                              setCancelOrderTotal(order.total);
                              setCancelOrderCreatedAt(order.createdAt);
                              setCancelOrderStatus(order.status);
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {/* Status Badge */}
                        <Badge className={cn('gap-1 px-2 py-0.5 text-xs shrink-0', status.color)}>
                          {status.showPulse && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                            </span>
                          )}
                          {status.label}
                        </Badge>

                        {/* Chevron */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {/* Hover Preview (desktop only) */}
                      <AnimatePresence>
                        {hoveredOrderId === order.id && (
                          <motion.div
                            variants={previewVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="hidden sm:block absolute left-4 right-4 z-50 mt-1 bg-card border rounded-xl shadow-lg p-4"
                            onMouseEnter={handlePreviewEnter}
                            onMouseLeave={handlePreviewLeave}
                          >
                            {/* Product List */}
                            <div className="space-y-2.5 mb-3">
                              {items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border">
                                    <Image
                                      src={item.image || '/placeholder.svg'}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.quantity} × ${item.price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {itemCount > 3 && (
                                <p className="text-xs text-muted-foreground pl-[52px]">
                                  +{itemCount - 3} more item{itemCount - 3 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>

                            {/* Tracking */}
                            {order.trackingNumber && (
                              <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-md text-xs">
                                <Truck className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="text-muted-foreground">Tracking:</span>
                                <span className="font-mono font-medium">{order.trackingNumber}</span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-7 text-xs gap-1 hover:border-tenant-primary hover:text-tenant-primary"
                              >
                                <a href={`/api/orders/${order.id}/receipt?format=pdf`} download onClick={(e) => e.stopPropagation()}>
                                  <Download className="h-3 w-3" />
                                  <TranslatedUIText text="Invoice" />
                                </a>
                              </Button>
                              {isCancellable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCancelOrderId(order.id);
                                    setCancelOrderNumber(order.orderNumber);
                                    setCancelOrderTotal(order.total);
                                    setCancelOrderCreatedAt(order.createdAt);
                                    setCancelOrderStatus(order.status);
                                  }}
                                >
                                  <Ban className="h-3 w-3" />
                                  <TranslatedUIText text="Cancel" />
                                </Button>
                              )}
                              {order.status === 'DELIVERED' && (
                                <>
                                  <Button variant="outline" size="sm" className="h-7 text-xs">
                                    <TranslatedUIText text="Write Review" />
                                  </Button>
                                  <Button size="sm" className="h-7 text-xs btn-tenant-primary">
                                    <TranslatedUIText text="Buy Again" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-7 text-xs gap-1 ml-auto hover:border-tenant-primary hover:text-tenant-primary"
                              >
                                <Link href={getNavPath(`/account/orders/${order.id}`)}>
                                  <TranslatedUIText text="View Details" />
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  variants={emptyStateVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-center py-16"
                >
                  <motion.div
                    className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--tenant-primary)]/10"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Package className="h-12 w-12 text-tenant-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2"><TranslatedUIText text="No orders found" /></h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {activeTab === 'all'
                      ? <TranslatedUIText text="You haven't placed any orders yet. Start exploring our products!" />
                      : <><TranslatedUIText text="No" /> {activeTab} <TranslatedUIText text="orders found. Check back later or view all orders." /></>}
                  </p>
                  <Button asChild className="btn-tenant-primary gap-2">
                    <Link href={getNavPath('/products')}>
                      <ShoppingBag className="h-4 w-4" />
                      <TranslatedUIText text="Start Shopping" />
                    </Link>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
      {cancelOrderId && (
        <CancelOrderDialog
          orderId={cancelOrderId}
          orderNumber={cancelOrderNumber}
          orderTotal={cancelOrderTotal}
          orderCreatedAt={cancelOrderCreatedAt}
          orderStatus={cancelOrderStatus}
          open={!!cancelOrderId}
          onOpenChange={(open) => {
            if (!open) {
              setCancelOrderId(null);
              setCancelOrderNumber(undefined);
            }
          }}
          onCancelled={() => {
            setCancelOrderId(null);
            setCancelOrderNumber(undefined);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
