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

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { typography } from '@/lib/design/typography';
import { useAuthStore } from '@/stores/auth-store';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parentName?: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  createdAt: string;
}

// Category Card Component
function CategoryCard({
  category,
  index,
  onEdit,
  onToggleActive,
  onViewProducts,
  level = 0,
}: {
  category: Category;
  index: number;
  onEdit: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onViewProducts: (category: Category) => void;
  level?: number;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const [expanded, setExpanded] = useState(false);

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

  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <Animated.View
        entering={FadeInRight.delay(index * 30).springify().damping(15)}
        style={[animatedStyle, { marginLeft: level * 16 }]}
      >
        <Pressable
          style={[
            styles.categoryCard,
            {
              backgroundColor: isDark ? colors.surface : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onViewProducts(category)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Header */}
          <View style={styles.categoryHeader}>
            <View style={styles.categoryHeaderLeft}>
              {hasChildren && (
                <Pressable
                  style={styles.expandButton}
                  onPress={() => setExpanded(!expanded)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={expanded ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
              {category.image ? (
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
              ) : (
                <View style={[styles.categoryImagePlaceholder, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="folder" size={20} color={colors.primary} />
                </View>
              )}
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {category.name}
                </Text>
                {category.parentName && (
                  <Text style={[styles.parentName, { color: colors.textTertiary }]}>
                    in {category.parentName}
                  </Text>
                )}
              </View>
            </View>
            <Badge
              label={category.isActive ? 'Active' : 'Inactive'}
              variant={category.isActive ? 'success' : 'secondary'}
              size="sm"
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {category.productCount} products
              </Text>
            </View>
            {hasChildren && (
              <View style={styles.statItem}>
                <Ionicons name="folder-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  {category.children?.length} subcategories
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={[styles.categoryFooter, { borderTopColor: colors.border }]}>
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.iconButton, { backgroundColor: `${colors.primary}10` }]}
                onPress={() => onEdit(category)}
                hitSlop={8}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </Pressable>
              <Pressable
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: category.isActive
                      ? `${colors.warning}10`
                      : `${colors.success}10`,
                  },
                ]}
                onPress={() => onToggleActive(category)}
                hitSlop={8}
              >
                <Ionicons
                  name={category.isActive ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={category.isActive ? colors.warning : colors.success}
                />
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: `${colors.info}10` }]}
                onPress={() => onViewProducts(category)}
                hitSlop={8}
              >
                <Text style={[styles.actionButtonText, { color: colors.info }]}>
                  Products
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.info} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Render children if expanded */}
      {expanded &&
        hasChildren &&
        category.children?.map((child, idx) => (
          <CategoryCard
            key={child.id}
            category={child}
            index={idx}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onViewProducts={onViewProducts}
            level={level + 1}
          />
        ))}
    </>
  );
}

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: currentTenant ? ['categories', currentTenant.id] : ['categories'],
    queryFn: async (): Promise<Category[]> => {
      // TODO: Replace with actual API call
      return [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and accessories',
          productCount: 156,
          isActive: true,
          sortOrder: 1,
          children: [
            {
              id: '1-1',
              name: 'Smartphones',
              slug: 'smartphones',
              parentId: '1',
              parentName: 'Electronics',
              productCount: 45,
              isActive: true,
              sortOrder: 1,
              createdAt: new Date().toISOString(),
            },
            {
              id: '1-2',
              name: 'Laptops',
              slug: 'laptops',
              parentId: '1',
              parentName: 'Electronics',
              productCount: 32,
              isActive: true,
              sortOrder: 2,
              createdAt: new Date().toISOString(),
            },
            {
              id: '1-3',
              name: 'Accessories',
              slug: 'accessories',
              parentId: '1',
              parentName: 'Electronics',
              productCount: 79,
              isActive: true,
              sortOrder: 3,
              createdAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Clothing',
          slug: 'clothing',
          description: 'Fashion and apparel',
          productCount: 234,
          isActive: true,
          sortOrder: 2,
          children: [
            {
              id: '2-1',
              name: 'Men',
              slug: 'men',
              parentId: '2',
              parentName: 'Clothing',
              productCount: 98,
              isActive: true,
              sortOrder: 1,
              createdAt: new Date().toISOString(),
            },
            {
              id: '2-2',
              name: 'Women',
              slug: 'women',
              parentId: '2',
              parentName: 'Clothing',
              productCount: 136,
              isActive: true,
              sortOrder: 2,
              createdAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Home & Garden',
          slug: 'home-garden',
          productCount: 89,
          isActive: true,
          sortOrder: 3,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Sports & Outdoors',
          slug: 'sports-outdoors',
          productCount: 67,
          isActive: false,
          sortOrder: 4,
          createdAt: new Date().toISOString(),
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);
    const withChildren = categories.filter(c => c.children && c.children.length > 0).length;
    return { total, active, totalProducts, withChildren };
  }, [categories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEdit = useCallback((category: Category) => {
    Alert.alert(
      'Edit Category',
      `Edit "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => Alert.alert('Coming Soon', 'Category editing coming soon!'),
        },
      ]
    );
  }, []);

  const handleToggleActive = useCallback((category: Category) => {
    const action = category.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Category`,
      `Are you sure you want to ${action} "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: category.isActive ? 'destructive' : 'default',
          onPress: () => {
            // TODO: Call API to toggle status
            Alert.alert('Success', `Category ${action}d successfully`);
          },
        },
      ]
    );
  }, []);

  const handleViewProducts = useCallback((category: Category) => {
    router.push(`/(tabs)/(admin)/products?category=${category.id}`);
  }, [router]);

  const handleAddCategory = useCallback(() => {
    Alert.alert('Coming Soon', 'Category creation will be available soon!');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
          <Pressable style={styles.addButton} onPress={handleAddCategory}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: isDark ? colors.surface : colors.primaryLight },
              ]}
            >
              <Ionicons name="folder" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: isDark ? colors.surface : colors.successLight },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.active}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: isDark ? colors.surface : colors.infoLight },
              ]}
            >
              <Ionicons name="cube" size={18} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalProducts}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
            </View>
          </View>
        </Animated.View>

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
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search categories..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Categories List */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4].map(i => (
            <Skeleton
              key={i}
              width="100%"
              height={120}
              borderRadius={16}
              style={{ marginBottom: 12 }}
            />
          ))}
        </ScrollView>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon="folder-outline"
          title={searchQuery ? 'No categories found' : 'No categories yet'}
          description={
            searchQuery
              ? 'Try adjusting your search'
              : 'Create categories to organize your products'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Add Category'}
          onAction={searchQuery ? () => setSearchQuery('') : handleAddCategory}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {filteredCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onViewProducts={handleViewProducts}
            />
          ))}
        </ScrollView>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  expandButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  categoryImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.bodyMedium,
  },
  parentName: {
    ...typography.micro,
    marginTop: 2,
  },
  statsRow2: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.caption,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
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
