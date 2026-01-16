import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, Layout, FadeOut } from 'react-native-reanimated';

import { useColors } from '@/providers/ThemeProvider';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/formatting';
import type { CartItem } from '@/types/entities';

function CartItemCard({ item, index }: { item: CartItem; index: number }) {
  const colors = useColors();
  const { updateItemQuantity, removeItem } = useCartStore();

  const imageUrl = item.product?.images?.[0]?.url || 'https://via.placeholder.com/100';
  const productName = item.product?.name || 'Product';
  const variantName = item.variant?.name;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <Card style={styles.cartItem}>
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text numberOfLines={2} style={[styles.itemName, { color: colors.text }]}>
            {productName}
          </Text>
          {variantName ? (
            <Text style={[styles.itemVariant, { color: colors.textSecondary }]}>{variantName}</Text>
          ) : null}
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            {formatCurrency(item.unit_price)}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <Pressable
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
            onPress={() => void updateItemQuantity(item.id, item.quantity - 1)}
          >
            <Ionicons color={colors.text} name="remove" size={18} />
          </Pressable>
          <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
          <Pressable
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
            onPress={() => void updateItemQuantity(item.id, item.quantity + 1)}
          >
            <Ionicons color={colors.text} name="add" size={18} />
          </Pressable>
        </View>
        <Pressable style={styles.removeButton} onPress={() => void removeItem(item.id)}>
          <Ionicons color={colors.error} name="trash-outline" size={18} />
        </Pressable>
      </Card>
    </Animated.View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { cart, clearCart, getSubtotal } = useCartStore();

  const items = cart?.items || [];
  const subtotal = getSubtotal();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Cart</Text>
        </View>
        <EmptyState
          actionLabel="Start Shopping"
          description="Browse our products and add items to your cart"
          icon="cart-outline"
          title="Your cart is empty"
          onAction={() => router.push('/(tabs)/(storefront)/browse')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeInDown} style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Cart</Text>
          <Pressable onPress={clearCart}>
            <Text style={[styles.clearButton, { color: colors.error }]}>Clear All</Text>
          </Pressable>
        </Animated.View>
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <CartItemCard key={item.id} index={index} item={item} />
          ))}
        </View>

        {/* Promo Code */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.promoSection}>
            <View style={[styles.promoInput, { borderColor: colors.border }]}>
              <Ionicons color={colors.textSecondary} name="pricetag-outline" size={20} />
              <Text style={[styles.promoPlaceholder, { color: colors.textTertiary }]}>
                Enter promo code
              </Text>
            </View>
            <Pressable style={[styles.applyButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </Card>
        </Animated.View>

        {/* Free Shipping Banner */}
        {subtotal < 50 ? (
          <Animated.View entering={FadeInDown.delay(250)}>
            <View style={[styles.shippingBanner, { backgroundColor: colors.infoLight }]}>
              <Ionicons color={colors.info} name="car-outline" size={20} />
              <Text style={[styles.shippingText, { color: colors.info }]}>
                Add {formatCurrency(50 - subtotal)} more for free shipping!
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Checkout Section */}
      <Animated.View
        entering={FadeInDown.delay(300)}
        style={[
          styles.checkoutSection,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrency(subtotal)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Shipping</Text>
          <Text
            style={[styles.summaryValue, { color: shipping === 0 ? colors.success : colors.text }]}
          >
            {shipping === 0 ? 'Free' : formatCurrency(shipping)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(tax)}</Text>
        </View>
        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatCurrency(total)}
          </Text>
        </View>
        <Button
          fullWidth
          rightIcon={<Ionicons color="#FFFFFF" name="arrow-forward" size={20} />}
          size="lg"
          title="Proceed to Checkout"
          onPress={() => router.push('/(tabs)/(storefront)/checkout')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  promoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingLeft: 16,
    gap: 8,
    marginBottom: 16,
  },
  promoInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoPlaceholder: {
    fontSize: 15,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shippingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  shippingText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  checkoutSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
