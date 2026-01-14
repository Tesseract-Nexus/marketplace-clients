import { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import Carousel from 'react-native-reanimated-carousel';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark, useShadows, useBorderRadius } from '@/providers/ThemeProvider';
import { useTenantStore } from '@/stores/tenant-store';
import { useCartStore } from '@/stores/cart-store';
import { ProductCard, FeaturedProductCard } from '@/components/storefront/ProductCard';
import { GlassMorphism } from '@/components/ui/GlassMorphism';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/formatting';
import { QUERY_KEYS } from '@/lib/constants';
import type { Product, Category } from '@/types/entities';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// Hero Banner Data
interface HeroBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  cta?: string;
  gradient: string[];
}

// Section Header Component
function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  delay?: number;
}) {
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.sectionHeader}
    >
      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          style={({ pressed }) => [
            styles.seeAllButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

// Category Pill Component
function CategoryPill({
  category,
  index,
  isSelected,
  onPress,
}: {
  category: Category;
  index: number;
  isSelected?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(100 + index * 50).springify()}>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.95);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        style={[
          styles.categoryPill,
          {
            backgroundColor: isSelected
              ? colors.primary
              : isDark
              ? colors.surface
              : colors.background,
            borderColor: isSelected ? colors.primary : colors.border,
          },
          animatedStyle,
        ]}
      >
        <Image source={{ uri: category.image_url }} style={styles.categoryIcon} />
        <Text
          style={[
            styles.categoryPillText,
            { color: isSelected ? '#FFFFFF' : colors.text },
          ]}
        >
          {category.name}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Flash Sale Timer Component
function FlashSaleTimer({ endTime }: { endTime: Date }) {
  const colors = useColors();

  // Simple countdown display (in production, use actual countdown logic)
  const hours = 2;
  const minutes = 45;
  const seconds = 30;

  return (
    <View style={styles.timerContainer}>
      <View style={[styles.timerBlock, { backgroundColor: colors.text }]}>
        <Text style={[styles.timerText, { color: colors.background }]}>{hours.toString().padStart(2, '0')}</Text>
      </View>
      <Text style={[styles.timerColon, { color: colors.text }]}>:</Text>
      <View style={[styles.timerBlock, { backgroundColor: colors.text }]}>
        <Text style={[styles.timerText, { color: colors.background }]}>{minutes.toString().padStart(2, '0')}</Text>
      </View>
      <Text style={[styles.timerColon, { color: colors.text }]}>:</Text>
      <View style={[styles.timerBlock, { backgroundColor: colors.text }]}>
        <Text style={[styles.timerText, { color: colors.background }]}>{seconds.toString().padStart(2, '0')}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const shadows = useShadows();
  const borderRadius = useBorderRadius();
  const { currentTenant } = useTenantStore();
  const { cart, getItemCount } = useCartStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header background
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Fetch home page data
  const tenantId = currentTenant?.id || 'default';
  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.HOME_PAGE(tenantId),
    queryFn: async () => {
      // Premium mock data for demo-store
      const banners: HeroBanner[] = [
        {
          id: '1',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
          title: 'Winter Collection',
          subtitle: 'Discover the latest trends',
          cta: 'Shop Now',
          gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)'],
        },
        {
          id: '2',
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
          title: 'Flash Sale',
          subtitle: 'Up to 70% off',
          cta: 'Explore Deals',
          gradient: ['rgba(239,68,68,0)', 'rgba(239,68,68,0.8)'],
        },
        {
          id: '3',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
          title: 'Premium Quality',
          subtitle: 'Curated for you',
          cta: 'View Collection',
          gradient: ['rgba(79,70,229,0)', 'rgba(79,70,229,0.7)'],
        },
      ];

      const categories: Category[] = [
        { id: '1', tenant_id: '1', name: 'Fashion', slug: 'fashion', image_url: 'https://cdn-icons-png.flaticon.com/128/3531/3531849.png', position: 1, is_active: true, product_count: 256, created_at: '', updated_at: '' },
        { id: '2', tenant_id: '1', name: 'Electronics', slug: 'electronics', image_url: 'https://cdn-icons-png.flaticon.com/128/3659/3659899.png', position: 2, is_active: true, product_count: 189, created_at: '', updated_at: '' },
        { id: '3', tenant_id: '1', name: 'Home', slug: 'home', image_url: 'https://cdn-icons-png.flaticon.com/128/2838/2838912.png', position: 3, is_active: true, product_count: 142, created_at: '', updated_at: '' },
        { id: '4', tenant_id: '1', name: 'Beauty', slug: 'beauty', image_url: 'https://cdn-icons-png.flaticon.com/128/3163/3163186.png', position: 4, is_active: true, product_count: 98, created_at: '', updated_at: '' },
        { id: '5', tenant_id: '1', name: 'Sports', slug: 'sports', image_url: 'https://cdn-icons-png.flaticon.com/128/857/857455.png', position: 5, is_active: true, product_count: 76, created_at: '', updated_at: '' },
      ];

      const products = (prefix: string, count: number): Product[] =>
        Array.from({ length: count }, (_, i) => ({
          id: `${prefix}-${i}`,
          tenant_id: '1',
          name: [
            'Premium Wireless Headphones',
            'Designer Leather Bag',
            'Smart Fitness Watch',
            'Organic Cotton Shirt',
            'Minimalist Desk Lamp',
            'Vintage Sunglasses',
            'Ceramic Plant Pot',
            'Bluetooth Speaker',
          ][i % 8],
          slug: `product-${prefix}-${i}`,
          description: 'Premium quality product with exceptional craftsmanship',
          short_description: 'Handcrafted with care',
          price: [79, 199, 249, 59, 89, 129, 45, 159][i % 8],
          compare_at_price: i % 3 === 0 ? [99, 249, 299, 79, 119, 169, 65, 199][i % 8] : undefined,
          currency: 'USD',
          status: 'active' as const,
          visibility: 'visible' as const,
          product_type: 'simple' as const,
          inventory_policy: 'track' as const,
          weight_unit: 'kg' as const,
          inventory_quantity: 50,
          low_stock_threshold: 10,
          is_featured: i < 2,
          is_taxable: true,
          requires_shipping: true,
          rating_average: 4.2 + (i % 8) * 0.1,
          rating_count: 20 + i * 5,
          tags: [],
          images: [{
            id: '1',
            url: `https://picsum.photos/seed/${prefix}${i}/400/400`,
            position: 0,
            is_primary: true,
          }],
          variants: [],
          options: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      return {
        banners,
        categories,
        featuredProducts: products('featured', 4),
        flashSaleProducts: products('flash', 6),
        newArrivals: products('new', 6),
        recommended: products('rec', 4),
      };
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const cartItemCount = getItemCount();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header Background */}
      <Animated.View
        style={[
          styles.headerBackground,
          { backgroundColor: colors.background, height: insets.top + 56 },
          headerAnimatedStyle,
        ]}
      >
        {Platform.OS === 'ios' && (
          <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        )}
      </Animated.View>

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeIn} style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Welcome to
            </Text>
            <Text style={[styles.storeName, { color: colors.text }]}>
              {currentTenant?.name || 'Demo Store'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(storefront)/search');
              }}
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="search" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(storefront)/cart');
              }}
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="bag-outline" size={22} color={colors.text} />
              {cartItemCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={insets.top + 70}
          />
        }
      >
        {/* Hero Carousel */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          {isLoading ? (
            <Skeleton
              width={SCREEN_WIDTH - 32}
              height={220}
              borderRadius={24}
              style={{ marginHorizontal: 16, marginBottom: 24 }}
            />
          ) : (
            <View style={styles.carouselContainer}>
              <Carousel
                width={SCREEN_WIDTH - 32}
                height={220}
                data={data?.banners || []}
                autoPlay
                autoPlayInterval={5000}
                scrollAnimationDuration={800}
                onSnapToItem={setActiveBannerIndex}
                style={styles.carousel}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.bannerCard}
                    onPress={() =>
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                  >
                    <Image source={{ uri: item.image }} style={styles.bannerImage} />
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.bannerGradient}
                    />
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                      )}
                      {item.cta && (
                        <View style={styles.bannerCta}>
                          <Text style={styles.bannerCtaText}>{item.cta}</Text>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                )}
              />
              {/* Carousel Indicators */}
              <View style={styles.carouselIndicators}>
                {data?.banners.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor:
                          index === activeBannerIndex
                            ? colors.primary
                            : colors.border,
                        width: index === activeBannerIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title="Categories"
            onSeeAll={() => router.push('/(tabs)/(storefront)/browse')}
            delay={200}
          />
          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  width={100}
                  height={44}
                  borderRadius={22}
                  style={{ marginRight: 8, marginLeft: i === 1 ? 16 : 0 }}
                />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {data?.categories.map((category, index) => (
                <CategoryPill
                  key={category.id}
                  category={category}
                  index={index}
                  onPress={() =>
                    router.push(`/(tabs)/(storefront)/category?id=${category.id}`)
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Flash Sale Section */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.section}
        >
          <LinearGradient
            colors={isDark ? ['#7C3AED', '#4F46E5'] : ['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.flashSaleHeader, { borderRadius: borderRadius.xl }]}
          >
            <View style={styles.flashSaleInfo}>
              <View style={styles.flashSaleIconContainer}>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.flashSaleTitle}>Flash Sale</Text>
                <Text style={styles.flashSaleSubtitle}>Ends in</Text>
              </View>
            </View>
            <FlashSaleTimer endTime={new Date()} />
          </LinearGradient>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    width={160}
                    height={220}
                    borderRadius={16}
                    style={{ marginRight: 12 }}
                  />
                ))
              : data?.flashSaleProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="compact"
                    index={index}
                  />
                ))}
          </ScrollView>
        </Animated.View>

        {/* Featured Product - Full Width Hero */}
        {data?.featuredProducts?.[0] && (
          <View style={styles.section}>
            <SectionHeader
              title="Featured"
              subtitle="Handpicked for you"
              delay={400}
            />
            <View style={styles.featuredContainer}>
              <FeaturedProductCard product={data.featuredProducts[0]} />
            </View>
          </View>
        )}

        {/* New Arrivals Grid */}
        <View style={styles.section}>
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh from the collection"
            onSeeAll={() => router.push('/(tabs)/(storefront)/browse')}
            delay={500}
          />
          <View style={styles.productsGrid}>
            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    width={(SCREEN_WIDTH - 52) / 2}
                    height={260}
                    borderRadius={16}
                  />
                ))
              : data?.newArrivals.slice(0, 4).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="default"
                    index={index}
                  />
                ))}
          </View>
        </View>

        {/* Promo Banner */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.section}
        >
          <Pressable
            onPress={() =>
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <LinearGradient
              colors={isDark ? ['#1F2937', '#111827'] : ['#F3F4F6', '#E5E7EB']}
              style={[styles.promoBanner, { borderRadius: borderRadius.xl }]}
            >
              <View style={styles.promoContent}>
                <Badge label="Limited Time" variant="primary" size="sm" />
                <Text style={[styles.promoTitle, { color: colors.text }]}>
                  Get 20% Off
                </Text>
                <Text style={[styles.promoSubtitle, { color: colors.textSecondary }]}>
                  On your first order
                </Text>
                <View style={styles.promoCodeContainer}>
                  <Text style={[styles.promoCode, { color: colors.primary }]}>
                    WELCOME20
                  </Text>
                  <Feather name="copy" size={16} color={colors.primary} />
                </View>
              </View>
              <View
                style={[styles.promoIconContainer, { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name="gift" size={48} color={colors.primary} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Recommended For You */}
        <View style={styles.section}>
          <SectionHeader
            title="Recommended"
            subtitle="Based on your preferences"
            onSeeAll={() => router.push('/(tabs)/(storefront)/browse')}
            delay={700}
          />
          <View style={styles.productsGrid}>
            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    width={(SCREEN_WIDTH - 52) / 2}
                    height={260}
                    borderRadius={16}
                  />
                ))
              : data?.recommended.slice(0, 4).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="default"
                    index={index}
                  />
                ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  carouselContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  carousel: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 16,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flashSaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  flashSaleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flashSaleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashSaleTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  flashSaleSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerBlock: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timerColon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredContainer: {
    paddingHorizontal: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  promoBanner: {
    marginHorizontal: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  promoSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  promoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
