import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';
import { ScreenHeader, SearchHeader, FilterChips, SectionHeader } from '@/components/admin';
import { MetricCard } from '@/components/admin/MetricCard';

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

// Mock data
const mockReviews: Review[] = [
  {
    id: '1',
    productId: 'p1',
    productName: 'Premium Wireless Headphones',
    productImage: 'https://picsum.photos/100/100?random=1',
    customerId: 'c1',
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    rating: 5,
    title: 'Absolutely amazing sound quality!',
    content:
      "These headphones exceeded my expectations. The noise cancellation is incredible and the battery life is outstanding. Best purchase I've made this year!",
    status: 'approved',
    verifiedPurchase: true,
    helpful: 24,
    createdAt: '2024-02-01',
  },
  {
    id: '2',
    productId: 'p2',
    productName: 'Smart Watch Pro',
    customerId: 'c2',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    rating: 4,
    title: 'Great watch with minor issues',
    content:
      'Overall a great smartwatch. Battery life could be better but the fitness tracking features are excellent. The display is beautiful.',
    status: 'pending',
    verifiedPurchase: true,
    helpful: 8,
    createdAt: '2024-02-02',
  },
  {
    id: '3',
    productId: 'p3',
    productName: 'Laptop Stand Deluxe',
    customerId: 'c3',
    customerName: 'Mike Wilson',
    customerEmail: 'mike@example.com',
    rating: 2,
    title: 'Not worth the price',
    content:
      'The quality is not what I expected for this price point. The stand wobbles and feels cheap.',
    status: 'flagged',
    verifiedPurchase: false,
    helpful: 3,
    createdAt: '2024-02-03',
  },
  {
    id: '4',
    productId: 'p1',
    productName: 'Premium Wireless Headphones',
    productImage: 'https://picsum.photos/100/100?random=1',
    customerId: 'c4',
    customerName: 'Emma Davis',
    customerEmail: 'emma@example.com',
    rating: 5,
    title: 'Perfect for work from home!',
    content:
      'I use these for video calls and music. Crystal clear audio quality and super comfortable for all-day wear.',
    status: 'approved',
    verifiedPurchase: true,
    helpful: 15,
    createdAt: '2024-01-28',
    reply:
      "Thank you for your wonderful review, Emma! We're thrilled to hear you're enjoying the headphones.",
    repliedAt: '2024-01-29',
  },
];

const filterChips = [
  { id: 'pending', label: 'Pending', icon: 'time-outline' as const, count: 1 },
  { id: 'approved', label: 'Approved', icon: 'checkmark-circle' as const, count: 2 },
  { id: 'flagged', label: 'Flagged', icon: 'flag' as const, count: 1 },
  { id: 'rejected', label: 'Rejected', icon: 'close-circle' as const, count: 0 },
];

