import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { searchApi, ProductSearchResult, CategorySearchResult } from '@/lib/api/search';
import { formatCurrency } from '@/lib/utils/formatting';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 20;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const RECENT_SEARCHES_KEY = 'admin_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Search result types for admin
interface AdminSearchResult {
  id: string;
  type: 'product' | 'customer' | 'order' | 'category';
  title: string;
  subtitle?: string;
  image?: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  meta?: string;
}

// Quick action config with gradients
const QUICK_ACTIONS = [
  {
    icon: 'cube' as const,
    label: 'Products',
    route: '/(tabs)/(admin)/products',
    gradient: ['#6366F1', '#8B5CF6'] as const,
    description: 'Manage inventory',
  },
  {
    icon: 'receipt' as const,
    label: 'Orders',
    route: '/(tabs)/(admin)/orders',
    gradient: ['#3B82F6', '#06B6D4'] as const,
    description: 'View & process',
  },
  {
    icon: 'people' as const,
    label: 'Customers',
    route: '/(tabs)/(admin)/customers',
    gradient: ['#10B981', '#34D399'] as const,
    description: 'Customer data',
  },
  {
    icon: 'pricetag' as const,
    label: 'Coupons',
    route: '/(tabs)/(admin)/coupons',
    gradient: ['#F59E0B', '#FBBF24'] as const,
    description: 'Discounts & offers',
  },
];

// Quick Action Card Component
function QuickActionCard({
  action,
  index,
  onPress,
}: {
  action: (typeof QUICK_ACTIONS)[0];
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).springify()}
      style={styles.quickActionWrapper}
    >
      <AnimatedTouchable
        onPressIn={() => {
          scale.value = withSpring(0.95);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        activeOpacity={1}
        style={[styles.quickActionCard, animatedStyle]}
      >
        <LinearGradient
          colors={action.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionIconContainer}>
            <Ionicons name={action.icon} size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionLabel}>{action.label}</Text>
          <Text style={styles.quickActionDescription}>{action.description}</Text>
        </LinearGradient>
      </AnimatedTouchable>
    </Animated.View>
  );
}

// Recent Search Item Component
function RecentSearchItem({
  query,
  index,
  onPress,
  onRemove,
}: {
  query: string;
  index: number;
  onPress: () => void;
  onRemove: () => void;
}) {
  const colors = useColors();

  return (
    <Animated.View entering={FadeInRight.delay(index * 30)}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.recentItem, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={[styles.recentIcon, { backgroundColor: `${colors.primary}10` }]}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.recentText, { color: colors.text }]} numberOfLines={1}>
          {query}
        </Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Search Result Card Component
