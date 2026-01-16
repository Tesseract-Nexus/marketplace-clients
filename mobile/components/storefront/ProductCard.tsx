import React, { useCallback } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useColors, useShadows, useBorderRadius } from '@/providers/ThemeProvider';
import { useCartStore } from '@/stores/cart-store';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatting';
import type { Product } from '@/types/entities';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'hero' | 'minimal';
  index?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ProductCard({
  product,
  variant = 'default',
  index = 0,
  onPress,
  style,
}: ProductCardProps) {
  const colors = useColors();
  const shadows = useShadows();
  const borderRadius = useBorderRadius();
  const router = useRouter();
  const { addItem } = useCartStore();

  const scale = useSharedValue(1);
  const liked = useSharedValue(0);

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/(storefront)/product?id=${product.id}`);
    }
  }, [onPress, product.id, router]);

  const handleAddToCart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void addItem(product, undefined, 1);
  }, [addItem, product]);

  const handleLike = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    liked.value = withSpring(liked.value === 0 ? 1 : 0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(liked.value, [0, 0.5, 1], [1, 1.3, 1]) }],
  }));

  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/400';

  if (variant === 'hero') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[styles.heroContainer, style]}
      >
        <AnimatedPressable
          style={[styles.heroCard, { backgroundColor: colors.card }, shadows.lg, animatedStyle]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              {discount > 0 ? <Badge label={`${discount}% OFF`} size="sm" variant="error" /> : null}
              <Pressable
                style={[styles.heroLikeButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={handleLike}
              >
                <Animated.View style={heartAnimatedStyle}>
                  <Ionicons
                    color="#FFFFFF"
                    name={liked.value > 0.5 ? 'heart' : 'heart-outline'}
                    size={22}
                  />
                </Animated.View>
              </Pressable>
            </View>
            <View style={styles.heroFooter}>
              <Text numberOfLines={2} style={styles.heroName}>
                {product.name}
              </Text>
              <View style={styles.heroPriceRow}>
                <Text style={styles.heroPrice}>{formatCurrency(product.price)}</Text>
                {product.compare_at_price ? (
                  <Text style={styles.heroComparePrice}>
                    {formatCurrency(product.compare_at_price)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.heroAddButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleAddToCart}
          >
            <Ionicons color="#FFFFFF" name="add" size={24} />
          </Pressable>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  if (variant === 'compact') {
    return (
      <Animated.View
        entering={FadeInRight.delay(index * 50)}
        style={[styles.compactContainer, style]}
      >
        <AnimatedPressable
          style={[styles.compactCard, { backgroundColor: colors.card }, shadows.sm, animatedStyle]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Image source={{ uri: imageUrl }} style={styles.compactImage} />
          <View style={styles.compactContent}>
            <Text numberOfLines={1} style={[styles.compactName, { color: colors.text }]}>
              {product.name}
            </Text>
            <Text style={[styles.compactPrice, { color: colors.primary }]}>
              {formatCurrency(product.price)}
            </Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  if (variant === 'minimal') {
    return (
      <Animated.View entering={FadeIn.delay(index * 50)} style={[styles.minimalContainer, style]}>
        <AnimatedPressable
          style={animatedStyle}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Image
            source={{ uri: imageUrl }}
            style={[styles.minimalImage, { borderRadius: borderRadius.lg }]}
          />
          <Text numberOfLines={1} style={[styles.minimalName, { color: colors.text }]}>
            {product.name}
          </Text>
          <Text style={[styles.minimalPrice, { color: colors.textSecondary }]}>
            {formatCurrency(product.price)}
          </Text>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  // Default variant
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[styles.defaultContainer, style]}
    >
      <AnimatedPressable
        style={[
          styles.defaultCard,
          { backgroundColor: colors.card, borderRadius: borderRadius.xl },
          shadows.md,
          animatedStyle,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.defaultImage, { borderRadius: borderRadius.xl }]}
          />

          {/* Discount Badge */}
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Badge label={`-${discount}%`} size="sm" variant="error" />
            </View>
          ) : null}

          {/* Wishlist Button */}
          <Pressable
            style={[
              styles.wishlistButton,
              {
                backgroundColor: colors.background,
                borderRadius: borderRadius.full,
              },
            ]}
            onPress={handleLike}
          >
            <Animated.View style={heartAnimatedStyle}>
              <Ionicons
                color={liked.value > 0.5 ? colors.error : colors.text}
                name={liked.value > 0.5 ? 'heart' : 'heart-outline'}
                size={18}
              />
            </Animated.View>
          </Pressable>

          {/* Quick Add Button */}
          <Pressable
            style={({ pressed }) => [
              styles.quickAddButton,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.full,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleAddToCart}
          >
            <Ionicons color="#FFFFFF" name="add" size={20} />
          </Pressable>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text numberOfLines={2} style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>

          {/* Rating */}
          {product.rating_average > 0 ? (
            <View style={styles.ratingRow}>
              <Ionicons color={colors.warning} name="star" size={12} />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {product.rating_average.toFixed(1)} ({product.rating_count})
              </Text>
            </View>
          ) : null}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatCurrency(product.price)}
            </Text>
            {product.compare_at_price ? (
              <Text style={[styles.comparePrice, { color: colors.textTertiary }]}>
                {formatCurrency(product.compare_at_price)}
              </Text>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Featured Product Card - Extra large for hero sections
interface FeaturedProductCardProps {
  product: Product;
  onPress?: () => void;
}

export function FeaturedProductCard({ product, onPress }: FeaturedProductCardProps) {
  const colors = useColors();
  const shadows = useShadows();
  const router = useRouter();
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/(storefront)/product?id=${product.id}`);
    }
  }, [onPress, product.id, router]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <AnimatedPressable
        style={[styles.featuredCard, shadows.xl, animatedStyle]}
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
      >
        <Image source={{ uri: product.images?.[0]?.url }} style={styles.featuredImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          locations={[0.4, 1]}
          style={styles.featuredGradient}
        />
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadges}>
            {product.is_featured ? <Badge label="Featured" size="sm" variant="primary" /> : null}
            {product.compare_at_price ? (
              <Badge
                label={`${Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF`}
                size="sm"
                variant="error"
              />
            ) : null}
          </View>
          <Text style={styles.featuredName}>{product.name}</Text>
          <Text numberOfLines={2} style={styles.featuredDescription}>
            {product.short_description || product.description}
          </Text>
          <View style={styles.featuredPriceRow}>
            <Text style={styles.featuredPrice}>{formatCurrency(product.price)}</Text>
            {product.compare_at_price ? (
              <Text style={styles.featuredComparePrice}>
                {formatCurrency(product.compare_at_price)}
              </Text>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Default variant
  defaultContainer: {
    width: (SCREEN_WIDTH - 52) / 2,
  },
  defaultCard: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  defaultImage: {
    width: '100%',
    height: 160,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAddButton: {
    position: 'absolute',
    bottom: -16,
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  contentSection: {
    padding: 12,
    paddingTop: 20,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    minHeight: 40,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  comparePrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },

  // Hero variant
  heroContainer: {
    width: SCREEN_WIDTH - 40,
    height: 280,
  },
  heroCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLikeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFooter: {},
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPrice: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  heroComparePrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  heroAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Compact variant
  compactContainer: {
    width: 160,
  },
  compactCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: 120,
  },
  compactContent: {
    padding: 12,
  },
  compactName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Minimal variant
  minimalContainer: {
    width: 120,
    alignItems: 'center',
  },
  minimalImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  minimalName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  minimalPrice: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Featured variant
  featuredCard: {
    width: SCREEN_WIDTH - 40,
    height: 400,
    borderRadius: 28,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  featuredBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  featuredDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featuredPrice: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  featuredComparePrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    textDecorationLine: 'line-through',
  },
});
