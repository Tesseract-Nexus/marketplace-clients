import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { searchApi, ProductSearchResult, CategorySearchResult } from '../../../lib/api/search';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatCurrency } from '../../../lib/utils/formatting';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

// Using ProductSearchResult from search API for type consistency
interface SearchSuggestion {
  type: 'product' | 'category' | 'query';
  id?: string;
  name: string;
  image?: string;
}

export default function SearchScreen() {
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery || '');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(true);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (error) {
        // Ignore error
      }
    };
    loadRecentSearches();
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback(async (searchQuery: string) => {
    try {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      const updated = [
        trimmed,
        ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      // Ignore error
    }
  }, [recentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      // Ignore error
    }
  }, []);

  // Suggestions query - using Typesense-powered search API
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<
    SearchSuggestion[]
  >({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];

      // Get suggestions from products (Typesense-powered)
      const productSuggestions = await searchApi.suggestions(debouncedQuery, 'products', 5);

      // Transform to SearchSuggestion format
      return (productSuggestions as ProductSearchResult[]).map((item) => ({
        type: 'product' as const,
        id: item.id,
        name: item.name,
        image: item.image_url,
      }));
    },
    enabled: debouncedQuery.length >= 2 && isFocused,
  });

  // Search results query - using Typesense-powered search API
  const {
    data: resultsData,
    isLoading: resultsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search-results', debouncedQuery],
    queryFn: async ({ pageParam = 1 }) => {
      // Use Typesense-powered product search
      const result = await searchApi.products(debouncedQuery, {
        page: pageParam,
        per_page: 20,
        filter_by: 'in_stock:=true', // Only show in-stock items for storefront
      });

      return {
        data: result.hits,
        meta: {
          page: result.page,
          total: result.found,
          total_pages: Math.ceil(result.out_of / 20),
        },
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.page < lastPage.meta?.total_pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: debouncedQuery.length >= 2 && !isFocused,
  });

  const results: ProductSearchResult[] = resultsData?.pages.flatMap((page) => page.data) ?? [];

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      saveRecentSearch(query);
      setIsFocused(false);
      Keyboard.dismiss();
    }
  }, [query, saveRecentSearch]);

  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === 'product' && suggestion.id) {
        router.push(`/(tabs)/(storefront)/product?id=${suggestion.id}`);
      } else if (suggestion.type === 'category' && suggestion.id) {
        router.push(`/(tabs)/(storefront)/category?id=${suggestion.id}`);
      } else {
        setQuery(suggestion.name);
        saveRecentSearch(suggestion.name);
        setIsFocused(false);
        Keyboard.dismiss();
      }
    },
    [router, saveRecentSearch]
  );

  const handleRecentSearchPress = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setIsFocused(false);
    Keyboard.dismiss();
  }, []);

  const handleProductPress = useCallback(
    (product: ProductSearchResult) => {
      router.push(`/(tabs)/(storefront)/product?id=${product.id}`);
    },
    [router]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderSuggestion = useCallback(
    ({ item }: { item: SearchSuggestion }) => (
      <TouchableOpacity
        onPress={() => handleSuggestionPress(item)}
        className="flex-row items-center px-4 py-3 border-b border-gray-100"
      >
        {item.type === 'product' && item.image ? (
          <Image
            source={{ uri: item.image }}
            className="h-10 w-10 rounded-lg"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Ionicons
              name={
                item.type === 'category'
                  ? 'grid-outline'
                  : item.type === 'product'
                  ? 'cube-outline'
                  : 'search-outline'
              }
              size={20}
              color="#6b7280"
            />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="text-gray-900">{item.name}</Text>
          <Text className="text-xs text-gray-500 capitalize">{item.type}</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
    ),
    [handleSuggestionPress]
  );

  const renderResult = useCallback(
    ({ item }: { item: ProductSearchResult }) => {
      // Calculate discount if sale_price exists and is less than price
      const discount = item.sale_price && item.sale_price < item.price
        ? Math.round(((item.price - item.sale_price) / item.price) * 100)
        : 0;

      // Use sale_price for display if available, otherwise regular price
      const displayPrice = item.sale_price && item.sale_price < item.price
        ? item.sale_price
        : item.price;

      return (
        <TouchableOpacity
          onPress={() => handleProductPress(item)}
          className="mb-3 flex-row rounded-xl bg-white p-3 shadow-sm mx-4"
        >
          <Image
            source={{ uri: item.image_url || 'https://via.placeholder.com/96' }}
            className="h-24 w-24 rounded-lg"
          />
          <View className="ml-3 flex-1 justify-center">
            {item.brand && (
              <Text className="text-xs text-gray-500">{item.brand}</Text>
            )}
            <Text className="mt-1 font-medium text-gray-900" numberOfLines={2}>
              {item.name}
            </Text>
            <View className="mt-2 flex-row items-baseline">
              <Text className="font-bold text-indigo-600">
                {formatCurrency(displayPrice, item.currency)}
              </Text>
              {discount > 0 && (
                <>
                  <Text className="ml-2 text-sm text-gray-400 line-through">
                    {formatCurrency(item.price, item.currency)}
                  </Text>
                  <View className="ml-2 rounded bg-red-100 px-1.5 py-0.5">
                    <Text className="text-xs font-medium text-red-600">-{discount}%</Text>
                  </View>
                </>
              )}
            </View>
            {!item.in_stock && (
              <Text className="mt-1 text-xs text-red-500">Out of Stock</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleProductPress]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (resultsLoading || debouncedQuery.length < 2) return null;
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Ionicons name="search-outline" size={48} color="#d1d5db" />
        <Text className="mt-4 text-lg font-medium text-gray-900">No Results Found</Text>
        <Text className="mt-1 text-center text-gray-500 px-8">
          We couldn't find anything matching "{debouncedQuery}"
        </Text>
      </View>
    );
  }, [resultsLoading, debouncedQuery]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="flex-1 bg-gray-50 pt-14">
        {/* Search Bar */}
        <View className="flex-row items-center px-4 pb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onSubmitEditing={handleSearch}
              placeholder="Search products..."
              returnKeyType="search"
              autoFocus
              className="ml-2 flex-1 text-base text-gray-900"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {isFocused ? (
          <View className="flex-1">
            {/* Suggestions */}
            {debouncedQuery.length >= 2 ? (
              suggestionsLoading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              ) : suggestions.length > 0 ? (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
                  renderItem={renderSuggestion}
                  keyboardShouldPersistTaps="handled"
                  className="bg-white"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-gray-500">No suggestions found</Text>
                </View>
              )
            ) : (
              /* Recent Searches */
              <View className="flex-1 bg-white">
                {recentSearches.length > 0 && (
                  <>
                    <View className="flex-row items-center justify-between px-4 py-3">
                      <Text className="font-semibold text-gray-900">Recent Searches</Text>
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text className="text-sm text-indigo-600">Clear All</Text>
                      </TouchableOpacity>
                    </View>
                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleRecentSearchPress(search)}
                        className="flex-row items-center border-b border-gray-100 px-4 py-3"
                      >
                        <Ionicons name="time-outline" size={18} color="#9ca3af" />
                        <Text className="ml-3 flex-1 text-gray-700">{search}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Popular Searches */}
                <View className="mt-6 px-4">
                  <Text className="mb-3 font-semibold text-gray-900">Popular Searches</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['T-Shirts', 'Sneakers', 'Watches', 'Bags', 'Sunglasses', 'Jackets'].map(
                      (term) => (
                        <TouchableOpacity
                          key={term}
                          onPress={() => handleRecentSearchPress(term)}
                          className="rounded-full bg-gray-100 px-4 py-2"
                        >
                          <Text className="text-gray-700">{term}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* Search Results */
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResult}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </>
  );
}