export default function ReviewsScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const {
    data: reviews = mockReviews,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => mockReviews,
  });

  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    pendingReviews: reviews.filter((r) => r.status === 'pending').length,
    verifiedPurchases: reviews.filter((r) => r.verifiedPurchase).length,
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !selectedFilter || r.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'flagged':
        return colors.error;
      case 'rejected':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            color={star <= rating ? '#FFD700' : colors.textTertiary}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        rightAction={{
          icon: 'settings-outline',
          onPress: () => {},
        }}
        subtitle="Manage customer feedback"
        title="Reviews"
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.statsContainer}>
          <LinearGradient
            colors={['#F59E0B', '#F97316', '#EF4444']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroLabel}>Average Rating</Text>
                <View style={styles.ratingDisplay}>
                  <Text style={styles.heroValue}>{stats.averageRating.toFixed(1)}</Text>
                  <Ionicons color="#FFFFFF" name="star" size={28} style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.heroSubtext}>from {stats.totalReviews} reviews</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons color="rgba(255,255,255,0.3)" name="chatbubbles" size={48} />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <MetricCard
              icon="time-outline"
              title="Pending"
              value={stats.pendingReviews.toString()}
            />
            <MetricCard
              icon="shield-checkmark"
              title="Verified"
              value={`${Math.round((stats.verifiedPurchases / stats.totalReviews) * 100)}%`}
            />
          </View>
        </Animated.View>

        {/* Search & Filter */}
        <SearchHeader
          filterCount={selectedFilter ? 1 : 0}
          placeholder="Search reviews..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => {}}
        />

        <FilterChips chips={filterChips} selectedId={selectedFilter} onSelect={setSelectedFilter} />

        {/* Reviews List */}
        <SectionHeader
          count={filteredReviews.length}
          delay={100}
          icon="chatbox"
          title="Recent Reviews"
        />

        {filteredReviews.map((review, index) => (
          <Animated.View key={review.id} entering={FadeInRight.delay(150 + index * 50).springify()}>
            <Pressable
              style={[styles.reviewCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {/* Header */}
              <View style={styles.reviewHeader}>
                <View style={styles.customerInfo}>
                  <View style={[styles.customerAvatar, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {review.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <View>
                    <View style={styles.customerNameRow}>
                      <Text style={[styles.customerName, { color: colors.text }]}>
                        {review.customerName}
                      </Text>
                      {review.verifiedPurchase ? (
                        <View
                          style={[styles.verifiedBadge, { backgroundColor: `${colors.success}15` }]}
                        >
                          <Ionicons color={colors.success} name="checkmark-circle" size={12} />
                          <Text style={[styles.verifiedText, { color: colors.success }]}>
                            Verified
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(review.status)}15` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(review.status) }]}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Product */}
              <View style={styles.productRow}>
                {review.productImage ? (
                  <Image source={{ uri: review.productImage }} style={styles.productImage} />
                ) : (
                  <View
                    style={[
                      styles.productImagePlaceholder,
                      { backgroundColor: `${colors.text}08` },
                    ]}
                  >
                    <Ionicons color={colors.textSecondary} name="cube-outline" size={16} />
                  </View>
                )}
                <Text
                  numberOfLines={1}
                  style={[styles.productName, { color: colors.textSecondary }]}
                >
                  {review.productName}
                </Text>
              </View>

              {/* Rating & Title */}
              <View style={styles.ratingRow}>
                {renderStars(review.rating)}
                <Text numberOfLines={1} style={[styles.reviewTitle, { color: colors.text }]}>
                  {review.title}
                </Text>
              </View>

              {/* Content */}
              <Text
                numberOfLines={3}
                style={[styles.reviewContent, { color: colors.textSecondary }]}
              >
                {review.content}
              </Text>

              {/* Reply */}
              {review.reply ? (
                <View style={[styles.replyContainer, { backgroundColor: `${colors.primary}08` }]}>
                  <View style={styles.replyHeader}>
                    <Ionicons color={colors.primary} name="return-down-forward" size={16} />
                    <Text style={[styles.replyLabel, { color: colors.primary }]}>Store Reply</Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[styles.replyText, { color: colors.textSecondary }]}
                  >
                    {review.reply}
                  </Text>
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.reviewActions}>
                <View style={styles.helpfulCount}>
                  <Ionicons color={colors.textSecondary} name="thumbs-up-outline" size={16} />
                  <Text style={[styles.helpfulText, { color: colors.textSecondary }]}>
                    {review.helpful} helpful
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  {review.status === 'pending' ? (
                    <>
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: `${colors.success}10` }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Ionicons color={colors.success} name="checkmark" size={18} />
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: `${colors.error}10` }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Ionicons color={colors.error} name="close" size={18} />
                      </Pressable>
                    </>
                  ) : null}
                  {!review.reply ? (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: `${colors.primary}10` }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons color={colors.primary} name="chatbubble-outline" size={16} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Reply</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  heroSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
  heroIcon: {
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  productImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  productImagePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  replyContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  helpfulCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