function SearchResultCard({
  result,
  index,
  onPress,
}: {
  result: AdminSearchResult;
  index: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product':
        return '#6366F1';
      case 'customer':
        return '#10B981';
      case 'order':
        return '#3B82F6';
      case 'category':
        return '#F59E0B';
      default:
        return colors.textSecondary;
    }
  };

  const typeColor = getTypeColor(result.type);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.resultCard,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : 'transparent',
            borderWidth: isDark ? 1 : 0,
          },
        ]}
        activeOpacity={0.7}
      >
        {result.image ? (
          <Image source={{ uri: result.image }} style={styles.resultImage} />
        ) : (
          <View style={[styles.resultIconBox, { backgroundColor: `${typeColor}15` }]}>
            <Ionicons name={result.icon} size={22} color={typeColor} />
          </View>
        )}
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text
              style={[styles.resultTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {result.title}
            </Text>
            <View style={[styles.typePill, { backgroundColor: `${typeColor}15` }]}>
              <Text style={[styles.typeLabel, { color: typeColor }]}>
                {result.type}
              </Text>
            </View>
          </View>
          {result.subtitle && (
            <Text
              style={[styles.resultSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {result.subtitle}
            </Text>
          )}
          {result.meta && (
            <Text style={[styles.resultMeta, { color: colors.textTertiary }]}>
              {result.meta}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AdminSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
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
        // Ignore
      }
    };
    loadRecentSearches();
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback(
    async (searchQuery: string) => {
      try {
        const trimmed = searchQuery.trim();
        if (!trimmed || trimmed.length < 2) return;

        const updated = [
          trimmed,
          ...recentSearches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          ),
        ].slice(0, MAX_RECENT_SEARCHES);

        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        // Ignore
      }
    },
    [recentSearches]
  );

  // Remove recent search
  const removeRecentSearch = useCallback(
    async (searchQuery: string) => {
      try {
        const updated = recentSearches.filter(
          (s) => s.toLowerCase() !== searchQuery.toLowerCase()
        );
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Ignore
      }
    },
    [recentSearches]
  );

  // Clear all recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Ignore
    }
  }, []);

  // Global search query
  const { data: results = [], isLoading } = useQuery<AdminSearchResult[]>({
    queryKey: ['admin-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];

      // Save to recent searches
      saveRecentSearch(debouncedQuery);

      try {
        const globalResults = await searchApi.global(debouncedQuery, { perPage: 15 });
        const searchResults: AdminSearchResult[] = [];

        // Add products
        if (globalResults.products?.hits) {
          globalResults.products.hits.forEach((product: ProductSearchResult) => {
            searchResults.push({
              id: product.id,
              type: 'product',
              title: product.name,
              subtitle: product.brand || product.sku,
              image: product.image_url,
              icon: 'cube-outline',
              route: `/(tabs)/(admin)/product-detail?id=${product.id}`,
              meta: formatCurrency(product.price, product.currency),
            });
          });
        }

        // Add categories
        if (globalResults.categories?.hits) {
          globalResults.categories.hits.forEach((category: CategorySearchResult) => {
            searchResults.push({
              id: category.id,
              type: 'category',
              title: category.name,
              subtitle: category.description,
              icon: 'grid-outline',
              route: `/(tabs)/(admin)/products?category=${category.id}`,
              meta: `${category.product_count || 0} products`,
            });
          });
        }

        return searchResults;
      } catch (error) {
        console.error('Admin search error:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleResultPress = useCallback(
    (result: AdminSearchResult) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(result.route as any);
    },
    [router]
  );

  const handleQuickActionPress = useCallback(
    (route: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(route as any);
    },
    [router]
  );

  const handleRecentSearchPress = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const renderEmpty = useCallback(() => {
    if (isLoading || debouncedQuery.length < 2) return null;
    return (
      <Animated.View entering={FadeIn} style={styles.emptyContainer}>
        <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No results found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          We couldn't find anything matching "{debouncedQuery}"
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
          Try searching for products, categories, or SKUs
        </Text>
      </Animated.View>
    );
  }, [isLoading, debouncedQuery, colors]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with blur */}
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={isDark ? 40 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={[styles.backButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search products, orders, customers..."
                placeholderTextColor={colors.textTertiary}
                returnKeyType="search"
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery('');
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        {debouncedQuery.length >= 2 ? (
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Searching...
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              renderItem={({ item, index }) => (
                <SearchResultCard
                  result={item}
                  index={index}
                  onPress={() => handleResultPress(item)}
                />
              )}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <FlatList
            data={[]}
            renderItem={null}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.idleContent}
            ListHeaderComponent={
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(50)}
                    style={styles.section}
                  >
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Recent Searches
                      </Text>
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text style={[styles.clearButton, { color: colors.primary }]}>
                          Clear All
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.recentList}>
                      {recentSearches.map((item, index) => (
                        <RecentSearchItem
                          key={item}
                          query={item}
                          index={index}
                          onPress={() => handleRecentSearchPress(item)}
                          onRemove={() => removeRecentSearch(item)}
                        />
                      ))}
                    </View>
                  </Animated.View>
                )}

                {/* Quick Navigation */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Quick Navigation
                  </Text>
                  <View style={styles.quickActionsGrid}>
                    {QUICK_ACTIONS.map((action, index) => (
                      <QuickActionCard
                        key={action.label}
                        action={action}
                        index={index}
                        onPress={() => handleQuickActionPress(action.route)}
                      />
                    ))}
                  </View>
                </Animated.View>

                {/* Search Tips */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.tipsSection}>
                  <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
                    <Ionicons name="bulb-outline" size={20} color={colors.warning} />
                    <View style={styles.tipsContent}>
                      <Text style={[styles.tipsTitle, { color: colors.text }]}>
                        Search Tips
                      </Text>
                      <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                        Search by product name, SKU, category, or customer name
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  idleContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    width: ITEM_WIDTH,
    marginBottom: GRID_GAP,
  },
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 120,
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  tipsSection: {
    marginTop: 8,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 14,
  },
  resultImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  resultIconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    gap: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
