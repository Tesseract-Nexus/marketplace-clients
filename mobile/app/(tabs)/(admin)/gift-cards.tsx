import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';
import { ScreenHeader, SearchHeader, FilterChips, DataListItem, SectionHeader, FloatingActionButton } from '@/components/admin';
import { MetricCard } from '@/components/admin/MetricCard';
import { gradients } from '@/lib/design/typography';

interface GiftCard {
  id: string;
  code: string;
  initialValue: number;
  currentBalance: number;
  status: 'active' | 'depleted' | 'expired' | 'disabled';
  recipientEmail?: string;
  recipientName?: string;
  purchaserEmail?: string;
  purchaserName?: string;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

// Mock data
const mockGiftCards: GiftCard[] = [
  {
    id: '1',
    code: 'GIFT-A1B2-C3D4',
    initialValue: 100,
    currentBalance: 75.50,
    status: 'active',
    recipientEmail: 'john@example.com',
    recipientName: 'John Doe',
    purchaserName: 'Jane Smith',
    purchaserEmail: 'jane@example.com',
    expiresAt: '2025-12-31',
    createdAt: '2024-01-15',
    lastUsedAt: '2024-02-01',
    usageCount: 2,
  },
  {
    id: '2',
    code: 'GIFT-E5F6-G7H8',
    initialValue: 50,
    currentBalance: 0,
    status: 'depleted',
    recipientEmail: 'mike@example.com',
    recipientName: 'Mike Johnson',
    purchaserName: 'Sarah Wilson',
    createdAt: '2024-01-10',
    lastUsedAt: '2024-01-28',
    usageCount: 3,
  },
  {
    id: '3',
    code: 'GIFT-I9J0-K1L2',
    initialValue: 200,
    currentBalance: 200,
    status: 'active',
    recipientEmail: 'emma@example.com',
    recipientName: 'Emma Brown',
    expiresAt: '2025-06-30',
    createdAt: '2024-02-01',
    usageCount: 0,
  },
  {
    id: '4',
    code: 'GIFT-M3N4-O5P6',
    initialValue: 75,
    currentBalance: 75,
    status: 'expired',
    recipientEmail: 'alex@example.com',
    recipientName: 'Alex Davis',
    expiresAt: '2024-01-01',
    createdAt: '2023-06-15',
    usageCount: 0,
  },
];

const filterChips = [
  { id: 'active', label: 'Active', icon: 'checkmark-circle' as const, count: 2 },
  { id: 'depleted', label: 'Depleted', icon: 'wallet-outline' as const, count: 1 },
  { id: 'expired', label: 'Expired', icon: 'time-outline' as const, count: 1 },
  { id: 'disabled', label: 'Disabled', icon: 'close-circle' as const, count: 0 },
];

export default function GiftCardsScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: giftCards = mockGiftCards, isLoading, refetch } = useQuery({
    queryKey: ['gift-cards'],
    queryFn: async () => mockGiftCards,
  });

  const stats = {
    totalCards: giftCards.length,
    totalValue: giftCards.reduce((sum, gc) => sum + gc.initialValue, 0),
    activeBalance: giftCards
      .filter(gc => gc.status === 'active')
      .reduce((sum, gc) => sum + gc.currentBalance, 0),
    usedThisMonth: giftCards.filter(gc => gc.lastUsedAt).length,
  };

  const filteredCards = giftCards.filter(gc => {
    const matchesSearch =
      gc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gc.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gc.recipientEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !selectedFilter || gc.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: GiftCard['status']) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'depleted':
        return colors.warning;
      case 'expired':
        return colors.error;
      case 'disabled':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: GiftCard['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'depleted':
        return 'Depleted';
      case 'expired':
        return 'Expired';
      case 'disabled':
        return 'Disabled';
      default:
        return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Gift Cards"
        subtitle="Manage digital gift cards"
        rightAction={{
          icon: 'settings-outline',
          onPress: () => {},
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Stats Overview */}
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          style={styles.statsContainer}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroLabel}>Active Balance</Text>
                <Text style={styles.heroValue}>
                  ${stats.activeBalance.toFixed(2)}
                </Text>
                <Text style={styles.heroSubtext}>
                  across {stats.totalCards} gift cards
                </Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="gift" size={48} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <MetricCard
              title="Total Issued"
              value={`$${stats.totalValue.toLocaleString()}`}
              icon="cash-outline"
            />
            <MetricCard
              title="Used This Month"
              value={stats.usedThisMonth.toString()}
              icon="trending-up"
            />
          </View>
        </Animated.View>

        {/* Search & Filter */}
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by code, recipient..."
          onFilterPress={() => {}}
          filterCount={selectedFilter ? 1 : 0}
        />

        <FilterChips
          chips={filterChips}
          selectedId={selectedFilter}
          onSelect={setSelectedFilter}
        />

        {/* Gift Cards List */}
        <SectionHeader
          title="Gift Cards"
          count={filteredCards.length}
          icon="gift"
          delay={100}
        />

        {filteredCards.map((card, index) => (
          <Animated.View
            key={card.id}
            entering={FadeInRight.delay(150 + index * 50).springify()}
          >
            <Pressable
              style={[styles.giftCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.codeContainer}>
                  <View
                    style={[
                      styles.codeIcon,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Ionicons name="gift" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.cardCode, { color: colors.text }]}>
                      {card.code}
                    </Text>
                    <Text style={[styles.cardRecipient, { color: colors.textSecondary }]}>
                      {card.recipientName || 'No recipient assigned'}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(card.status)}15` },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(card.status) },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor(card.status) }]}
                  >
                    {getStatusLabel(card.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.balanceContainer}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    Balance
                  </Text>
                  <View style={styles.balanceRow}>
                    <Text style={[styles.balanceValue, { color: colors.text }]}>
                      ${card.currentBalance.toFixed(2)}
                    </Text>
                    <Text style={[styles.balanceOriginal, { color: colors.textTertiary }]}>
                      / ${card.initialValue.toFixed(2)}
                    </Text>
                  </View>
                  {/* Balance Bar */}
                  <View style={[styles.balanceBar, { backgroundColor: `${colors.primary}15` }]}>
                    <View
                      style={[
                        styles.balanceFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${(card.currentBalance / card.initialValue) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  {card.expiresAt && (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        Expires {new Date(card.expiresAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="repeat-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      Used {card.usageCount} times
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: `${colors.primary}10` }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>View</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: `${colors.success}10` }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Top Up</Text>
                </Pressable>
                {card.status === 'active' && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: `${colors.error}10` }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Disable</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FloatingActionButton
        icon="add"
        label="Create"
        onPress={() => setShowCreateModal(true)}
      />
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
  giftCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCode: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  cardRecipient: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 16,
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  balanceOriginal: {
    fontSize: 14,
  },
  balanceBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  balanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});
