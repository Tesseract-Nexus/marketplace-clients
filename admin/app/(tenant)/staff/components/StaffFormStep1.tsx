'use client';

import React from 'react';
import { PhoneInput } from '@/components/ui/phone-input';
import { AddressAutocomplete, ParsedAddressData } from '@/components/AddressAutocomplete';
import { StaffFormStepProps } from './types';

export function StaffFormStep1({ formData, setFormData }: StaffFormStepProps) {
  // Handle address selection - auto-sets phone country code
  const handleAddressSelect = (address: ParsedAddressData) => {
    setFormData(prev => ({
      ...prev,
      streetAddress: address.streetAddress || '',
      streetAddress2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      stateCode: address.stateCode || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      countryCode: address.countryCode || '',
      latitude: address.latitude,
      longitude: address.longitude,
      formattedAddress: address.formattedAddress || '',
      placeId: address.placeId || '',
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
        Personal Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            First Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Last Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Middle Name
          </label>
          <input
            type="text"
            value={formData.middleName}
            onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="Michael"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="John D."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="john.doe@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Alternate Email
          </label>
          <input
            type="email"
            value={formData.alternateEmail}
            onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="john@personal.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Phone Number
          </label>
          <PhoneInput
            value={formData.phoneNumber}
            onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
            placeholder="Enter phone number"
            countryCode={formData.countryCode || undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Mobile Number
          </label>
          <PhoneInput
            value={formData.mobileNumber}
            onChange={(value) => setFormData({ ...formData, mobileNumber: value })}
            placeholder="Enter mobile number"
            countryCode={formData.countryCode || undefined}
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Address</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search Address
            </label>
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing to search for an address..."
              defaultValue={formData.formattedAddress}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Search and select an address to auto-fill the fields below and set phone country code
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.streetAddress}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="123 Main Street"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.streetAddress2}
                onChange={(e) => setFormData({ ...formData, streetAddress2: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="Apt, Suite, Unit, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="Sydney"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                State / Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="New South Wales"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="Australia"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffFormStep1;
