'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Check, Edit2, Trash2, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  CustomerAddress,
  getCustomerAddresses,
  deleteCustomerAddress,
  setDefaultAddress,
} from '@/lib/api/customers';
import { cn } from '@/lib/utils';
import { AddressForm } from './AddressForm';

interface AddressSelectorProps {
  selectedAddressId?: string;
  onSelectAddress: (address: CustomerAddress) => void;
  addressType?: 'SHIPPING' | 'BILLING' | 'BOTH';
}

export function AddressSelector({
  selectedAddressId,
  onSelectAddress,
  addressType = 'SHIPPING',
}: AddressSelectorProps) {
  const { tenant } = useTenant();
  const { customer, accessToken } = useAuthStore();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (customer?.id) {
      loadAddresses();
    } else {
      setIsLoading(false);
    }
  }, [customer?.id, accessToken]);

  const loadAddresses = async () => {
    if (!customer?.id || !tenant) return;

    setIsLoading(true);
    try {
      const data = await getCustomerAddresses(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        accessToken
      );
      // Filter by address type
      // Include addresses with matching type, 'BOTH' type, or no type set (legacy/generic addresses)
      const filtered = data.filter(
        (addr) => !addr.type || addr.type === addressType || addr.type === 'BOTH'
      );
      setAddresses(filtered);

      // Auto-select default address if none selected
      if (!selectedAddressId && filtered.length > 0) {
        const defaultAddr = filtered.find((a) => a.isDefault) ?? filtered[0];
        if (defaultAddr) {
          onSelectAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!customer?.id || !tenant) return;

    setDeletingId(addressId);
    try {
      await deleteCustomerAddress(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        addressId,
        accessToken
      );
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      if (selectedAddressId === addressId) {
        const remaining = addresses.filter((a) => a.id !== addressId);
        const firstRemaining = remaining[0];
        if (firstRemaining) {
          onSelectAddress(firstRemaining);
        }
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!customer?.id || !tenant) return;

    try {
      await setDefaultAddress(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        addressId,
        accessToken
      );
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }))
      );
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const handleAddressAdded = (newAddress: CustomerAddress) => {
    setAddresses((prev) => [...prev, newAddress]);
    onSelectAddress(newAddress);
    setShowAddForm(false);
    setEditingAddress(null);
  };

  const handleAddressUpdated = (updatedAddress: CustomerAddress) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === updatedAddress.id ? updatedAddress : a))
    );
    if (selectedAddressId === updatedAddress.id) {
      onSelectAddress(updatedAddress);
    }
    setEditingAddress(null);
  };

  if (!customer) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-tenant-primary" />
          Saved Addresses
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 bg-muted/30 rounded-lg border border-dashed"
        >
          <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-3">No saved addresses yet</p>
          <Button onClick={() => setShowAddForm(true)} className="btn-tenant-primary gap-1.5">
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
                    selectedAddressId === address.id
                      ? 'ring-2 ring-tenant-primary bg-[var(--tenant-primary)]/5'
                      : 'hover:border-tenant-primary/50'
                  )}
                  onClick={() => onSelectAddress(address)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                          selectedAddressId === address.id
                            ? 'border-tenant-primary bg-tenant-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {selectedAddressId === address.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {address.firstName} {address.lastName}
                          </p>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-sm text-muted-foreground">{address.country}</p>
                        {address.phone && (
                          <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="h-8 w-8 p-0"
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAddress(address)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        disabled={deletingId === address.id}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {deletingId === address.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog
        open={showAddForm || !!editingAddress}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false);
            setEditingAddress(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            address={editingAddress || undefined}
            addressType={addressType}
            onSuccess={editingAddress ? handleAddressUpdated : handleAddressAdded}
            onCancel={() => {
              setShowAddForm(false);
              setEditingAddress(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
