import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime, formatCurrency } from '@/lib/utils/formatting';
import { typography, gradients } from '@/lib/design/typography';
import { useAuthStore } from '@/stores/auth-store';

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
type CampaignType = 'email' | 'sms' | 'push' | 'discount';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  targetAudience: string;
  audienceCount: number;
  sentCount: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  revenue?: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: 'megaphone' as const },
  { id: 'active', label: 'Active', icon: 'play-circle' as const },
  { id: 'scheduled', label: 'Scheduled', icon: 'calendar' as const },
  { id: 'draft', label: 'Draft', icon: 'create' as const },
  { id: 'completed', label: 'Completed', icon: 'checkmark-done' as const },
] as const;

// Stats Card Component
function StatsCards({ campaigns }: { campaigns: Campaign[] }) {
  const colors = useColors();
  const isDark = useIsDark();

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === 'active').length;
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const avgOpenRate =
      campaigns.filter((c) => c.openRate).reduce((sum, c) => sum + (c.openRate || 0), 0) /
        campaigns.filter((c) => c.openRate).length || 0;
    return { active, totalSent, totalRevenue, avgOpenRate };
  }, [campaigns]);

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
      {/* Campaign Revenue Card */}
      <LinearGradient
        colors={['#EC4899', '#F472B6']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.revenueCard}
      >
        <View style={styles.revenueIcon}>
          <Ionicons color="rgba(255,255,255,0.9)" name="trending-up" size={16} />
        </View>
        <Text style={styles.revenueLabel}>Campaign Revenue</Text>
        <Text style={styles.revenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.successLight },
          ]}
        >
          <Ionicons color={colors.success} name="play-circle" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>

        <View
          style={[styles.statItem, { backgroundColor: isDark ? colors.surface : colors.infoLight }]}
        >
          <Ionicons color={colors.info} name="send" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalSent}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sent</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.warningLight },
          ]}
        >
          <Ionicons color={colors.warning} name="mail-open" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.avgOpenRate.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Opens</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Campaign Card Component
