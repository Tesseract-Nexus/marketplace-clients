'use client';

import { useState, useEffect } from 'react';
import { Camera, Mail, Phone, Edit2, Check, X, Loader2, MapPin, Plus, Trash2, Home, Building, Tag, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';
import { toast } from 'sonner';
import {
  CustomerAddress,
  AddressType,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
} from '@/lib/api/customers';
import { AddressAutocomplete, type ParsedAddressData } from '@/components/AddressAutocomplete';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export default function AccountPage() {
  const { settings, tenant } = useTenant();
  const tenantId = tenant?.id || '';
  const storefrontId = tenant?.storefrontId || '';
  const { customer, accessToken, updateCustomer } = useAuthStore();
  const wishlistItems = useWishlistStore((state) => state.items);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Address state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    countryCode: 'US',
    phone: '',
    type: 'SHIPPING' as AddressType,
  });

  // Initialize profile from customer data
  useEffect(() => {
    if (customer) {
      setProfile({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
      });
    }
  }, [customer]);

  // Fetch addresses
  useEffect(() => {
    async function fetchAddresses() {
      if (!customer?.id || !accessToken || !tenantId) return;

      setIsLoadingAddresses(true);
      try {
        const data = await getCustomerAddresses(tenantId, storefrontId || '', customer.id, accessToken);
        setAddresses(data);
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    }

    fetchAddresses();
  }, [customer?.id, accessToken, tenantId, storefrontId]);

  const handleAddAddress = async () => {
    if (!customer?.id || !accessToken || !tenantId) return;

    setIsAddingAddress(true);
    try {
      if (editingAddress) {
        // Update existing address
        const updated = await updateCustomerAddress(
          tenantId,
          storefrontId || '',
          customer.id,
          editingAddress.id,
          { ...newAddress, isDefault: editingAddress.isDefault },
          accessToken
        );
        setAddresses(addresses.map(a => a.id === editingAddress.id ? updated : a));
        toast.success('Address updated successfully');
      } else {
        // Add new address
        const created = await addCustomerAddress(
          tenantId,
          storefrontId || '',
          customer.id,
          { ...newAddress, isDefault: addresses.length === 0 },
          accessToken
        );
        setAddresses([...addresses, created]);
        toast.success('Address added successfully');
      }
      resetAddressForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(editingAddress ? 'Failed to update address' : 'Failed to add address');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const resetAddressForm = () => {
    setShowAddAddress(false);
    setEditingAddress(null);
    setUseManualEntry(false);
    setNewAddress({
      label: '',
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      countryCode: 'US',
      phone: '',
      type: 'SHIPPING',
    });
  };

  const handleStartEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setNewAddress({
      label: address.label || '',
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      countryCode: address.countryCode || 'US',
      phone: address.phone || '',
      type: address.type || 'SHIPPING',
    });
    setUseManualEntry(true);
    setShowAddAddress(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!customer?.id || !accessToken || !tenantId) return;

    try {
      await deleteCustomerAddress(tenantId, storefrontId || '', customer.id, addressId, accessToken);
      setAddresses(addresses.filter(a => a.id !== addressId));
      toast.success('Address deleted');
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!customer?.id || !accessToken || !tenantId) return;

    try {
      await setDefaultAddress(tenantId, storefrontId || '', customer.id, addressId, accessToken);
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === addressId })));
      toast.success('Default address updated');
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Failed to set default address');
    }
  };

  const handleAddressAutoComplete = (address: ParsedAddressData) => {
    setNewAddress({
      ...newAddress,
      firstName: customer?.firstName || newAddress.firstName,
      lastName: customer?.lastName || newAddress.lastName,
      addressLine1: address.streetAddress,
      city: address.city,
      state: address.stateCode || address.state,
      postalCode: address.postalCode,
      country: address.country,
      countryCode: address.countryCode || 'US',
    });
    setUseManualEntry(true); // Show form fields after selection
  };

  // Format the member since date
  const memberSince = customer?.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  // Get initials for avatar
  const initials = customer
    ? `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  const handleSave = async () => {
    // Check for customer instead of accessToken (OAuth uses session cookies)
    if (!customer?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization if available (legacy auth), otherwise session cookies will be used
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        credentials: 'include', // Important: send session cookies
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          updateCustomer(data.data);
          toast.success('Profile updated successfully');
        }
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
              style={{ background: settings.primaryColor }}
            >
              {initials}
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground mt-1"><TranslatedUIText text="Member since" /> {memberSince}</p>
          </div>

          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className={isEditing ? 'btn-tenant-primary' : ''}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <TranslatedUIText text="Saving..." />
              </>
            ) : isEditing ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                <TranslatedUIText text="Save Changes" />
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                <TranslatedUIText text="Edit Profile" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4"><TranslatedUIText text="Personal Information" /></h3>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName"><TranslatedUIText text="First Name" /></Label>
            {isEditing ? (
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-lg">{profile.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName"><TranslatedUIText text="Last Name" /></Label>
            {isEditing ? (
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-lg">{profile.lastName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email"><TranslatedUIText text="Email Address" /></Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="flex-1"
                />
              ) : (
                <p className="py-2 px-3 bg-muted rounded-lg flex-1">{profile.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone"><TranslatedUIText text="Phone Number" /></Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="flex-1"
                />
              ) : (
                <p className="py-2 px-3 bg-muted rounded-lg flex-1">{profile.phone}</p>
              )}
            </div>
          </div>

        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              <TranslatedUIText text="Cancel" />
            </Button>
            <Button className="btn-tenant-primary" onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              <TranslatedUIText text="Save Changes" />
            </Button>
          </div>
        )}
      </div>

      {/* Addresses Section */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-tenant-primary" />
            <h3 className="text-lg font-semibold"><TranslatedUIText text="Saved Addresses" /></h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (showAddAddress) {
                resetAddressForm();
              } else {
                setShowAddAddress(true);
              }
            }}
            className="gap-2 border-tenant-primary text-tenant-primary hover:bg-tenant-primary/10"
          >
            <Plus className="h-4 w-4" />
            <TranslatedUIText text="Add Address" />
          </Button>
        </div>

        {/* Add/Edit Address Form */}
        {showAddAddress && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              {editingAddress ? (
                <>
                  <Pencil className="h-4 w-4 text-tenant-primary" />
                  <TranslatedUIText text="Edit Address" />
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-tenant-primary" />
                  <TranslatedUIText text="Add New Address" />
                </>
              )}
            </h4>
            {/* Address Autocomplete */}
            {!useManualEntry && !editingAddress && (
              <div className="space-y-2">
                <Label><TranslatedUIText text="Search Address" /></Label>
                <AddressAutocomplete
                  onAddressSelect={handleAddressAutoComplete}
                  onManualEntryToggle={setUseManualEntry}
                  placeholder="Start typing your address..."
                  showCurrentLocation={true}
                />
              </div>
            )}

            {/* Manual Entry Form (shown after autocomplete selection or manual entry toggle) */}
            {useManualEntry && (
              <>
                {/* Address Label */}
                <div className="space-y-2">
                  <Label htmlFor="addr-label"><TranslatedUIText text="Address Label" /></Label>
                  <div className="flex gap-2">
                    <Input
                      id="addr-label"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder='e.g., "Home", "Work", "Mom&apos;s House"'
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      {['Home', 'Work', 'Office'].map((quickLabel) => (
                        <Button
                          key={quickLabel}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewAddress({ ...newAddress, label: quickLabel })}
                          className={`text-xs ${newAddress.label === quickLabel ? 'border-tenant-primary bg-tenant-primary/10' : ''}`}
                        >
                          {quickLabel}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addr-firstName"><TranslatedUIText text="First Name" /></Label>
                    <Input
                      id="addr-firstName"
                      value={newAddress.firstName}
                      onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-lastName"><TranslatedUIText text="Last Name" /></Label>
                    <Input
                      id="addr-lastName"
                      value={newAddress.lastName}
                      onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-line1"><TranslatedUIText text="Address Line 1" /></Label>
                  <Input
                    id="addr-line1"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-line2"><TranslatedUIText text="Address Line 2 (Optional)" /></Label>
                  <Input
                    id="addr-line2"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                    placeholder="Apt, suite, unit, etc."
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addr-city"><TranslatedUIText text="City" /></Label>
                    <Input
                      id="addr-city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-state"><TranslatedUIText text="State" /></Label>
                    <Input
                      id="addr-state"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-postal"><TranslatedUIText text="Postal Code" /></Label>
                    <Input
                      id="addr-postal"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="ZIP / Postal"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-phone"><TranslatedUIText text="Phone (Optional)" /></Label>
                  <Input
                    id="addr-phone"
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={resetAddressForm}>
                <TranslatedUIText text="Cancel" />
              </Button>
              {useManualEntry && (
                <Button
                  className="btn-tenant-primary"
                  onClick={handleAddAddress}
                  disabled={isAddingAddress || !newAddress.firstName || !newAddress.addressLine1 || !newAddress.city}
                >
                  {isAddingAddress ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <TranslatedUIText text={editingAddress ? 'Updating...' : 'Adding...'} />
                    </>
                  ) : (
                    <TranslatedUIText text={editingAddress ? 'Update Address' : 'Save Address'} />
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Address List */}
        {isLoadingAddresses ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-tenant-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Home className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p><TranslatedUIText text="No saved addresses yet" /></p>
            <p className="text-sm"><TranslatedUIText text="Add an address to speed up checkout" /></p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`relative p-4 rounded-lg border ${
                  address.isDefault ? 'border-tenant-primary bg-tenant-primary/5' : 'border-border'
                }`}
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 text-xs bg-tenant-primary text-white px-2 py-0.5 rounded">
                    <TranslatedUIText text="Default" />
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {address.type === 'BILLING' ? (
                      <Building className="h-4 w-4" />
                    ) : (
                      <Home className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {address.label && (
                      <div className="flex items-center gap-1 mb-1">
                        <Tag className="h-3 w-3 text-tenant-primary" />
                        <span className="text-xs font-medium text-tenant-primary">{address.label}</span>
                      </div>
                    )}
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.addressLine1}</p>
                    {address.addressLine2 && (
                      <p className="text-sm text-muted-foreground">{address.addressLine2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-muted-foreground">{address.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="text-xs h-7 text-tenant-primary hover:text-tenant-primary hover:bg-tenant-primary/10"
                    >
                      <TranslatedUIText text="Set as Default" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(address)}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    <TranslatedUIText text="Edit" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    <TranslatedUIText text="Delete" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-6 text-center">
          <p className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {customer?.totalOrders ?? 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1"><TranslatedUIText text="Total Orders" /></p>
        </div>
        <div className="bg-card rounded-xl border p-6 text-center">
          <p className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {wishlistItems.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1"><TranslatedUIText text="Wishlist Items" /></p>
        </div>
        <div className="bg-card rounded-xl border p-6 text-center">
          <p className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            ${(customer?.totalSpent ?? 0).toFixed(0)}
          </p>
          <p className="text-sm text-muted-foreground mt-1"><TranslatedUIText text="Total Spent" /></p>
        </div>
      </div>
    </div>
  );
}
