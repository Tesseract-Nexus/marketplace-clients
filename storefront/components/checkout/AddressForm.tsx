'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  CustomerAddress,
  CreateAddressRequest,
  AddressType,
  addCustomerAddress,
  updateCustomerAddress,
} from '@/lib/api/customers';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  id: string;
  name: string;
  code: string;
}

interface AddressFormProps {
  address?: CustomerAddress;
  addressType: AddressType;
  onSuccess: (address: CustomerAddress) => void;
  onCancel: () => void;
}

export function AddressForm({
  address,
  addressType,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const { tenant } = useTenant();
  const { customer, accessToken } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: address?.firstName || '',
    lastName: address?.lastName || '',
    company: address?.company || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || '',
    state: address?.state || '',
    stateCode: '', // Will be resolved when states load
    postalCode: address?.postalCode || '',
    country: address?.country || '',
    countryCode: address?.countryCode || '',
    phone: address?.phone || '',
    isDefault: address?.isDefault || false,
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country code changes and countries are loaded
  useEffect(() => {
    if (formData.countryCode && countries.length > 0) {
      fetchStates(formData.countryCode);
    } else if (!formData.countryCode) {
      setStates([]);
    }
  }, [formData.countryCode, countries.length]);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/location/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    }
  };

  const fetchStates = async (countryCode: string) => {
    try {
      const country = countries.find((c) => c.code === countryCode);
      if (!country) return;

      const response = await fetch(`/api/location/countries/${country.id}/states`);
      if (response.ok) {
        const data = await response.json();
        setStates(data.states || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    setFormData((prev) => ({
      ...prev,
      countryCode,
      country: country?.name || '',
      state: '',
      stateCode: '',
    }));
  };

  // Get the country code for the Select value (handles both name and code)
  const getCountrySelectValue = () => {
    if (!formData.countryCode && formData.country) {
      // Try to find country by name
      const countryByName = countries.find((c) => c.name === formData.country);
      if (countryByName) return countryByName.code;
    }
    return formData.countryCode || '';
  };

  const handleStateChange = (stateCode: string) => {
    const state = states.find((s) => s.code === stateCode);
    setFormData((prev) => ({
      ...prev,
      state: state?.name || stateCode,
      stateCode: stateCode,
    }));
  };

  // Get the state code for the Select value (handles both name and code stored in state)
  const getStateSelectValue = () => {
    if (!formData.state) return '';
    // If state matches a code, use it directly
    const stateByCode = states.find((s) => s.code === formData.state);
    if (stateByCode) return formData.state;
    // If state matches a name, find the corresponding code
    const stateByName = states.find((s) => s.name === formData.state);
    if (stateByName) return stateByName.code;
    // Return empty if no match (let user select)
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id || !accessToken || !tenant) return;

    setIsLoading(true);
    setError('');

    try {
      const requestData: CreateAddressRequest = {
        type: addressType,
        isDefault: formData.isDefault,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company || undefined,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        countryCode: formData.countryCode,
        phone: formData.phone || undefined,
      };

      let result: CustomerAddress;

      if (address) {
        result = await updateCustomerAddress(
          tenant.id,
          tenant.storefrontId,
          customer.id,
          address.id,
          requestData,
          accessToken
        );
      } else {
        result = await addCustomerAddress(
          tenant.id,
          tenant.storefrontId,
          customer.id,
          requestData,
          accessToken
        );
      }

      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={handleChange('firstName')}
            required
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={handleChange('lastName')}
            required
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company (Optional)</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={handleChange('company')}
          placeholder="Company name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address Line 1 *</Label>
        <Input
          id="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange('addressLine1')}
          required
          placeholder="123 Main Street"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input
          id="addressLine2"
          value={formData.addressLine2}
          onChange={handleChange('addressLine2')}
          placeholder="Apt, Suite, Unit, etc."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select value={getCountrySelectValue()} onValueChange={handleCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select country">
                {formData.country || 'Select country'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          {states.length > 0 ? (
            <Select value={getStateSelectValue()} onValueChange={handleStateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select state">
                  {formData.state || 'Select state'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="state"
              value={formData.state}
              onChange={handleChange('state')}
              required
              placeholder="State or Province"
            />
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={handleChange('city')}
            required
            placeholder="City"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={handleChange('postalCode')}
            required
            placeholder="12345"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isDefault: checked as boolean }))
          }
          className="data-[state=checked]:bg-tenant-primary data-[state=checked]:border-tenant-primary"
        />
        <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
          Set as default {addressType.toLowerCase()} address
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="btn-tenant-primary gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              {address ? 'Update Address' : 'Save Address'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
