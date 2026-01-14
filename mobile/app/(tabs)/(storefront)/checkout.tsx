import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';
import { useCartStore } from '../../../stores/cart-store';
import { useAuthStore } from '../../../stores/auth-store';
import { formatCurrency } from '../../../lib/utils/formatting';
import { useKeyboard } from '../../../hooks/useKeyboard';

interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  is_default: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
}

type CheckoutStep = 'shipping' | 'payment' | 'review';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const items = cart?.items || [];
  const { isKeyboardVisible } = useKeyboard();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [orderNotes, setOrderNotes] = useState('');

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['user-addresses'],
    queryFn: async () => {
      const response = await apiClient.get('/customers/me/addresses');
      return response.data.data || [];
    },
    enabled: !!user,
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await apiClient.get('/customers/me/payment-methods');
      return response.data.data || [];
    },
    enabled: !!user,
  });

  const { data: shippingMethods = [] } = useQuery<ShippingMethod[]>({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const response = await apiClient.get('/shipping/methods');
      return response.data.data || [];
    },
  });

  // Set defaults
  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPayment) {
      const defaultPm = paymentMethods.find((p) => p.is_default) || paymentMethods[0];
      setSelectedPayment(defaultPm);
    }
  }, [paymentMethods, selectedPayment]);

  React.useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingMethods[0]);
    }
  }, [shippingMethods, selectedShipping]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        shipping_address_id: selectedAddress?.id,
        payment_method_id: selectedPayment?.id,
        shipping_method_id: selectedShipping?.id,
        notes: orderNotes,
      };
      const response = await apiClient.post('/orders', orderData);
      return response.data.data;
    },
    onSuccess: (order) => {
      clearCart();
      router.replace(`/(tabs)/(storefront)/order-confirmation?id=${order.id}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create order');
    },
  });

  const subtotal = getSubtotal();
  const shippingCost = selectedShipping?.price || 0;
  const tax = subtotal * 0.1; // 10% tax example
  const total = subtotal + shippingCost + tax;

  const handleNextStep = useCallback(() => {
    if (currentStep === 'shipping') {
      if (!selectedAddress) {
        Alert.alert('Error', 'Please select a shipping address');
        return;
      }
      if (!selectedShipping) {
        Alert.alert('Error', 'Please select a shipping method');
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      if (!selectedPayment) {
        Alert.alert('Error', 'Please select a payment method');
        return;
      }
      setCurrentStep('review');
    }
  }, [currentStep, selectedAddress, selectedShipping, selectedPayment]);

  const handlePlaceOrder = useCallback(() => {
    Alert.alert(
      'Confirm Order',
      `Place order for ${formatCurrency(total)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => createOrderMutation.mutate(),
        },
      ]
    );
  }, [total, createOrderMutation]);

  const steps = [
    { key: 'shipping', label: 'Shipping', icon: 'location-outline' },
    { key: 'payment', label: 'Payment', icon: 'card-outline' },
    { key: 'review', label: 'Review', icon: 'checkmark-circle-outline' },
  ] as const;

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Ionicons name="cart-outline" size={64} color="#d1d5db" />
        <Text className="mt-4 text-xl font-semibold text-gray-900">Your Cart is Empty</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/(storefront)/browse')}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerBackTitle: 'Cart',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Progress Steps */}
        <View className="flex-row items-center justify-between bg-white px-4 py-3">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <TouchableOpacity
                onPress={() => {
                  if (index < currentStepIndex) {
                    setCurrentStep(step.key);
                  }
                }}
                className="flex-row items-center"
                disabled={index > currentStepIndex}
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    index <= currentStepIndex
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Text
                      className={
                        index <= currentStepIndex ? 'text-white' : 'text-gray-500'
                      }
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  className={`ml-2 text-sm ${
                    index <= currentStepIndex
                      ? 'font-medium text-indigo-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>
              {index < steps.length - 1 && (
                <View
                  className={`h-0.5 flex-1 mx-2 ${
                    index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
          {/* Shipping Step */}
          {currentStep === 'shipping' && (
            <View className="p-4">
              {/* Shipping Address */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-4 font-semibold text-gray-900">Shipping Address</Text>

                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    onPress={() => setSelectedAddress(address)}
                    className={`mb-3 rounded-lg border-2 p-3 ${
                      selectedAddress?.id === address.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View
                        className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selectedAddress?.id === address.id
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedAddress?.id === address.id && (
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900">{address.line1}</Text>
                        {address.line2 && (
                          <Text className="text-gray-700">{address.line2}</Text>
                        )}
                        <Text className="text-gray-700">
                          {address.city}, {address.state} {address.postal_code}
                        </Text>
                        <Text className="text-gray-500">{address.country}</Text>
                        {address.is_default && (
                          <View className="mt-1 self-start rounded-full bg-green-100 px-2 py-0.5">
                            <Text className="text-xs text-green-800">Default</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => setShowAddressForm(!showAddressForm)}
                  className="flex-row items-center py-2"
                >
                  <Ionicons name="add-circle-outline" size={20} color="#4f46e5" />
                  <Text className="ml-2 text-indigo-600">Add New Address</Text>
                </TouchableOpacity>

                {showAddressForm && (
                  <View className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <TextInput
                      value={newAddress.line1}
                      onChangeText={(text) => setNewAddress({ ...newAddress, line1: text })}
                      placeholder="Street Address"
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    />
                    <TextInput
                      value={newAddress.line2}
                      onChangeText={(text) => setNewAddress({ ...newAddress, line2: text })}
                      placeholder="Apartment, suite, etc. (optional)"
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    />
                    <View className="flex-row gap-3">
                      <TextInput
                        value={newAddress.city}
                        onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                        placeholder="City"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                      <TextInput
                        value={newAddress.state}
                        onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
                        placeholder="State"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                    </View>
                    <View className="flex-row gap-3">
                      <TextInput
                        value={newAddress.postal_code}
                        onChangeText={(text) => setNewAddress({ ...newAddress, postal_code: text })}
                        placeholder="Postal Code"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                      <TextInput
                        value={newAddress.country}
                        onChangeText={(text) => setNewAddress({ ...newAddress, country: text })}
                        placeholder="Country"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Shipping Method */}
              <View className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-4 font-semibold text-gray-900">Shipping Method</Text>

                {shippingMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setSelectedShipping(method)}
                    className={`mb-3 flex-row items-center justify-between rounded-lg border-2 p-3 ${
                      selectedShipping?.id === method.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selectedShipping?.id === method.id
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedShipping?.id === method.id && (
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                      </View>
                      <View>
                        <Text className="font-medium text-gray-900">{method.name}</Text>
                        <Text className="text-sm text-gray-500">{method.estimated_days}</Text>
                      </View>
                    </View>
                    <Text className="font-semibold text-gray-900">
                      {method.price === 0 ? 'FREE' : formatCurrency(method.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <View className="p-4">
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-4 font-semibold text-gray-900">Payment Method</Text>

                {paymentMethods.map((pm) => (
                  <TouchableOpacity
                    key={pm.id}
                    onPress={() => setSelectedPayment(pm)}
                    className={`mb-3 flex-row items-center rounded-lg border-2 p-3 ${
                      selectedPayment?.id === pm.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <View
                      className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedPayment?.id === pm.id
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPayment?.id === pm.id && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <Ionicons
                      name={pm.type === 'card' ? 'card-outline' : 'wallet-outline'}
                      size={24}
                      color="#6b7280"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="font-medium text-gray-900">
                        {pm.brand ? `${pm.brand} ` : ''}**** {pm.last4}
                      </Text>
                    </View>
                    {pm.is_default && (
                      <View className="rounded-full bg-green-100 px-2 py-0.5">
                        <Text className="text-xs text-green-800">Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity className="flex-row items-center py-2">
                  <Ionicons name="add-circle-outline" size={20} color="#4f46e5" />
                  <Text className="ml-2 text-indigo-600">Add Payment Method</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <View className="p-4 space-y-4">
              {/* Order Items */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-4 font-semibold text-gray-900">
                  Order Items ({items.length})
                </Text>
                {items.map((item) => (
                  <View
                    key={item.id}
                    className="mb-3 flex-row border-b border-gray-100 pb-3 last:border-0"
                  >
                    <Image
                      source={{ uri: item.product?.images?.[0]?.url || 'https://via.placeholder.com/100' }}
                      className="h-16 w-16 rounded-lg"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="font-medium text-gray-900" numberOfLines={2}>
                        {item.product?.name || 'Product'}
                      </Text>
                      <Text className="text-sm text-gray-500">Qty: {item.quantity}</Text>
                    </View>
                    <Text className="font-semibold text-gray-900">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Shipping Address Summary */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-gray-900">Shipping Address</Text>
                  <TouchableOpacity onPress={() => setCurrentStep('shipping')}>
                    <Text className="text-sm text-indigo-600">Edit</Text>
                  </TouchableOpacity>
                </View>
                {selectedAddress && (
                  <View className="mt-2">
                    <Text className="text-gray-700">{selectedAddress.line1}</Text>
                    <Text className="text-gray-700">
                      {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                    </Text>
                  </View>
                )}
              </View>

              {/* Payment Summary */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-gray-900">Payment Method</Text>
                  <TouchableOpacity onPress={() => setCurrentStep('payment')}>
                    <Text className="text-sm text-indigo-600">Edit</Text>
                  </TouchableOpacity>
                </View>
                {selectedPayment && (
                  <Text className="mt-2 text-gray-700">
                    {selectedPayment.brand} **** {selectedPayment.last4}
                  </Text>
                )}
              </View>

              {/* Order Notes */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-2 font-semibold text-gray-900">Order Notes (Optional)</Text>
                <TextInput
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  placeholder="Special instructions for your order..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                />
              </View>

              {/* Order Summary */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-4 font-semibold text-gray-900">Order Summary</Text>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Subtotal</Text>
                    <Text className="text-gray-900">{formatCurrency(subtotal)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Shipping</Text>
                    <Text className="text-gray-900">
                      {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Tax</Text>
                    <Text className="text-gray-900">{formatCurrency(tax)}</Text>
                  </View>
                  <View className="flex-row justify-between border-t border-gray-200 pt-2">
                    <Text className="font-bold text-gray-900">Total</Text>
                    <Text className="font-bold text-gray-900">{formatCurrency(total)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Spacer for bottom button */}
          <View className="h-24" />
        </ScrollView>

        {/* Bottom Action Button */}
        {!isKeyboardVisible && (
          <View className="border-t border-gray-200 bg-white px-4 pb-8 pt-4">
            {currentStep === 'review' ? (
              <TouchableOpacity
                onPress={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
                className={`rounded-xl py-4 ${
                  createOrderMutation.isPending ? 'bg-indigo-400' : 'bg-indigo-600'
                }`}
              >
                {createOrderMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center text-lg font-semibold text-white">
                    Place Order - {formatCurrency(total)}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNextStep}
                className="rounded-xl bg-indigo-600 py-4"
              >
                <Text className="text-center text-lg font-semibold text-white">
                  Continue
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
