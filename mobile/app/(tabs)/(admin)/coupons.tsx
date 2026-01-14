import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { Card, PressableCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/formatting';

interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_order_amount?: number;
  max_discount?: number;
  usage_count: number;
  usage_limit?: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
}

function CouponCard({ coupon, index }: { coupon: Coupon; index: number }) {
  const colors = useColors();
  const router = useRouter();

  const discountLabel = () => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% OFF`;
      case 'fixed_amount':
        return `${formatCurrency(coupon.value)} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return '';
    }
  };

  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const statusVariant = !coupon.is_active ? 'default' : isExpired ? 'error' : 'success';
  const statusLabel = !coupon.is_active ? 'Inactive' : isExpired ? 'Expired' : 'Active';

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <PressableCard style={styles.couponCard}>
        <View style={styles.couponHeader}>
          <View style={[styles.couponBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.couponDiscount, { color: colors.primary }]}>{discountLabel()}</Text>
          </View>
          <Badge label={statusLabel} variant={statusVariant} size="sm" />
        </View>

        <Text style={[styles.couponCode, { color: colors.text }]}>{coupon.code}</Text>
        <Text style={[styles.couponName, { color: colors.textSecondary }]}>{coupon.name}</Text>

        <View style={styles.couponFooter}>
          <View style={styles.couponStat}>
            <Ionicons name="ticket-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.couponStatText, { color: colors.textSecondary }]}>
              {coupon.usage_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''} used
            </Text>
          </View>
          {coupon.min_order_amount && (
            <View style={styles.couponStat}>
              <Ionicons name="cart-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.couponStatText, { color: colors.textSecondary }]}>
                Min. {formatCurrency(coupon.min_order_amount)}
              </Text>
            </View>
          )}
        </View>
      </PressableCard>
    </Animated.View>
  );
}

export default function CouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { currentTenant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: coupons, isLoading, refetch } = useQuery({
    queryKey: currentTenant ? ['coupons', currentTenant.id] : ['coupons'],
    queryFn: async (): Promise<Coupon[]> => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          code: 'SAVE20',
          name: '20% off your order',
          type: 'percentage',
          value: 20,
          min_order_amount: 50,
          usage_count: 145,
          usage_limit: 500,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          code: 'FLAT10',
          name: '$10 off orders over $75',
          type: 'fixed_amount',
          value: 10,
          min_order_amount: 75,
          usage_count: 89,
          is_active: true,
        },
        {
          id: '3',
          code: 'FREESHIP',
          name: 'Free shipping on all orders',
          type: 'free_shipping',
          value: 0,
          usage_count: 234,
          usage_limit: 1000,
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          code: 'SUMMER50',
          name: 'Summer sale - 50% off',
          type: 'percentage',
          value: 50,
          max_discount: 100,
          usage_count: 500,
          usage_limit: 500,
          is_active: false,
          expires_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeCoupons = coupons?.filter((c) => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())) || [];
  const inactiveCoupons = coupons?.filter((c) => !c.is_active || (c.expires_at && new Date(c.expires_at) < new Date())) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Coupons</Text>
        <Pressable style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={140} borderRadius={12} style={{ marginBottom: 12 }} />
            ))}
          </View>
        ) : (
          <>
            {/* Active Coupons */}
            {activeCoupons.length > 0 && (
              <Animated.View entering={FadeInDown}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Coupons</Text>
                <View style={styles.couponsList}>
                  {activeCoupons.map((coupon, index) => (
                    <CouponCard key={coupon.id} coupon={coupon} index={index} />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Inactive Coupons */}
            {inactiveCoupons.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200)}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                  Inactive / Expired
                </Text>
                <View style={styles.couponsList}>
                  {inactiveCoupons.map((coupon, index) => (
                    <CouponCard key={coupon.id} coupon={coupon} index={index} />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Empty State */}
            {coupons?.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Coupons Yet</Text>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  Create your first coupon to offer discounts to your customers.
                </Text>
                <Pressable style={[styles.createButton, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Coupon</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  couponsList: {
    gap: 12,
  },
  couponCard: {
    padding: 16,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponDiscount: {
    fontSize: 13,
    fontWeight: '700',
  },
  couponCode: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  couponName: {
    fontSize: 14,
    marginTop: 4,
  },
  couponFooter: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  couponStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  couponStatText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