function CampaignCard({
  campaign,
  index,
  onViewDetails,
  onToggleStatus,
}: {
  campaign: Campaign;
  index: number;
  onViewDetails: (campaign: Campaign) => void;
  onToggleStatus: (campaign: Campaign) => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusConfig: Record<
    CampaignStatus,
    {
      label: string;
      variant: 'success' | 'warning' | 'info' | 'error' | 'secondary';
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
    }
  > = {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      icon: 'create',
      color: colors.textSecondary,
    },
    scheduled: {
      label: 'Scheduled',
      variant: 'info',
      icon: 'calendar',
      color: colors.info,
    },
    active: {
      label: 'Active',
      variant: 'success',
      icon: 'play-circle',
      color: colors.success,
    },
    paused: {
      label: 'Paused',
      variant: 'warning',
      icon: 'pause-circle',
      color: colors.warning,
    },
    completed: {
      label: 'Completed',
      variant: 'secondary',
      icon: 'checkmark-done',
      color: colors.textSecondary,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'error',
      icon: 'close-circle',
      color: colors.error,
    },
  };

  const typeConfig: Record<CampaignType, { icon: keyof typeof Ionicons.glyphMap; color: string }> =
    {
      email: { icon: 'mail', color: '#3B82F6' },
      sms: { icon: 'chatbubble', color: '#10B981' },
      push: { icon: 'notifications', color: '#F59E0B' },
      discount: { icon: 'pricetag', color: '#EC4899' },
    };

  const config = statusConfig[campaign.status];
  const typeConf = typeConfig[campaign.type];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30)
        .springify()
        .damping(15)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.campaignCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onViewDetails(campaign)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header */}
        <View style={styles.campaignHeader}>
          <View style={styles.campaignHeaderLeft}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeConf.color}20` }]}>
              <Ionicons color={typeConf.color} name={typeConf.icon} size={18} />
            </View>
            <View style={styles.campaignInfo}>
              <Text numberOfLines={1} style={[styles.campaignName, { color: colors.text }]}>
                {campaign.name}
              </Text>
              {campaign.description ? (
                <Text
                  numberOfLines={1}
                  style={[styles.campaignDesc, { color: colors.textSecondary }]}
                >
                  {campaign.description}
                </Text>
              ) : null}
            </View>
          </View>
          <Badge label={config.label} size="sm" variant={config.variant} />
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {campaign.audienceCount.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Audience</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {campaign.sentCount.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Sent</Text>
          </View>
          {campaign.openRate !== undefined ? (
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{campaign.openRate}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Opens</Text>
            </View>
          ) : null}
          {campaign.revenue !== undefined && campaign.revenue > 0 ? (
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {formatCurrency(campaign.revenue)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Revenue</Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={[styles.campaignFooter, { borderTopColor: colors.border }]}>
          <View style={styles.dateInfo}>
            <Ionicons color={colors.textTertiary} name="time-outline" size={14} />
            <Text style={[styles.dateText, { color: colors.textTertiary }]}>
              {campaign.status === 'scheduled' && campaign.startsAt
                ? `Starts ${formatRelativeTime(campaign.startsAt)}`
                : `Created ${formatRelativeTime(campaign.createdAt)}`}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            {campaign.status === 'active' || campaign.status === 'paused' ? (
              <Pressable
                hitSlop={8}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor:
                      campaign.status === 'active' ? `${colors.warning}15` : `${colors.success}15`,
                  },
                ]}
                onPress={() => onToggleStatus(campaign)}
              >
                <Ionicons
                  color={campaign.status === 'active' ? colors.warning : colors.success}
                  name={campaign.status === 'active' ? 'pause' : 'play'}
                  size={16}
                />
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={8}
              style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={() => onViewDetails(campaign)}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
              <Ionicons color={colors.primary} name="chevron-forward" size={14} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CampaignsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch campaigns
  const {
    data: campaigns = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: currentTenant ? ['campaigns', currentTenant.id] : ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      // TODO: Replace with actual API call
      return [
        {
          id: '1',
          name: 'New Year Sale 2026',
          description: 'Exclusive discounts for the new year',
          type: 'email',
          status: 'active',
          targetAudience: 'All Customers',
          audienceCount: 5234,
          sentCount: 4890,
          openRate: 42,
          clickRate: 12,
          conversionRate: 3.5,
          revenue: 12450,
          startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'Abandoned Cart Reminder',
          description: 'Recover lost sales',
          type: 'email',
          status: 'active',
          targetAudience: 'Abandoned Carts',
          audienceCount: 234,
          sentCount: 198,
          openRate: 65,
          clickRate: 28,
          conversionRate: 8.2,
          revenue: 3450,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          name: 'Flash Sale Alert',
          description: '24-hour flash sale notification',
          type: 'push',
          status: 'scheduled',
          targetAudience: 'App Users',
          audienceCount: 8900,
          sentCount: 0,
          startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          name: 'VIP Customer Discount',
          description: '15% off for loyal customers',
          type: 'discount',
          status: 'draft',
          targetAudience: 'VIP Customers',
          audienceCount: 456,
          sentCount: 0,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          name: 'Black Friday 2025',
          description: 'Biggest sale of the year',
          type: 'email',
          status: 'completed',
          targetAudience: 'All Customers',
          audienceCount: 4500,
          sentCount: 4320,
          openRate: 58,
          clickRate: 22,
          conversionRate: 5.8,
          revenue: 45600,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.targetAudience.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [campaigns, activeFilter, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleViewDetails = useCallback((campaign: Campaign) => {
    Alert.alert(
      campaign.name,
      `Type: ${campaign.type.toUpperCase()}\nStatus: ${campaign.status}\nAudience: ${campaign.audienceCount.toLocaleString()}\nSent: ${campaign.sentCount.toLocaleString()}\n${campaign.openRate ? `Open Rate: ${campaign.openRate}%` : ''}\n${campaign.revenue ? `Revenue: ${formatCurrency(campaign.revenue)}` : ''}`
    );
  }, []);

  const handleToggleStatus = useCallback((campaign: Campaign) => {
    const action = campaign.status === 'active' ? 'pause' : 'resume';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Campaign`,
      `Are you sure you want to ${action} "${campaign.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => {
            // TODO: Call API to toggle status
            Alert.alert('Success', `Campaign ${action}d successfully`);
          },
        },
      ]
    );
  }, []);

  const handleCreateCampaign = useCallback(() => {
    Alert.alert('Coming Soon', 'Campaign creation will be available soon!');
  }, []);

  const renderCampaign = useCallback(
    ({ item, index }: { item: Campaign; index: number }) => (
      <CampaignCard
        campaign={item}
        index={index}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
      />
    ),
    [handleViewDetails, handleToggleStatus]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={24} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Campaigns</Text>
          <Pressable style={styles.addButton} onPress={handleCreateCampaign}>
            <Ionicons color={colors.primary} name="add" size={24} />
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCards campaigns={campaigns} />

        {/* Search */}
        <Animated.View
          entering={FadeInDown.delay(150)}
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? colors.surface : '#F3F4F6',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons color={colors.textSecondary} name="search" size={18} />
          <TextInput
            placeholder="Search campaigns..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons color={colors.textSecondary} name="close-circle" size={18} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Status Filters */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filtersContainer}
            showsHorizontalScrollIndicator={false}
          >
            {STATUS_FILTERS.map((filter) => (
              <Pressable
                key={filter.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: activeFilter === filter.id ? colors.primary : colors.surface,
                    borderColor: activeFilter === filter.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Ionicons
                  color={activeFilter === filter.id ? '#FFFFFF' : colors.textSecondary}
                  name={filter.icon}
                  size={14}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: activeFilter === filter.id ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Campaigns List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              borderRadius={16}
              height={180}
              style={{ marginBottom: 12 }}
              width="100%"
            />
          ))}
        </ScrollView>
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          actionLabel={searchQuery ? 'Clear Search' : 'Create Campaign'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Create your first campaign to engage customers'
          }
          icon="megaphone-outline"
          title={searchQuery ? 'No campaigns found' : 'No campaigns yet'}
          onAction={searchQuery ? () => setSearchQuery('') : handleCreateCampaign}
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          data={filteredCampaigns}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={onRefresh}
            />
          }
          renderItem={renderCampaign}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title2,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 16,
  },
  revenueCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  revenueIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  revenueValue: {
    ...typography.title2,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statValue: {
    ...typography.bodyMedium,
  },
  statLabel: {
    ...typography.micro,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: 0,
  },
  filtersContainer: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    ...typography.captionMedium,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  campaignCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  campaignHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    ...typography.bodyMedium,
  },
  campaignDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.bodyMedium,
  },
  metricLabel: {
    ...typography.micro,
    marginTop: 2,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...typography.micro,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    ...typography.captionMedium,
  },
});
