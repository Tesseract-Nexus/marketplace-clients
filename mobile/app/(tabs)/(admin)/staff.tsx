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
  Image,
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
import { formatRelativeTime } from '@/lib/utils/formatting';
import { typography, gradients } from '@/lib/design/typography';
import { useAuthStore } from '@/stores/auth-store';

type StaffStatus = 'active' | 'inactive' | 'invited' | 'suspended';

interface StaffMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: {
    id: string;
    name: string;
    priority: number;
  };
  department?: {
    id: string;
    name: string;
  };
  status: StaffStatus;
  lastActive?: string;
  createdAt: string;
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: 'people' as const },
  { id: 'active', label: 'Active', icon: 'checkmark-circle' as const },
  { id: 'inactive', label: 'Inactive', icon: 'pause-circle' as const },
  { id: 'invited', label: 'Invited', icon: 'mail' as const },
] as const;

// Stats Card Component
function StatsCards({ staff }: { staff: StaffMember[] }) {
  const colors = useColors();
  const isDark = useIsDark();

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.status === 'active').length;
    const inactive = staff.filter((s) => s.status === 'inactive').length;
    const invited = staff.filter((s) => s.status === 'invited').length;
    return { total, active, inactive, invited };
  }, [staff]);

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
      {/* Total Staff Card */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.totalCard}
      >
        <View style={styles.totalIcon}>
          <Ionicons color="rgba(255,255,255,0.9)" name="people" size={16} />
        </View>
        <Text style={styles.totalLabel}>Total Staff</Text>
        <Text style={styles.totalValue}>{stats.total}</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.successLight },
          ]}
        >
          <Ionicons color={colors.success} name="checkmark-circle" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.warningLight },
          ]}
        >
          <Ionicons color={colors.warning} name="pause-circle" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.inactive}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inactive</Text>
        </View>

        <View
          style={[styles.statItem, { backgroundColor: isDark ? colors.surface : colors.infoLight }]}
        >
          <Ionicons color={colors.info} name="mail" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.invited}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Invited</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Staff Member Card Component
