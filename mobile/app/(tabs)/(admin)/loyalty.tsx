import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  Switch,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';
import { ScreenHeader, FilterChips, SectionHeader, FloatingActionButton } from '@/components/admin';
import { MetricCard } from '@/components/admin/MetricCard';
import { gradients } from '@/lib/design/typography';

interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  multiplier: number;
  perks: string[];
  members: number;
  color: string;
  icon: string;
}

interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  tier: string;
  totalSpent: number;
  lastActivity: string;
  joinedAt: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'service' | 'exclusive';
  redemptions: number;
  isActive: boolean;
}

// Mock data
const mockTiers: LoyaltyTier[] = [
  {
    id: '1',
    name: 'Bronze',
    minPoints: 0,
    multiplier: 1,
    perks: ['1 point per $1', 'Birthday bonus'],
    members: 1250,
    color: '#CD7F32',
    icon: 'shield',
  },
  {
    id: '2',
    name: 'Silver',
    minPoints: 500,
    multiplier: 1.25,
    perks: ['1.25x points', 'Free shipping on $50+', 'Early access'],
    members: 620,
    color: '#C0C0C0',
    icon: 'shield-half',
  },
  {
    id: '3',
    name: 'Gold',
    minPoints: 2000,
    multiplier: 1.5,
    perks: ['1.5x points', 'Free shipping', 'Priority support', 'Exclusive sales'],
    members: 180,
    color: '#FFD700',
    icon: 'shield-checkmark',
  },
  {
    id: '4',
    name: 'Platinum',
    minPoints: 5000,
    multiplier: 2,
    perks: ['2x points', 'VIP events', 'Personal stylist', 'Free returns'],
    members: 45,
    color: '#E5E4E2',
    icon: 'diamond',
  },
];

const mockRewards: LoyaltyReward[] = [
  {
    id: '1',
    name: '$10 Off',
    description: 'Get $10 off your next order',
    pointsCost: 500,
    type: 'discount',
    redemptions: 234,
    isActive: true,
  },
  {
    id: '2',
    name: 'Free Shipping',
    description: 'Free shipping on any order',
    pointsCost: 300,
    type: 'service',
    redemptions: 456,
    isActive: true,
  },
  {
    id: '3',
    name: 'Mystery Box',
    description: 'Exclusive mystery product box',
    pointsCost: 2000,
    type: 'product',
    redemptions: 89,
    isActive: true,
  },
  {
    id: '4',
    name: 'VIP Event Access',
    description: 'Access to exclusive VIP events',
    pointsCost: 5000,
    type: 'exclusive',
    redemptions: 12,
    isActive: false,
  },
];

const mockTopMembers: LoyaltyMember[] = [
  {
    id: '1',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    points: 8450,
    tier: 'Platinum',
    totalSpent: 12500,
    lastActivity: '2024-02-01',
    joinedAt: '2022-03-15',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    points: 5200,
    tier: 'Platinum',
    totalSpent: 8900,
    lastActivity: '2024-01-30',
    joinedAt: '2022-06-20',
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: 'emma@example.com',
    points: 3100,
    tier: 'Gold',
    totalSpent: 5600,
    lastActivity: '2024-02-02',
    joinedAt: '2023-01-10',
  },
];

