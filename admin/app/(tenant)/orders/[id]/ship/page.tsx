'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { orderService } from '@/lib/services/orderService';
import { shippingService } from '@/lib/api/shipping';
import {
  Order,
  CreateShipmentRequest,
  ShippingRate,
  ShipmentAddress,
} from '@/lib/api/types';
import {
  Truck,
  Package,
  MapPin,
  ArrowLeft,
  Loader2,
  Scale,
  Box,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Building,
  User,
  Phone,
  Mail,
} from 'lucide-react';

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

// Placeholder for when no warehouse settings exist
const EMPTY_FROM_ADDRESS: ShipmentAddress = {
  name: '',
  company: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function CreateShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    weight: 0.5,
    length: 20,
    width: 15,
    height: 10,
    carrier: '',
    serviceType: 'standard' as 'express' | 'standard' | 'economy',
    notes: '',
  });

  // From address (warehouse) - loaded from shipping settings
  const [fromAddress, setFromAddress] = useState<ShipmentAddress>(EMPTY_FROM_ADDRESS);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrder(orderId);
      const orderData = response?.data || response;
      setOrder(orderData as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Load warehouse settings from shipping service
  const loadShippingSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const settings = await shippingService.getShippingSettings();
      if (settings?.warehouse) {
        setFromAddress(settings.warehouse);
      }
    } catch (err) {
      console.error('Failed to load shipping settings:', err);
      // Don't show error - settings are optional
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadOrder();
    loadShippingSettings();
  }, [loadOrder, loadShippingSettings]);

  // Build to-address from either shippingAddress (legacy) or shipping+customer (new format)
  const getToAddress = () => {
    if (order?.shippingAddress) {
      return {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        phone: order.shippingAddress.phone,
        street: order.shippingAddress.addressLine1,
        street2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state || '',
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      };
    } else if (order?.shipping) {
      const firstName = order.customer?.firstName || order.customerName?.split(' ')[0] || 'Customer';
      const lastName = order.customer?.lastName || order.customerName?.split(' ').slice(1).join(' ') || '';
      return {
        name: `${firstName} ${lastName}`,
        phone: order.customer?.phone,
        street: order.shipping.street,
        city: order.shipping.city,
        state: order.shipping.state || '',
        postalCode: order.shipping.postalCode,
        country: order.shipping.countryCode || order.shipping.country,
      };
    }
    return null;
  };

  const loadRates = async () => {
    const toAddress = getToAddress();
    if (!toAddress) return;

    try {
      setLoadingRates(true);
      const response = await shippingService.getRates({
        fromAddress: fromAddress,
        toAddress,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
      });
      setRates(response.rates.filter(r => r.available));
    } catch (err) {
      console.error('Failed to load rates:', err);
      // Don't show error - rates are optional
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    if (order && formData.weight > 0) {
      const debounce = setTimeout(() => {
        loadRates();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [order, formData.weight, formData.length, formData.width, formData.height]);

  const handleCreateShipment = async () => {
    const toAddress = getToAddress();
    if (!toAddress) {
      setError('Order has no shipping address');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const request: CreateShipmentRequest = {
        orderId: order!.id,
        orderNumber: order!.orderNumber,
        carrier: formData.carrier || undefined,
        fromAddress: fromAddress,
        toAddress,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        serviceType: formData.serviceType,
      };

      await shippingService.createShipment(request);
      setSuccess(true);

      // Redirect back to order after a short delay
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment');
    } finally {
      setCreating(false);
    }
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="border-error/30">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-error mb-4" />
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

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="border-success/30">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Shipment Created!</h2>
              <p className="text-muted-foreground mb-6">The shipment has been created successfully. Redirecting to order...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ORDERS_MANAGE}
      fallback="styled"
      fallbackTitle="Order Shipping Access Required"
      fallbackDescription="You don't have the required permissions to view order shipping. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Create Shipment"
          description={`For order ${order.orderNumber}`}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
            { label: order.orderNumber, href: `/orders/${orderId}` },
            { label: 'Create Shipment' },
          ]}
          actions={
            <Button variant="outline" onClick={() => router.push(`/orders/${orderId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Order
            </Button>
          }
        />

        {error && (
          <div className="p-4 bg-error-muted border border-error/30 rounded-xl flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Package Details */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Package Details
                </h3>

                <div className="space-y-4">
                  {/* Dimensions */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Dimensions (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <input
                          type="number"
                          value={formData.length}
                          onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                          className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                          placeholder="Length"
                          min="1"
                        />
                        <span className="text-xs text-muted-foreground">Length</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.width}
                          onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                          className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                          placeholder="Width"
                          min="1"
                        />
                        <span className="text-xs text-muted-foreground">Width</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                          className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                          placeholder="Height"
                          min="1"
                        />
                        <span className="text-xs text-muted-foreground">Height</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Scale className="w-4 h-4 inline mr-1" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      placeholder="Weight in kg"
                      min="0.1"
                      step="0.1"
                    />
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Service Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['economy', 'standard', 'express'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, serviceType: type })}
                          className={cn(
                            "px-4 py-3 border rounded-lg text-sm font-medium transition-colors",
                            formData.serviceType === type
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/30 text-foreground"
                          )}
                        >
                          <div className="capitalize">{type}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {type === 'economy' && '5-7 days'}
                            {type === 'standard' && '3-5 days'}
                            {type === 'express' && '1-2 days'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      placeholder="Special instructions for shipping..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Rates */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  Shipping Rates
                </h3>

                {loadingRates ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 mx-auto text-primary animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">Loading available rates...</p>
                  </div>
                ) : rates.length > 0 ? (
                  <div className="space-y-2">
                    {rates.map((rate) => (
                      <label
                        key={`${rate.carrier}-${rate.serviceCode}`}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors",
                          formData.carrier === rate.carrier
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="carrier"
                            value={rate.carrier}
                            checked={formData.carrier === rate.carrier}
                            onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                            className="w-4 h-4 text-primary"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{rate.carrier}</p>
                            <p className="text-sm text-muted-foreground">
                              {rate.serviceName} - {rate.estimatedDays} days
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-lg text-foreground">
                          ${rate.rate.toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-muted rounded-xl">
                    <Truck className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No rates available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Auto-select will be used when creating the shipment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Addresses */}
          <div className="space-y-6">
            {/* Ship From */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  Ship From (Warehouse)
                </h3>

                {loadingSettings ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="h-3 w-10 bg-muted rounded mb-1" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                      <div>
                        <div className="h-3 w-14 bg-muted rounded mb-1" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <div className="h-3 w-12 bg-muted rounded mb-1" />
                      <div className="h-10 bg-muted rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="h-3 w-8 bg-muted rounded mb-1" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                      <div>
                        <div className="h-3 w-10 bg-muted rounded mb-1" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="h-3 w-16 bg-muted rounded mb-1" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                      <div>
                        <div className="h-3 w-14 bg-muted rounded mb-1" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                    </div>
                  </div>
                ) : !fromAddress.street && !fromAddress.name ? (
                  <div className="p-4 bg-warning-muted border border-warning/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">No warehouse configured</p>
                        <p className="text-sm text-warning-foreground mt-1">
                          Please fill in your warehouse address below, or configure it in{' '}
                          <a href="/settings/shipping-carriers" className="underline hover:no-underline">
                            Shipping Settings
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className={cn(
                  "space-y-3",
                  loadingSettings && "hidden",
                  !loadingSettings && !fromAddress.street && !fromAddress.name && "mt-4"
                )}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Name</label>
                      <input
                        type="text"
                        value={fromAddress.name}
                        onChange={(e) => setFromAddress({ ...fromAddress, name: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Company</label>
                      <input
                        type="text"
                        value={fromAddress.company}
                        onChange={(e) => setFromAddress({ ...fromAddress, company: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Street</label>
                    <input
                      type="text"
                      value={fromAddress.street}
                      onChange={(e) => setFromAddress({ ...fromAddress, street: e.target.value })}
                      className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">City</label>
                      <input
                        type="text"
                        value={fromAddress.city}
                        onChange={(e) => setFromAddress({ ...fromAddress, city: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">State</label>
                      <input
                        type="text"
                        value={fromAddress.state}
                        onChange={(e) => setFromAddress({ ...fromAddress, state: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={fromAddress.postalCode}
                        onChange={(e) => setFromAddress({ ...fromAddress, postalCode: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Country</label>
                      <input
                        type="text"
                        value={fromAddress.country}
                        onChange={(e) => setFromAddress({ ...fromAddress, country: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                      <input
                        type="text"
                        value={fromAddress.phone}
                        onChange={(e) => setFromAddress({ ...fromAddress, phone: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Email</label>
                      <input
                        type="text"
                        value={fromAddress.email}
                        onChange={(e) => setFromAddress({ ...fromAddress, email: e.target.value })}
                        className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ship To */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Ship To (Customer)
                </h3>

                {(() => {
                  const toAddr = getToAddress();
                  if (toAddr) {
                    return (
                      <div className="p-4 bg-muted rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {toAddr.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {toAddr.street}
                          {toAddr.street2 && <><br />{toAddr.street2}</>}
                          <br />
                          {toAddr.city}, {toAddr.state} {toAddr.postalCode}
                          <br />
                          {toAddr.country}
                        </p>
                        {toAddr.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {toAddr.phone}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-error-muted rounded-xl text-error">
                      <AlertCircle className="w-5 h-5 inline mr-2" />
                      No shipping address on this order
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  Order Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Number</span>
                    <span className="font-medium text-foreground">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium text-foreground">{order.totalItems} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Total</span>
                    <span className="font-bold text-foreground">${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-foreground mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate flex-1">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="text-foreground ml-2">
                          ${parseFloat(item.totalPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Button */}
        <Card>
          <CardContent className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {formData.carrier && rates.find(r => r.carrier === formData.carrier) && (
                <span>
                  Selected: <strong>{formData.carrier}</strong> - ${rates.find(r => r.carrier === formData.carrier)?.rate.toFixed(2)}
                </span>
              )}
              {!formData.carrier && (
                <span>Carrier will be auto-selected based on availability</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/orders/${orderId}`)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateShipment}
                disabled={creating || !getToAddress()}
                className="bg-primary hover:bg-primary"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Shipment...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 mr-2" />
                    Create Shipment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </PermissionGate>
  );
}