function StaffCard({
  member,
  index,
  onViewProfile,
  onManageAccess,
}: {
  member: StaffMember;
  index: number;
  onViewProfile: (member: StaffMember) => void;
  onManageAccess: (member: StaffMember) => void;
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
    StaffStatus,
    {
      label: string;
      variant: 'success' | 'warning' | 'info' | 'error' | 'secondary';
      color: string;
    }
  > = {
    active: {
      label: 'Active',
      variant: 'success',
      color: colors.success,
    },
    inactive: {
      label: 'Inactive',
      variant: 'warning',
      color: colors.warning,
    },
    invited: {
      label: 'Invited',
      variant: 'info',
      color: colors.info,
    },
    suspended: {
      label: 'Suspended',
      variant: 'error',
      color: colors.error,
    },
  };

  const config = statusConfig[member.status];
  const fullName = `${member.firstName} ${member.lastName}`;
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

  // Role badge color based on priority
  const rolePriorityColors: Record<number, string> = {
    100: '#DC2626', // Owner - Red
    90: '#7C3AED', // Admin - Purple
    80: '#2563EB', // Manager - Blue
    70: '#059669', // Supervisor - Green
    50: '#6B7280', // Staff - Gray
  };
  const roleColor = rolePriorityColors[member.role.priority] || colors.textSecondary;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30)
        .springify()
        .damping(15)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.staffCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onViewProfile(member)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header with Avatar */}
        <View style={styles.staffHeader}>
          <View style={styles.staffHeaderLeft}>
            {member.avatar ? (
              <Image source={{ uri: member.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: `${roleColor}20` }]}>
                <Text style={[styles.avatarInitials, { color: roleColor }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.staffInfo}>
              <Text style={[styles.staffName, { color: colors.text }]}>{fullName}</Text>
              <Text style={[styles.staffEmail, { color: colors.textSecondary }]}>
                {member.email}
              </Text>
            </View>
          </View>
          <Badge label={config.label} size="sm" variant={config.variant} />
        </View>

        {/* Role & Department */}
        <View style={styles.roleRow}>
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}15` }]}>
            <Ionicons color={roleColor} name="shield-checkmark" size={14} />
            <Text style={[styles.roleText, { color: roleColor }]}>{member.role.name}</Text>
          </View>
          {member.department ? (
            <View style={[styles.deptBadge, { backgroundColor: colors.surface }]}>
              <Ionicons color={colors.textSecondary} name="business-outline" size={14} />
              <Text style={[styles.deptText, { color: colors.textSecondary }]}>
                {member.department.name}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={[styles.staffFooter, { borderTopColor: colors.border }]}>
          <View style={styles.lastActiveInfo}>
            <Ionicons color={colors.textTertiary} name="time-outline" size={14} />
            <Text style={[styles.lastActiveText, { color: colors.textTertiary }]}>
              {member.lastActive
                ? `Active ${formatRelativeTime(member.lastActive)}`
                : `Joined ${formatRelativeTime(member.createdAt)}`}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <Pressable
              hitSlop={8}
              style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={() => onManageAccess(member)}
            >
              <Ionicons color={colors.primary} name="key-outline" size={14} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Access</Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              style={[styles.actionButton, { backgroundColor: `${colors.info}10` }]}
              onPress={() => onViewProfile(member)}
            >
              <Text style={[styles.actionButtonText, { color: colors.info }]}>Profile</Text>
              <Ionicons color={colors.info} name="chevron-forward" size={14} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function StaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch staff members
  const {
    data: staff = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: currentTenant ? ['staff', currentTenant.id] : ['staff'],
    queryFn: async (): Promise<StaffMember[]> => {
      // TODO: Replace with actual API call
      // const response = await staffApi.list();
      // return response.data;

      // Mock data for now
      return [
        {
          id: '1',
          userId: 'u1',
          email: 'owner@store.com',
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567890',
          role: { id: 'r1', name: 'Owner', priority: 100 },
          department: { id: 'd1', name: 'Executive' },
          status: 'active',
          lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          userId: 'u2',
          email: 'admin@store.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: { id: 'r2', name: 'Admin', priority: 90 },
          department: { id: 'd2', name: 'Operations' },
          status: 'active',
          lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          userId: 'u3',
          email: 'manager@store.com',
          firstName: 'Mike',
          lastName: 'Wilson',
          phone: '+1987654321',
          role: { id: 'r3', name: 'Manager', priority: 80 },
          department: { id: 'd3', name: 'Sales' },
          status: 'active',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          userId: 'u4',
          email: 'staff1@store.com',
          firstName: 'Emily',
          lastName: 'Brown',
          role: { id: 'r4', name: 'Staff', priority: 50 },
          department: { id: 'd3', name: 'Sales' },
          status: 'inactive',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          userId: 'u5',
          email: 'newstaff@store.com',
          firstName: 'Alex',
          lastName: 'Davis',
          role: { id: 'r4', name: 'Staff', priority: 50 },
          status: 'invited',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const filteredStaff = useMemo(() => {
    let filtered = staff;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.role.name.toLowerCase().includes(query)
      );
    }

    // Sort by role priority (higher first), then by name
    return filtered.sort((a, b) => {
      if (b.role.priority !== a.role.priority) {
        return b.role.priority - a.role.priority;
      }
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
  }, [staff, activeFilter, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleViewProfile = useCallback((member: StaffMember) => {
    Alert.alert(
      `${member.firstName} ${member.lastName}`,
      `Email: ${member.email}\nRole: ${member.role.name}\nDepartment: ${member.department?.name || 'None'}\nStatus: ${member.status}`
    );
  }, []);

  const handleManageAccess = useCallback((member: StaffMember) => {
    Alert.alert(
      'Manage Access',
      `Current role: ${member.role.name}\n\nWhat would you like to do?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          onPress: () => Alert.alert('Coming Soon', 'Role management coming soon!'),
        },
        {
          text: member.status === 'active' ? 'Deactivate' : 'Activate',
          style: member.status === 'active' ? 'destructive' : 'default',
          onPress: () => {
            // TODO: Call API to update status
            Alert.alert(
              'Success',
              `${member.firstName} has been ${member.status === 'active' ? 'deactivated' : 'activated'}`
            );
          },
        },
      ]
    );
  }, []);

  const handleInviteStaff = useCallback(() => {
    Alert.prompt(
      'Invite Staff Member',
      'Enter email address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Invite',
          onPress: (email) => {
            if (email && email.includes('@')) {
              // TODO: Call API to send invite
              Alert.alert('Success', `Invitation sent to ${email}`);
            } else {
              Alert.alert('Error', 'Please enter a valid email address');
            }
          },
        },
      ],
      'plain-text',
      '',
      'email-address'
    );
  }, []);

  const renderMember = useCallback(
    ({ item, index }: { item: StaffMember; index: number }) => (
      <StaffCard
        index={index}
        member={item}
        onManageAccess={handleManageAccess}
        onViewProfile={handleViewProfile}
      />
    ),
    [handleViewProfile, handleManageAccess]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={24} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Staff</Text>
          <Pressable style={styles.addButton} onPress={handleInviteStaff}>
            <Ionicons color={colors.primary} name="person-add" size={22} />
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCards staff={staff} />

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
            placeholder="Search staff..."
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

      {/* Staff List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              borderRadius={16}
              height={160}
              style={{ marginBottom: 12 }}
              width="100%"
            />
          ))}
        </ScrollView>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          actionLabel={searchQuery ? 'Clear Search' : 'Invite Staff'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Invite team members to help manage your store'
          }
          icon="people-outline"
          title={searchQuery ? 'No staff found' : 'No staff members'}
          onAction={searchQuery ? () => setSearchQuery('') : handleInviteStaff}
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={onRefresh}
            />
          }
          renderItem={renderMember}
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
  totalCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  totalIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  totalValue: {
    ...typography.title1,
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
  staffCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  staffHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    ...typography.bodyMedium,
  },
  staffEmail: {
    ...typography.caption,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  roleText: {
    ...typography.captionMedium,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  deptText: {
    ...typography.caption,
  },
  staffFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  lastActiveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastActiveText: {
    ...typography.micro,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    ...typography.captionMedium,
  },
});
