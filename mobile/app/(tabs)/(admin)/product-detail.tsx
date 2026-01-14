import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/formatting';
import { productsApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import type { Product } from '@/types/entities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, id],
    queryFn: async (): Promise<Product> => {
      // Mock data for demo
      return {
        id: id!,
        tenant_id: '1',
        name: 'Premium Wireless Headphones',
        slug: 'premium-wireless-headphones',
        description: 'High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals alike.',
        price: 199.99,
        compare_at_price: 249.99,
        cost_price: 89.99,
        sku: 'WH-001',
        barcode: '123456789',
        inventory_quantity: 45,
        low_stock_threshold: 10,
        track_inventory: true,
        status: 'active',
        images: [
          { id: '1', url: 'https://picsum.photos/seed/prod1/800/800', alt: 'Product image 1', position: 0 },
          { id: '2', url: 'https://picsum.photos/seed/prod2/800/800', alt: 'Product image 2', position: 1 },
          { id: '3', url: 'https://picsum.photos/seed/prod3/800/800', alt: 'Product image 3', position: 2 },
        ],
        variants: [
          { id: 'v1', name: 'Black', sku: 'WH-001-BLK', price: 199.99, inventory_quantity: 20 },
          { id: 'v2', name: 'White', sku: 'WH-001-WHT', price: 199.99, inventory_quantity: 15 },
          { id: 'v3', name: 'Navy', sku: 'WH-001-NVY', price: 209.99, inventory_quantity: 10 },
        ],
        category_id: 'electronics',
        vendor_id: 'vendor-1',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!id,
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
      toast.success('Product deleted');
      router.back();
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const stockStatus = !product
    ? 'loading'
    : product.inventory_quantity === 0
    ? 'out-of-stock'
    : product.inventory_quantity <= (product.low_stock_threshold || 10)
    ? 'low-stock'
    : 'in-stock';

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <IconButton
            icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
            onPress={() => router.back()}
          />
        </View>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Skeleton width={SCREEN_WIDTH} height={SCREEN_WIDTH} borderRadius={0} />
          <View style={styles.content}>
            <Skeleton width="70%" height={28} borderRadius={8} />
            <Skeleton width="40%" height={24} borderRadius={8} style={{ marginTop: 8 }} />
            <Skeleton width="100%" height={100} borderRadius={12} style={{ marginTop: 16 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <IconButton
            icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
            onPress={() => router.back()}
          />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
        </View>
      </View>
    );
  }

  const profit = product.price - (product.cost_price || 0);
  const margin = product.cost_price ? ((profit / product.price) * 100).toFixed(1) : 'N/A';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
          onPress={() => router.back()}
        />
        <View style={styles.headerActions}>
          <IconButton
            icon={<Ionicons name="create-outline" size={24} color={colors.text} />}
            onPress={() => router.push(`/(tabs)/(admin)/edit-product?id=${id}` as any)}
          />
          <IconButton
            icon={<Ionicons name="trash-outline" size={24} color={colors.error} />}
            onPress={handleDelete}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.[activeImageIndex]?.url || 'https://via.placeholder.com/400' }}
            style={styles.mainImage}
          />
          <Badge
            label={product.status === 'active' ? 'Active' : 'Draft'}
            variant={product.status === 'active' ? 'success' : 'secondary'}
            style={styles.statusBadge}
          />
          {product.images && product.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {product.images.map((image, index) => (
                <Pressable
                  key={image.id}
                  onPress={() => setActiveImageIndex(index)}
                  style={[
                    styles.thumbnail,
                    { borderColor: index === activeImageIndex ? colors.primary : colors.border },
                  ]}
                >
                  <Image source={{ uri: image.url }} style={styles.thumbnailImage} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.primary }]}>
                {formatCurrency(product.price)}
              </Text>
              {product.compare_at_price && (
                <Text style={[styles.comparePrice, { color: colors.textTertiary }]}>
                  {formatCurrency(product.compare_at_price)}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Ionicons name="cube-outline" size={20} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatNumber(product.inventory_quantity)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Stock</Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{margin}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Margin</Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="cart-outline" size={20} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>128</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
            </Card>
          </Animated.View>

          {/* Stock Alert */}
          {stockStatus !== 'in-stock' && (
            <Animated.View entering={FadeInDown.delay(250)}>
              <View
                style={[
                  styles.alertCard,
                  { backgroundColor: stockStatus === 'out-of-stock' ? colors.errorLight : colors.warningLight },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={stockStatus === 'out-of-stock' ? colors.error : colors.warning}
                />
                <Text
                  style={[
                    styles.alertText,
                    { color: stockStatus === 'out-of-stock' ? colors.error : colors.warning },
                  ]}
                >
                  {stockStatus === 'out-of-stock' ? 'This product is out of stock' : 'Low stock - consider restocking'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {product.description}
              </Text>
            </Card>
          </Animated.View>

          {/* Product Details */}
          <Animated.View entering={FadeInDown.delay(350)}>
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
              {[
                { label: 'SKU', value: product.sku || 'N/A' },
                { label: 'Barcode', value: product.barcode || 'N/A' },
                { label: 'Cost Price', value: formatCurrency(product.cost_price || 0) },
                { label: 'Profit', value: formatCurrency(profit) },
                { label: 'Created', value: formatDate(product.created_at) },
                { label: 'Updated', value: formatDate(product.updated_at) },
              ].map((item, index) => (
                <View key={index} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </Card>
          </Animated.View>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400)}>
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Variants</Text>
                {product.variants.map((variant, index) => (
                  <View
                    key={variant.id}
                    style={[
                      styles.variantRow,
                      { borderBottomColor: colors.border },
                      index === product.variants!.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View>
                      <Text style={[styles.variantName, { color: colors.text }]}>{variant.name}</Text>
                      <Text style={[styles.variantSku, { color: colors.textTertiary }]}>
                        {variant.sku}
                      </Text>
                    </View>
                    <View style={styles.variantRight}>
                      <Text style={[styles.variantPrice, { color: colors.text }]}>
                        {formatCurrency(variant.price)}
                      </Text>
                      <Text style={[styles.variantStock, { color: colors.textSecondary }]}>
                        {variant.inventory_quantity} in stock
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomActions,
          { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16, borderTopColor: colors.border },
        ]}
      >
        <Button
          title="Edit Product"
          variant="outline"
          style={{ flex: 1 }}
          leftIcon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
          onPress={() => router.push(`/(tabs)/(admin)/edit-product?id=${id}` as any)}
        />
        <Button
          title="Duplicate"
          style={{ flex: 1 }}
          leftIcon={<Ionicons name="copy-outline" size={18} color="#FFFFFF" />}
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingContent: {
    paddingTop: 100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  statusBadge: {
    position: 'absolute',
    top: 100,
    right: 16,
  },
  thumbnailContainer: {
    padding: 16,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  comparePrice: {
    fontSize: 18,
    textDecorationLine: 'line-through',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 20,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  variantName: {
    fontSize: 15,
    fontWeight: '600',
  },
  variantSku: {
    fontSize: 12,
    marginTop: 2,
  },
  variantRight: {
    alignItems: 'flex-end',
  },
  variantPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  variantStock: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
});