export default function LoyaltyScreen() {
  const colors = useColors();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'rewards' | 'members'>('overview');

  const {
    data: tiers = mockTiers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => mockTiers,
  });

  const stats = {
    totalMembers: tiers.reduce((sum, t) => sum + t.members, 0),
    totalPointsIssued: 2450000,
    activeRewards: mockRewards.filter((r) => r.isActive).length,
    redemptionsThisMonth: 892,
  };

  const getTierColor = (tierName: string) => {
    const tier = mockTiers.find((t) => t.name === tierName);
    return tier?.color || colors.textSecondary;
  };

  const getRewardIcon = (type: LoyaltyReward['type']) => {
    switch (type) {
      case 'discount':
        return 'pricetag';
      case 'product':
        return 'gift';
      case 'service':
        return 'car';
      case 'exclusive':
        return 'star';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        rightAction={{
          icon: 'settings-outline',
          onPress: () => {},
        }}
        subtitle="Reward your best customers"
        title="Loyalty Program"
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Stats */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.statsContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#D946EF']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroLabel}>Total Members</Text>
                <Text style={styles.heroValue}>{stats.totalMembers.toLocaleString()}</Text>
                <Text style={styles.heroSubtext}>+156 this month</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons color="rgba(255,255,255,0.3)" name="people" size={48} />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <MetricCard icon="diamond-outline" title="Points Issued" value="2.45M" />
            <MetricCard
              icon="gift-outline"
              title="Redemptions"
              value={stats.redemptionsThisMonth.toString()}
            />
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
          {(['overview', 'rewards', 'members'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, selectedTab === tab && { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTab(tab);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? colors.textOnPrimary : colors.textSecondary },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content based on tab */}
        {selectedTab === 'overview' ? (
          <>
            {/* Tiers */}
            <SectionHeader
              action={{ label: 'Edit', onPress: () => {} }}
              count={tiers.length}
              delay={100}
              icon="layers"
              iconColor="#8B5CF6"
              title="Loyalty Tiers"
            />

            {tiers.map((tier, index) => (
              <Animated.View
                key={tier.id}
                entering={FadeInRight.delay(150 + index * 50).springify()}
              >
                <Pressable
                  style={[styles.tierCard, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.tierHeader}>
                    <View style={styles.tierInfo}>
                      <View style={[styles.tierIcon, { backgroundColor: `${tier.color}20` }]}>
                        <Ionicons color={tier.color} name={tier.icon as any} size={24} />
                      </View>
                      <View>
                        <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
                        <Text style={[styles.tierPoints, { color: colors.textSecondary }]}>
                          {tier.minPoints.toLocaleString()}+ points
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tierStats}>
                      <Text style={[styles.tierMembers, { color: colors.text }]}>
                        {tier.members.toLocaleString()}
                      </Text>
                      <Text style={[styles.tierMembersLabel, { color: colors.textSecondary }]}>
                        members
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tierPerks}>
                    <View style={[styles.multiplierBadge, { backgroundColor: `${tier.color}15` }]}>
                      <Text style={[styles.multiplierText, { color: tier.color }]}>
                        {tier.multiplier}x points
                      </Text>
                    </View>
                    {tier.perks.slice(0, 2).map((perk, i) => (
                      <View key={i} style={styles.perkItem}>
                        <Ionicons color={colors.success} name="checkmark-circle" size={14} />
                        <Text style={[styles.perkText, { color: colors.textSecondary }]}>
                          {perk}
                        </Text>
                      </View>
                    ))}
                    {tier.perks.length > 2 ? (
                      <Text style={[styles.morePerks, { color: colors.primary }]}>
                        +{tier.perks.length - 2} more perks
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </>
        ) : null}

        {selectedTab === 'rewards' ? (
          <>
            <SectionHeader
              action={{ label: 'Add', onPress: () => {} }}
              count={mockRewards.length}
              delay={100}
              icon="gift"
              iconColor={colors.success}
              title="Available Rewards"
            />

            {mockRewards.map((reward, index) => (
              <Animated.View
                key={reward.id}
                entering={FadeInRight.delay(150 + index * 50).springify()}
              >
                <Pressable
                  style={[styles.rewardCard, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.rewardHeader}>
                    <View style={styles.rewardInfo}>
                      <View style={[styles.rewardIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Ionicons
                          color={colors.primary}
                          name={getRewardIcon(reward.type)}
                          size={22}
                        />
                      </View>
                      <View style={styles.rewardDetails}>
                        <Text style={[styles.rewardName, { color: colors.text }]}>
                          {reward.name}
                        </Text>
                        <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>
                          {reward.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      thumbColor={reward.isActive ? colors.success : colors.textSecondary}
                      trackColor={{ false: colors.border, true: `${colors.success}50` }}
                      value={reward.isActive}
                      onValueChange={() => {}}
                    />
                  </View>

                  <View style={styles.rewardFooter}>
                    <View style={styles.pointsCost}>
                      <Ionicons color="#8B5CF6" name="diamond" size={16} />
                      <Text style={[styles.pointsValue, { color: colors.text }]}>
                        {reward.pointsCost.toLocaleString()}
                      </Text>
                      <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
                        points
                      </Text>
                    </View>
                    <Text style={[styles.redemptions, { color: colors.textSecondary }]}>
                      {reward.redemptions} redemptions
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </>
        ) : null}

        {selectedTab === 'members' ? (
          <>
            <SectionHeader
              action={{ label: 'View All', onPress: () => {} }}
              count={mockTopMembers.length}
              delay={100}
              icon="trophy"
              iconColor="#FFD700"
              title="Top Members"
            />

            {mockTopMembers.map((member, index) => (
              <Animated.View
                key={member.id}
                entering={FadeInRight.delay(150 + index * 50).springify()}
              >
                <Pressable
                  style={[styles.memberCard, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.memberInfo}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: `${getTierColor(member.tier)}30` },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: getTierColor(member.tier) }]}>
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                      <View style={styles.memberTierRow}>
                        <View
                          style={[
                            styles.tierBadge,
                            { backgroundColor: `${getTierColor(member.tier)}15` },
                          ]}
                        >
                          <Text
                            style={[styles.tierBadgeText, { color: getTierColor(member.tier) }]}
                          >
                            {member.tier}
                          </Text>
                        </View>
                        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                          {member.email}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.memberStats}>
                    <View style={styles.memberStat}>
                      <Text style={[styles.memberStatValue, { color: colors.text }]}>
                        {member.points.toLocaleString()}
                      </Text>
                      <Text style={[styles.memberStatLabel, { color: colors.textSecondary }]}>
                        points
                      </Text>
                    </View>
                    <View style={styles.memberStat}>
                      <Text style={[styles.memberStatValue, { color: colors.text }]}>
                        ${member.totalSpent.toLocaleString()}
                      </Text>
                      <Text style={[styles.memberStatLabel, { color: colors.textSecondary }]}>
                        spent
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FloatingActionButton icon="add" onPress={() => {}} />
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
  },
  tierPoints: {
    fontSize: 13,
    marginTop: 2,
  },
  tierStats: {
    alignItems: 'flex-end',
  },
  tierMembers: {
    fontSize: 20,
    fontWeight: '700',
  },
  tierMembersLabel: {
    fontSize: 12,
  },
  tierPerks: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiplierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: '700',
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkText: {
    fontSize: 12,
  },
  morePerks: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardDetails: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rewardDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 13,
  },
  redemptions: {
    fontSize: 13,
  },
  memberCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: 12,
  },
  memberStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  memberStat: {
    alignItems: 'center',
  },
  memberStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 100,
  },
});
