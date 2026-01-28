'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, Truck, CheckCircle2, Clock, XCircle, ShoppingBag, ArrowRight, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { Order } from '@/lib/api/storefront';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { CancelOrderDialog } from '@/components/account/CancelOrderDialog';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      delay: 0.2,
    },
  },
};

interface OrdersClientProps {
  orders: Order[];
}

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  color: string;
  showPulse?: boolean;
}

// Default status config
const defaultStatus: StatusConfig = { label: 'Pending', icon: Clock, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };

// Status config supports both uppercase (from backend) and lowercase values
const statusConfig: Record<string, StatusConfig> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', showPulse: true },
  PENDING: { label: 'Pending', icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', showPulse: true },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  processing: { label: 'Processing', icon: Package, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', showPulse: true },
  PROCESSING: { label: 'Processing', icon: Package, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', showPulse: true },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', showPulse: true },
  SHIPPED: { label: 'Shipped', icon: Truck, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', showPulse: true },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  refunded: { label: 'Refunded', icon: XCircle, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  REFUNDED: { label: 'Refunded', icon: XCircle, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
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

  // Ensure orders is always an array
  const orders = ordersProp || [];

  const filteredOrders =
    activeTab === 'all'
      ? orders
      : orders.filter(
          (order) =>
            (order.status || '').toLowerCase() === activeTab.toLowerCase()
        );

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
              className="space-y-4"
            >
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const status = getStatusConfig(order.status);
                  const StatusIcon = status.icon;

                  return (
                    <motion.div
                      key={order.id}
                      variants={itemVariants}
                      layout
                      className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 group"
                    >
                      {/* Order Header */}
                      <div className="bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide"><TranslatedUIText text="Order" /></p>
                            <p className="font-mono font-semibold text-sm">
                              {order.orderNumber || `#${order.id.slice(0, 8)}`}
                            </p>
                          </div>
                          <Separator orientation="vertical" className="h-8 hidden sm:block" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide"><TranslatedUIText text="Date" /></p>
                            <p className="font-medium text-sm">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <Separator orientation="vertical" className="h-8 hidden sm:block" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide"><TranslatedUIText text="Total" /></p>
                            <p className="font-bold text-tenant-primary">${order.total.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Animated Status Badge */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Badge className={cn('gap-1.5 px-3 py-1', status.color)}>
                            {status.showPulse && (
                              <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                              </span>
                            )}
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </Badge>
                        </motion.div>
                      </div>

                      {/* Order Items */}
                      <div className="p-4">
                        <div className="space-y-3">
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-4 group/item"
                            >
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border group-hover/item:ring-tenant-primary/50 transition-all">
                                <Image
                                  src={item.image || '/placeholder.svg'}
                                  alt={item.name}
                                  fill
                                  className="object-cover group-hover/item:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate group-hover/item:text-tenant-primary transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} x ${item.price.toFixed(2)}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                          {(order.items?.length || 0) > 3 && (
                            <p className="text-sm text-muted-foreground pl-20">
                              +{(order.items?.length || 0) - 3} more item{(order.items?.length || 0) - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        {/* Tracking Info */}
                        {order.trackingNumber && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center gap-3 border border-indigo-100 dark:border-indigo-900"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground"><TranslatedUIText text="Tracking Number" /></p>
                              <p className="font-mono text-sm font-medium">{order.trackingNumber}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-end gap-3 mt-4 pt-4 border-t">
                          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30"
                              onClick={() => {
                                setCancelOrderId(order.id);
                                setCancelOrderNumber(order.orderNumber);
                                setCancelOrderTotal(order.total);
                                setCancelOrderCreatedAt(order.createdAt);
                                setCancelOrderStatus(order.status);
                              }}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <TranslatedUIText text="Cancel Order" />
                            </Button>
                          )}
                          {order.status === 'DELIVERED' && (
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <TranslatedUIText text="Write Review" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="group/btn hover:border-tenant-primary hover:text-tenant-primary transition-colors"
                          >
                            <Link href={getNavPath(`/account/orders/${order.id}`)}>
                              <TranslatedUIText text="View Details" />
                              <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Link>
                          </Button>
                          {order.status === 'DELIVERED' && (
                            <Button className="btn-tenant-primary" size="sm">
                              <TranslatedUIText text="Buy Again" />
                            </Button>
                          )}
                        </div>
                      </div>
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
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
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
