import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { apiClient } from '../../../lib/api/client';
import { useCartStore } from '../../../stores/cart-store';
import { formatCurrency } from '../../../lib/utils/formatting';
import type { Product, ProductVariant } from '@/types/entities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

export default function ProductScreen() {
  const { id, slug } = useLocalSearchParams<{ id?: string; slug?: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const scrollY = useSharedValue(0);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: ['product', id || slug],
    queryFn: async () => {
      const endpoint = id ? `/products/${id}` : `/products/slug/${slug}`;
      const response = await apiClient.get(endpoint);
      return response.data.data;
    },
    enabled: !!(id || slug),
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [IMAGE_HEIGHT - 150, IMAGE_HEIGHT - 50],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const handleSelectOption = useCallback(
    (optionName: string, value: string) => {
      const newOptions = { ...selectedOptions, [optionName]: value };
      setSelectedOptions(newOptions);

      // Find matching variant
      if (product?.variants) {
        const matchingVariant = product.variants.find((variant) =>
          variant.options.every((opt) => newOptions[opt.name] === opt.value)
        );
        setSelectedVariant(matchingVariant || null);
      }
    },
    [selectedOptions, product?.variants]
  );

  const handleAddToCart = useCallback(() => {
    if (!product) {
      return;
    }

    const name = selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name;

    addItem(product, selectedVariant, quantity);

    Alert.alert('Added to Cart', `${name} x${quantity} added to your cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      {
        text: 'View Cart',
        onPress: () => router.push('/(tabs)/(storefront)/cart'),
      },
    ]);
  }, [product, selectedVariant, quantity, addItem, router]);

  const handleShare = useCallback(async () => {
    if (!product) {
      return;
    }
    try {
      await Share.share({
        message: `Check out ${product.name}!`,
        url: `https://store.example.com/products/${product.slug}`,
      });
    } catch (error) {
      // Share cancelled or failed
    }
  }, [product]);

  const handleBuyNow = useCallback(() => {
    handleAddToCart();
    router.push('/(tabs)/(storefront)/checkout');
  }, [handleAddToCart, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Ionicons color="#ef4444" name="alert-circle-outline" size={48} />
        <Text className="mt-4 text-lg font-semibold text-gray-900">Product Not Found</Text>
        <TouchableOpacity
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPrice = selectedVariant?.price || product.price;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const inStock = selectedVariant ? selectedVariant.inventory_quantity > 0 : product.in_stock;
  const discount = comparePrice
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity
              className="ml-2 rounded-full bg-white/90 p-2 shadow-sm"
              onPress={() => router.back()}
            >
              <Ionicons color="#111827" name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="mr-2 flex-row gap-2">
              <TouchableOpacity
                className="rounded-full bg-white/90 p-2 shadow-sm"
                onPress={handleShare}
              >
                <Ionicons color="#111827" name="share-outline" size={24} />
              </TouchableOpacity>
              <TouchableOpacity className="rounded-full bg-white/90 p-2 shadow-sm">
                <Ionicons color="#111827" name="heart-outline" size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Animated Header Background */}
      <Animated.View
        className="absolute left-0 right-0 top-0 z-10 h-24 bg-white"
        style={headerAnimatedStyle}
      />

      <Animated.ScrollView
        className="flex-1 bg-white"
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      >
        {/* Image Carousel */}
        <View style={{ height: IMAGE_HEIGHT }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
          >
            {product.images.map((image, index) => (
              <Image
                key={image.id}
                resizeMode="cover"
                source={{ uri: image.url }}
                style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {product.images.length > 1 ? (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {product.images.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === activeImageIndex ? 'bg-indigo-600' : 'bg-white/60'
                  }`}
                />
              ))}
            </View>
          ) : null}

          {/* Discount Badge */}
          {discount > 0 ? (
            <View className="absolute right-4 top-4 rounded-lg bg-red-500 px-3 py-1">
              <Text className="font-bold text-white">-{discount}%</Text>
            </View>
          ) : null}
        </View>

        <View className="p-4">
          {/* Category */}
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/(storefront)/category?id=${product.category.id}`)}
          >
            <Text className="text-sm font-medium text-indigo-600">{product.category.name}</Text>
          </TouchableOpacity>

          {/* Product Name */}
          <Text className="mt-2 text-2xl font-bold text-gray-900">{product.name}</Text>

          {/* Rating */}
          {product.review_count > 0 ? (
            <View className="mt-2 flex-row items-center">
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    color={star <= Math.round(product.rating) ? '#fbbf24' : '#d1d5db'}
                    name={star <= Math.round(product.rating) ? 'star' : 'star-outline'}
                    size={16}
                  />
                ))}
              </View>
              <Text className="ml-2 text-sm text-gray-500">
                {product.rating.toFixed(1)} ({product.review_count} reviews)
              </Text>
            </View>
          ) : null}

          {/* Price */}
          <View className="mt-4 flex-row items-baseline">
            <Text className="text-3xl font-bold text-gray-900">{formatCurrency(currentPrice)}</Text>
            {comparePrice ? (
              <Text className="ml-2 text-lg text-gray-400 line-through">
                {formatCurrency(comparePrice)}
              </Text>
            ) : null}
          </View>

          {/* Stock Status */}
          <View className="mt-2 flex-row items-center">
            <View className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className={`ml-2 text-sm ${inStock ? 'text-green-600' : 'text-red-600'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Variants/Options */}
          {product.options.length > 0 ? (
            <View className="mt-6 space-y-4">
              {product.options.map((option) => (
                <View key={option.name}>
                  <Text className="mb-2 font-medium text-gray-900">{option.name}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.name] === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          className={`rounded-lg border-2 px-4 py-2 ${
                            isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                          }`}
                          onPress={() => handleSelectOption(option.name, value)}
                        >
                          <Text
                            className={isSelected ? 'font-medium text-indigo-600' : 'text-gray-700'}
                          >
                            {value}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Quantity Selector */}
          <View className="mt-6">
            <Text className="mb-2 font-medium text-gray-900">Quantity</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className={`rounded-lg border border-gray-200 p-3 ${
                  quantity <= 1 ? 'opacity-50' : ''
                }`}
                disabled={quantity <= 1}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons color="#4b5563" name="remove" size={20} />
              </TouchableOpacity>
              <Text className="mx-6 text-lg font-semibold text-gray-900">{quantity}</Text>
              <TouchableOpacity
                className="rounded-lg border border-gray-200 p-3"
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons color="#4b5563" name="add" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View className="mt-6">
            <Text className="mb-2 font-semibold text-gray-900">Description</Text>
            <Text className="leading-6 text-gray-600">{product.description}</Text>
          </View>

          {/* Tags */}
          {product.tags.length > 0 ? (
            <View className="mt-6 flex-row flex-wrap gap-2">
              {product.tags.map((tag) => (
                <View key={tag} className="rounded-full bg-gray-100 px-3 py-1">
                  <Text className="text-sm text-gray-600">#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Spacer for bottom buttons */}
          <View className="h-32" />
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pb-8 pt-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center rounded-xl border-2 border-indigo-600 py-4 ${
              !inStock ? 'opacity-50' : ''
            }`}
            disabled={!inStock}
            onPress={handleAddToCart}
          >
            <Ionicons color="#4f46e5" name="cart-outline" size={20} />
            <Text className="ml-2 font-semibold text-indigo-600">Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 rounded-xl bg-indigo-600 py-4 ${!inStock ? 'opacity-50' : ''}`}
            disabled={!inStock}
            onPress={handleBuyNow}
          >
            <Text className="text-center font-semibold text-white">Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
