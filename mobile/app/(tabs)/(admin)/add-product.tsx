import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { apiClient } from '../../../lib/api/client';
import { useKeyboard } from '../../../hooks/useKeyboard';
import { validateRequired, validatePositiveNumber } from '../../../lib/utils/validation';

interface Category {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: string;
  compare_at_price: string;
  quantity: string;
  options: { name: string; value: string }[];
}

interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  sku: string;
  barcode: string;
  price: string;
  compare_at_price: string;
  cost_price: string;
  quantity: string;
  low_stock_threshold: string;
  track_inventory: boolean;
  allow_backorder: boolean;
  is_active: boolean;
  is_featured: boolean;
  weight: string;
  weight_unit: 'kg' | 'lb' | 'g' | 'oz';
  tags: string[];
  images: string[];
  variants: ProductVariant[];
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category_id: '',
  sku: '',
  barcode: '',
  price: '',
  compare_at_price: '',
  cost_price: '',
  quantity: '',
  low_stock_threshold: '10',
  track_inventory: true,
  allow_backorder: false,
  is_active: true,
  is_featured: false,
  weight: '',
  weight_unit: 'kg',
  tags: [],
  images: [],
  variants: [],
};

export default function AddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isKeyboardVisible } = useKeyboard();

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'inventory' | 'variants' | 'media'>('basic');
  const [tagInput, setTagInput] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        ...data,
        price: parseFloat(data.price) * 100,
        compare_at_price: data.compare_at_price ? parseFloat(data.compare_at_price) * 100 : null,
        cost_price: data.cost_price ? parseFloat(data.cost_price) * 100 : null,
        quantity: parseInt(data.quantity, 10),
        low_stock_threshold: parseInt(data.low_stock_threshold, 10),
        weight: data.weight ? parseFloat(data.weight) : null,
      };
      return apiClient.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create product');
    },
  });

  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'Product name is required';
    }
    if (!validateRequired(formData.price)) {
      newErrors.price = 'Price is required';
    } else if (!validatePositiveNumber(formData.price)) {
      newErrors.price = 'Price must be a positive number';
    }
    if (formData.compare_at_price && !validatePositiveNumber(formData.compare_at_price)) {
      newErrors.compare_at_price = 'Compare at price must be a positive number';
    }
    if (formData.track_inventory) {
      if (!validateRequired(formData.quantity)) {
        newErrors.quantity = 'Quantity is required when tracking inventory';
      } else if (!validatePositiveNumber(formData.quantity)) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      createMutation.mutate(formData);
    } else {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
    }
  }, [formData, validateForm, createMutation]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to add images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      updateField('images', [...formData.images, ...newImages]);
    }
  }, [formData.images, updateField]);

  const handleRemoveImage = useCallback((index: number) => {
    updateField('images', formData.images.filter((_, i) => i !== index));
  }, [formData.images, updateField]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, formData.tags, updateField]);

  const handleRemoveTag = useCallback((tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  }, [formData.tags, updateField]);

  const handleAddVariant = useCallback(() => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: '',
      sku: '',
      price: formData.price,
      compare_at_price: formData.compare_at_price,
      quantity: formData.quantity,
      options: [{ name: '', value: '' }],
    };
    updateField('variants', [...formData.variants, newVariant]);
  }, [formData.price, formData.compare_at_price, formData.quantity, formData.variants, updateField]);

  const handleRemoveVariant = useCallback((id: string) => {
    updateField('variants', formData.variants.filter((v) => v.id !== id));
  }, [formData.variants, updateField]);

  const sections = [
    { key: 'basic', label: 'Basic', icon: 'information-circle-outline' },
    { key: 'pricing', label: 'Pricing', icon: 'pricetag-outline' },
    { key: 'inventory', label: 'Inventory', icon: 'cube-outline' },
    { key: 'variants', label: 'Variants', icon: 'layers-outline' },
    { key: 'media', label: 'Media', icon: 'images-outline' },
  ] as const;

  const selectedCategory = categories.find((c) => c.id === formData.category_id);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Product',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              className="mr-4"
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text className="font-semibold text-indigo-600">Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Section Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200 bg-white"
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {sections.map((section) => (
            <TouchableOpacity
              key={section.key}
              onPress={() => setActiveSection(section.key)}
              className={`flex-row items-center px-4 py-3 ${
                activeSection === section.key ? 'border-b-2 border-indigo-600' : ''
              }`}
            >
              <Ionicons
                name={section.icon as any}
                size={18}
                color={activeSection === section.key ? '#4f46e5' : '#9ca3af'}
              />
              <Text
                className={`ml-1 text-sm font-medium ${
                  activeSection === section.key ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <View className="space-y-4 p-4">
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <View className="space-y-4">
                  {/* Product Name */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">
                      Product Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.name}
                      onChangeText={(text) => updateField('name', text)}
                      placeholder="Enter product name"
                      className={`rounded-lg border bg-gray-50 p-3 ${
                        errors.name ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.name && (
                      <Text className="mt-1 text-xs text-red-500">{errors.name}</Text>
                    )}
                  </View>

                  {/* Description */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Description</Text>
                    <TextInput
                      value={formData.description}
                      onChangeText={(text) => updateField('description', text)}
                      placeholder="Enter product description"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      className="min-h-[100px] rounded-lg border border-gray-200 bg-gray-50 p-3"
                    />
                  </View>

                  {/* Category */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Category</Text>
                    <TouchableOpacity
                      onPress={() => setShowCategoryPicker(true)}
                      className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <Text className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedCategory?.name || 'Select category'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  {/* SKU & Barcode */}
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="mb-1 text-sm font-medium text-gray-700">SKU</Text>
                      <TextInput
                        value={formData.sku}
                        onChangeText={(text) => updateField('sku', text)}
                        placeholder="SKU-001"
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-sm font-medium text-gray-700">Barcode</Text>
                      <TextInput
                        value={formData.barcode}
                        onChangeText={(text) => updateField('barcode', text)}
                        placeholder="123456789"
                        keyboardType="numeric"
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                    </View>
                  </View>

                  {/* Tags */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Tags</Text>
                    <View className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <TextInput
                        value={tagInput}
                        onChangeText={setTagInput}
                        onSubmitEditing={handleAddTag}
                        placeholder="Add tag"
                        className="flex-1 p-2"
                      />
                      <TouchableOpacity
                        onPress={handleAddTag}
                        className="rounded-lg bg-indigo-600 px-3 py-2"
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    {formData.tags.length > 0 && (
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <TouchableOpacity
                            key={tag}
                            onPress={() => handleRemoveTag(tag)}
                            className="flex-row items-center rounded-full bg-gray-100 px-3 py-1"
                          >
                            <Text className="text-sm text-gray-700">{tag}</Text>
                            <Ionicons name="close" size={14} color="#6b7280" className="ml-1" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Status Toggles */}
                  <View className="space-y-3 border-t border-gray-100 pt-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-medium text-gray-900">Active</Text>
                        <Text className="text-xs text-gray-500">Product is visible in store</Text>
                      </View>
                      <Switch
                        value={formData.is_active}
                        onValueChange={(value) => updateField('is_active', value)}
                        trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                        thumbColor={formData.is_active ? '#4f46e5' : '#9ca3af'}
                      />
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-medium text-gray-900">Featured</Text>
                        <Text className="text-xs text-gray-500">Show in featured section</Text>
                      </View>
                      <Switch
                        value={formData.is_featured}
                        onValueChange={(value) => updateField('is_featured', value)}
                        trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                        thumbColor={formData.is_featured ? '#4f46e5' : '#9ca3af'}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Pricing Section */}
          {activeSection === 'pricing' && (
            <View className="space-y-4 p-4">
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <View className="space-y-4">
                  {/* Price */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">
                      Price <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50">
                      <Text className="px-3 text-gray-500">$</Text>
                      <TextInput
                        value={formData.price}
                        onChangeText={(text) => updateField('price', text)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        className={`flex-1 p-3 ${errors.price ? 'border-red-500' : ''}`}
                      />
                    </View>
                    {errors.price && (
                      <Text className="mt-1 text-xs text-red-500">{errors.price}</Text>
                    )}
                  </View>

                  {/* Compare at Price */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Compare at Price</Text>
                    <View className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50">
                      <Text className="px-3 text-gray-500">$</Text>
                      <TextInput
                        value={formData.compare_at_price}
                        onChangeText={(text) => updateField('compare_at_price', text)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        className="flex-1 p-3"
                      />
                    </View>
                    <Text className="mt-1 text-xs text-gray-500">
                      Original price shown as crossed out
                    </Text>
                  </View>

                  {/* Cost Price */}
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Cost Price</Text>
                    <View className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50">
                      <Text className="px-3 text-gray-500">$</Text>
                      <TextInput
                        value={formData.cost_price}
                        onChangeText={(text) => updateField('cost_price', text)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        className="flex-1 p-3"
                      />
                    </View>
                    <Text className="mt-1 text-xs text-gray-500">
                      Your cost for profit calculation
                    </Text>
                  </View>

                  {/* Margin Preview */}
                  {formData.price && formData.cost_price && (
                    <View className="rounded-lg bg-gray-50 p-3">
                      <Text className="text-sm text-gray-500">Estimated Margin</Text>
                      <Text className="text-lg font-semibold text-green-600">
                        {(
                          ((parseFloat(formData.price) - parseFloat(formData.cost_price)) /
                            parseFloat(formData.price)) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Inventory Section */}
          {activeSection === 'inventory' && (
            <View className="space-y-4 p-4">
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <View className="space-y-4">
                  {/* Track Inventory Toggle */}
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium text-gray-900">Track Inventory</Text>
                      <Text className="text-xs text-gray-500">
                        Manage stock levels for this product
                      </Text>
                    </View>
                    <Switch
                      value={formData.track_inventory}
                      onValueChange={(value) => updateField('track_inventory', value)}
                      trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                      thumbColor={formData.track_inventory ? '#4f46e5' : '#9ca3af'}
                    />
                  </View>

                  {formData.track_inventory && (
                    <>
                      {/* Quantity */}
                      <View>
                        <Text className="mb-1 text-sm font-medium text-gray-700">
                          Quantity <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                          value={formData.quantity}
                          onChangeText={(text) => updateField('quantity', text)}
                          placeholder="0"
                          keyboardType="number-pad"
                          className={`rounded-lg border bg-gray-50 p-3 ${
                            errors.quantity ? 'border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {errors.quantity && (
                          <Text className="mt-1 text-xs text-red-500">{errors.quantity}</Text>
                        )}
                      </View>

                      {/* Low Stock Threshold */}
                      <View>
                        <Text className="mb-1 text-sm font-medium text-gray-700">
                          Low Stock Alert Threshold
                        </Text>
                        <TextInput
                          value={formData.low_stock_threshold}
                          onChangeText={(text) => updateField('low_stock_threshold', text)}
                          placeholder="10"
                          keyboardType="number-pad"
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                        />
                        <Text className="mt-1 text-xs text-gray-500">
                          Get notified when stock falls below this level
                        </Text>
                      </View>

                      {/* Allow Backorder */}
                      <View className="flex-row items-center justify-between border-t border-gray-100 pt-4">
                        <View>
                          <Text className="font-medium text-gray-900">Allow Backorders</Text>
                          <Text className="text-xs text-gray-500">
                            Continue selling when out of stock
                          </Text>
                        </View>
                        <Switch
                          value={formData.allow_backorder}
                          onValueChange={(value) => updateField('allow_backorder', value)}
                          trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                          thumbColor={formData.allow_backorder ? '#4f46e5' : '#9ca3af'}
                        />
                      </View>
                    </>
                  )}

                  {/* Weight */}
                  <View className="border-t border-gray-100 pt-4">
                    <Text className="mb-1 text-sm font-medium text-gray-700">Weight</Text>
                    <View className="flex-row gap-2">
                      <TextInput
                        value={formData.weight}
                        onChangeText={(text) => updateField('weight', text)}
                        placeholder="0.0"
                        keyboardType="decimal-pad"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      />
                      <View className="flex-row rounded-lg border border-gray-200 bg-gray-50">
                        {(['kg', 'lb', 'g', 'oz'] as const).map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            onPress={() => updateField('weight_unit', unit)}
                            className={`px-3 py-3 ${
                              formData.weight_unit === unit ? 'bg-indigo-600' : ''
                            } ${unit === 'kg' ? 'rounded-l-lg' : ''} ${
                              unit === 'oz' ? 'rounded-r-lg' : ''
                            }`}
                          >
                            <Text
                              className={
                                formData.weight_unit === unit ? 'text-white' : 'text-gray-600'
                              }
                            >
                              {unit}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Variants Section */}
          {activeSection === 'variants' && (
            <View className="space-y-4 p-4">
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-900">Product Variants</Text>
                  <TouchableOpacity
                    onPress={handleAddVariant}
                    className="flex-row items-center rounded-lg bg-indigo-600 px-3 py-2"
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text className="ml-1 font-medium text-white">Add Variant</Text>
                  </TouchableOpacity>
                </View>

                {formData.variants.length === 0 ? (
                  <View className="items-center justify-center py-8">
                    <Ionicons name="layers-outline" size={48} color="#d1d5db" />
                    <Text className="mt-2 text-gray-500">No variants added</Text>
                    <Text className="mt-1 text-center text-sm text-gray-400">
                      Add variants for different sizes, colors, or other options
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <View key={variant.id} className="rounded-lg border border-gray-200 p-3">
                        <View className="mb-2 flex-row items-center justify-between">
                          <Text className="font-medium text-gray-900">
                            Variant {index + 1}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveVariant(variant.id)}>
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>

                        <View className="space-y-3">
                          <TextInput
                            value={variant.name}
                            onChangeText={(text) => {
                              const newVariants = [...formData.variants];
                              newVariants[index].name = text;
                              updateField('variants', newVariants);
                            }}
                            placeholder="Variant name (e.g., Small / Red)"
                            className="rounded-lg border border-gray-200 bg-gray-50 p-2"
                          />
                          <View className="flex-row gap-2">
                            <TextInput
                              value={variant.sku}
                              onChangeText={(text) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].sku = text;
                                updateField('variants', newVariants);
                              }}
                              placeholder="SKU"
                              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2"
                            />
                            <TextInput
                              value={variant.quantity}
                              onChangeText={(text) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].quantity = text;
                                updateField('variants', newVariants);
                              }}
                              placeholder="Qty"
                              keyboardType="number-pad"
                              className="w-20 rounded-lg border border-gray-200 bg-gray-50 p-2"
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <View className="flex-1 flex-row items-center rounded-lg border border-gray-200 bg-gray-50">
                              <Text className="px-2 text-gray-500">$</Text>
                              <TextInput
                                value={variant.price}
                                onChangeText={(text) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].price = text;
                                  updateField('variants', newVariants);
                                }}
                                placeholder="Price"
                                keyboardType="decimal-pad"
                                className="flex-1 p-2"
                              />
                            </View>
                            <View className="flex-1 flex-row items-center rounded-lg border border-gray-200 bg-gray-50">
                              <Text className="px-2 text-gray-500">$</Text>
                              <TextInput
                                value={variant.compare_at_price}
                                onChangeText={(text) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].compare_at_price = text;
                                  updateField('variants', newVariants);
                                }}
                                placeholder="Compare"
                                keyboardType="decimal-pad"
                                className="flex-1 p-2"
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Media Section */}
          {activeSection === 'media' && (
            <View className="space-y-4 p-4">
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-4 text-lg font-semibold text-gray-900">Product Images</Text>

                {/* Image Grid */}
                <View className="flex-row flex-wrap gap-3">
                  {formData.images.map((uri, index) => (
                    <View key={index} className="relative">
                      <Image
                        source={{ uri }}
                        className="h-24 w-24 rounded-lg"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveImage(index)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1"
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                      {index === 0 && (
                        <View className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-0.5">
                          <Text className="text-xs text-white">Main</Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Add Image Button */}
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                  >
                    <Ionicons name="camera-outline" size={24} color="#9ca3af" />
                    <Text className="mt-1 text-xs text-gray-500">Add</Text>
                  </TouchableOpacity>
                </View>

                <Text className="mt-3 text-xs text-gray-500">
                  First image will be used as the main product image. Drag to reorder.
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Spacer for Keyboard */}
          {isKeyboardVisible && <View className="h-40" />}
        </ScrollView>

        {/* Submit Button */}
        {!isKeyboardVisible && (
          <View className="border-t border-gray-200 bg-white p-4">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              className={`rounded-xl py-4 ${
                createMutation.isPending ? 'bg-indigo-400' : 'bg-indigo-600'
              }`}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-lg font-semibold text-white">
                  Create Product
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
          className="absolute inset-0 items-center justify-center bg-black/50"
        >
          <View className="mx-6 max-h-96 w-full rounded-xl bg-white">
            <View className="border-b border-gray-200 p-4">
              <Text className="text-lg font-semibold text-gray-900">Select Category</Text>
            </View>
            <ScrollView>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    updateField('category_id', category.id);
                    setShowCategoryPicker(false);
                  }}
                  className={`flex-row items-center justify-between border-b border-gray-100 p-4 ${
                    formData.category_id === category.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <Text
                    className={
                      formData.category_id === category.id
                        ? 'font-medium text-indigo-600'
                        : 'text-gray-700'
                    }
                  >
                    {category.name}
                  </Text>
                  {formData.category_id === category.id && (
                    <Ionicons name="checkmark" size={20} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}
