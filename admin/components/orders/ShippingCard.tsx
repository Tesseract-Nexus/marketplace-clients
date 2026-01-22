'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { shippingService } from '@/lib/api/shipping';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  Shipment,
  ShipmentStatus,
  Order,
} from '@/lib/api/types';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Plus,
  AlertCircle,
  Box,
  Scale,
  RefreshCw,
  Printer,
  Ban,
} from 'lucide-react';

interface ShippingCardProps {
  order: Order;
  onShipmentCreated?: () => void;
}

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

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

export function ShippingCard({ order, onShipmentCreated }: ShippingCardProps) {
  const router = useRouter();
  const { showConfirm } = useDialog();
  const { currentTenant } = useTenant();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [quickShipping, setQuickShipping] = useState(false);
  const [printingLabel, setPrintingLabel] = useState<string | null>(null);

  useEffect(() => {
    loadShipments();
  }, [order.id]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shippingService.getShipmentsByOrder(order.id);
      setShipments(response.data || []);
    } catch (err) {
      console.error('Failed to load shipments:', err);
      // Don't show error for 404 - means no shipments yet
      if (!(err instanceof Error && err.message.includes('404'))) {
        setError(err instanceof Error ? err.message : 'Failed to load shipments');
      }
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelShipment = async (shipmentId: string) => {
    const confirmed = await showConfirm({
      title: 'Cancel Shipment',
      message: 'Are you sure you want to cancel this shipment? This action cannot be undone.',
      confirmLabel: 'Cancel Shipment',
      cancelLabel: 'Keep Shipment',
    });

    if (!confirmed) return;

    try {
      setCancelling(shipmentId);
      await shippingService.cancelShipment(shipmentId, 'Cancelled by admin');
      await loadShipments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel shipment');
    } finally {
      setCancelling(null);
    }
  };

  const handlePrintLabel = async (shipmentId: string) => {
    try {
      setPrintingLabel(shipmentId);
      setError(null);

      // Fetch the label through the API proxy with tenant context
      const headers: Record<string, string> = {};
      if (currentTenant?.id) {
        headers['x-jwt-claim-tenant-id'] = currentTenant.id;
      }

      const response = await fetch(`/api/shipping/shipments/${shipmentId}/label`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch label');
      }

      // Get the PDF blob and create a URL to open it
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      // Clean up the blob URL after a delay (give browser time to load)
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Failed to print label:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch label');
    } finally {
      setPrintingLabel(null);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const styles: Record<ShipmentStatus, string> = {
      PENDING: 'bg-warning-muted text-warning-foreground border-warning/30',
      CREATED: 'bg-primary/20 text-primary border-primary/30',
      PICKED_UP: 'bg-primary/10 text-primary border-primary/30',
      IN_TRANSIT: 'bg-accent text-accent-foreground border-accent',
      OUT_FOR_DELIVERY: 'bg-success-muted text-success border-success/30',
      DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      FAILED: 'bg-destructive/10 text-destructive border-destructive/30',
      CANCELLED: 'bg-muted text-foreground border-border',
      RETURNED: 'bg-warning-muted text-warning border-warning/30',
    };
    const labels: Record<ShipmentStatus, string> = {
      PENDING: 'Pending',
      CREATED: 'Created',
      PICKED_UP: 'Picked Up',
      IN_TRANSIT: 'In Transit',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
      RETURNED: 'Returned',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getStatusIcon = (status: ShipmentStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return <Truck className="w-5 h-5 text-accent-foreground" />;
      default:
        return <Package className="w-5 h-5 text-primary" />;
    }
  };

  // Check for shipping address availability (backend returns as 'shipping' not 'shippingAddress')
  const hasShippingAddress = !!(order.shipping || order.shippingAddress);

  const canCreateShipment =
    order.status !== 'CANCELLED' &&
    order.paymentStatus === 'PAID' &&
    order.fulfillmentStatus !== 'DELIVERED' &&
    hasShippingAddress &&
    shipments.filter(s => s.status !== 'CANCELLED').length === 0;

  const handleCreateShipment = () => {
    router.push(`/orders/${order.id}/ship`);
  };

  const handleQuickShip = async () => {
    if (!hasShippingAddress) {
      setError('Order has no shipping address');
      return;
    }

    try {
      setQuickShipping(true);
      setError(null);

      // Construct shipping address from either legacy shippingAddress or new shipping + customer format
      let shippingAddress;
      if (order.shippingAddress) {
        // Legacy format - use as-is
        shippingAddress = order.shippingAddress;
      } else if (order.shipping) {
        // New backend format - construct from shipping + customer
        const firstName = order.customer?.firstName || order.customerName?.split(' ')[0] || 'Customer';
        const lastName = order.customer?.lastName || order.customerName?.split(' ').slice(1).join(' ') || '';
        shippingAddress = {
          firstName,
          lastName,
          phone: order.customer?.phone,
          email: order.customer?.email || order.customerEmail,
          addressLine1: order.shipping.street,
          city: order.shipping.city,
          state: order.shipping.state,
          postalCode: order.shipping.postalCode,
          country: order.shipping.countryCode || order.shipping.country,
        };
      } else {
        throw new Error('No shipping address found');
      }

      await shippingService.quickShip({
        id: order.id,
        orderNumber: order.orderNumber,
        shippingAddress,
        items: order.items,
        // Use the carrier and cost from the order (selected at checkout)
        carrier: order.shipping?.carrier,
        shippingCost: parseFloat(order.shippingCost) || undefined,
        // Pass package metrics stored from checkout for accurate shipping
        packageWeight: order.shipping?.packageWeight,
        packageLength: order.shipping?.packageLength,
        packageWidth: order.shipping?.packageWidth,
        packageHeight: order.shipping?.packageHeight,
      });
      await loadShipments();
      onShipmentCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment');
    } finally {
      setQuickShipping(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Shipping & Fulfillment
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadShipments}
              disabled={loading || quickShipping}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            {canCreateShipment && (
              <>
                <Button
                  size="sm"
                  onClick={handleQuickShip}
                  disabled={quickShipping}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {quickShipping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Shipping...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 mr-1" />
                      Quick Ship
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateShipment}
                  disabled={quickShipping}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Custom
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {/* Skeleton for shipment card */}
            <div className="p-4 bg-muted rounded-xl border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-muted rounded" />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-muted rounded" />
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </div>
                    <div className="h-3 w-32 bg-muted rounded mt-1.5" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-muted rounded mt-0.5" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8 bg-muted rounded-xl">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No shipments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canCreateShipment ? (
                <>Use <strong>Quick Ship</strong> for standard shipping or <strong>Custom</strong> for specific package details</>
              ) : order.paymentStatus !== 'PAID' ? (
                'Payment must be completed before shipping'
              ) : !hasShippingAddress ? (
                'Order has no shipping address'
              ) : order.fulfillmentStatus === 'DELIVERED' ? (
                'Order has already been delivered'
              ) : (
                'Shipment creation not available for this order'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="p-4 bg-muted rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(shipment.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {shipment.carrier}
                        </span>
                        {getStatusBadge(shipment.status)}
                      </div>
                      {shipment.trackingNumber && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Tracking: {shipment.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {shipment.trackingUrl && (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Track Shipment
                      </a>
                    )}
                    {(shipment.labelUrl || shipment.trackingNumber) && (
                      <button
                        onClick={() => handlePrintLabel(shipment.id)}
                        disabled={printingLabel === shipment.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-muted hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {printingLabel === shipment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                        {printingLabel === shipment.id ? 'Loading...' : 'Print Label'}
                      </button>
                    )}
                    {shipment.status === 'PENDING' || shipment.status === 'CREATED' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelShipment(shipment.id)}
                        disabled={cancelling === shipment.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {cancelling === shipment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Scale className="w-4 h-4" />
                    <span>{shipment.weight} kg</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Box className="w-4 h-4" />
                    <span>{shipment.length}x{shipment.width}x{shipment.height} cm</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {shipment.estimatedDelivery
                        ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                        : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    {shipment.currency === 'INR' ? '₹' : shipment.currency === 'USD' ? '$' : shipment.currency === 'EUR' ? '€' : shipment.currency === 'GBP' ? '£' : ''}{(shipment.shippingCost ?? 0).toFixed(2)}
                  </div>
                </div>

                {shipment.toAddress && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>
                        {shipment.toAddress.name}, {shipment.toAddress.city}, {shipment.toAddress.state} {shipment.toAddress.postalCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
