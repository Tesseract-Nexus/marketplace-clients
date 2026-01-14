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
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';
import { ScreenHeader, SearchHeader, SectionHeader } from '@/components/admin';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  category: 'payment' | 'shipping' | 'marketing' | 'analytics' | 'communication' | 'accounting';
  status: 'connected' | 'available' | 'coming_soon';
  lastSync?: string;
  isEnabled?: boolean;
}

// Mock data
const mockIntegrations: Integration[] = [
  // Payment
  {
    id: '1',
    name: 'Stripe',
    description: 'Accept credit card payments worldwide',
    icon: 'card',
    iconColor: '#635BFF',
    category: 'payment',
    status: 'connected',
    lastSync: '2 minutes ago',
    isEnabled: true,
  },
  {
    id: '2',
    name: 'PayPal',
    description: 'Accept PayPal payments',
    icon: 'logo-paypal',
    iconColor: '#003087',
    category: 'payment',
    status: 'connected',
    isEnabled: true,
  },
  {
    id: '3',
    name: 'Apple Pay',
    description: 'Accept payments via Apple Pay',
    icon: 'logo-apple',
    iconColor: '#000000',
    category: 'payment',
    status: 'available',
  },
  // Shipping
  {
    id: '4',
    name: 'FedEx',
    description: 'FedEx shipping integration',
    icon: 'cube',
    iconColor: '#4D148C',
    category: 'shipping',
    status: 'connected',
    lastSync: '15 minutes ago',
    isEnabled: true,
  },
  {
    id: '5',
    name: 'UPS',
    description: 'UPS shipping rates & tracking',
    icon: 'cube-outline',
    iconColor: '#351C15',
    category: 'shipping',
    status: 'available',
  },
  {
    id: '6',
    name: 'USPS',
    description: 'USPS shipping services',
    icon: 'mail',
    iconColor: '#004B87',
    category: 'shipping',
    status: 'available',
  },
  // Marketing
  {
    id: '7',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    icon: 'mail-outline',
    iconColor: '#FFE01B',
    category: 'marketing',
    status: 'connected',
    lastSync: '1 hour ago',
    isEnabled: true,
  },
  {
    id: '8',
    name: 'Facebook Ads',
    description: 'Facebook & Instagram advertising',
    icon: 'logo-facebook',
    iconColor: '#1877F2',
    category: 'marketing',
    status: 'available',
  },
  {
    id: '9',
    name: 'Google Ads',
    description: 'Google advertising platform',
    icon: 'logo-google',
    iconColor: '#4285F4',
    category: 'marketing',
    status: 'coming_soon',
  },
  // Analytics
  {
    id: '10',
    name: 'Google Analytics',
    description: 'Website analytics & insights',
    icon: 'analytics',
    iconColor: '#E37400',
    category: 'analytics',
    status: 'connected',
    lastSync: '5 minutes ago',
    isEnabled: true,
  },
  {
    id: '11',
    name: 'Mixpanel',
    description: 'Product analytics',
    icon: 'bar-chart',
    iconColor: '#7856FF',
    category: 'analytics',
    status: 'available',
  },
  // Communication
  {
    id: '12',
    name: 'Twilio',
    description: 'SMS & voice communication',
    icon: 'chatbubble-ellipses',
    iconColor: '#F22F46',
    category: 'communication',
    status: 'connected',
    lastSync: '30 minutes ago',
    isEnabled: true,
  },
  {
    id: '13',
    name: 'Slack',
    description: 'Team notifications',
    icon: 'logo-slack',
    iconColor: '#4A154B',
    category: 'communication',
    status: 'available',
  },
  // Accounting
  {
    id: '14',
    name: 'QuickBooks',
    description: 'Accounting & invoicing',
    icon: 'calculator',
    iconColor: '#2CA01C',
    category: 'accounting',
    status: 'available',
  },
  {
    id: '15',
    name: 'Xero',
    description: 'Cloud accounting',
    icon: 'document-text',
    iconColor: '#13B5EA',
    category: 'accounting',
    status: 'coming_soon',
  },
];

const categories = [
  { id: 'payment', label: 'Payment', icon: 'card' },
  { id: 'shipping', label: 'Shipping', icon: 'cube' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'communication', label: 'Communication', icon: 'chatbubbles' },
  { id: 'accounting', label: 'Accounting', icon: 'calculator' },
];

export default function IntegrationsScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: integrations = mockIntegrations, isLoading, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => mockIntegrations,
  });

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedIntegrations = categories.reduce((acc, cat) => {
    const items = filteredIntegrations.filter(i => i.category === cat.id);
    if (items.length > 0) {
      acc[cat.id] = items;
    }
    return acc;
  }, {} as Record<string, Integration[]>);

  const getStatusConfig = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return { label: 'Connected', color: colors.success, icon: 'checkmark-circle' };
      case 'available':
        return { label: 'Available', color: colors.primary, icon: 'add-circle' };
      case 'coming_soon':
        return { label: 'Coming Soon', color: colors.textSecondary, icon: 'time' };
      default:
        return { label: status, color: colors.textSecondary, icon: 'help-circle' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Integrations"
        subtitle={`${connectedCount} connected`}
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
        {/* Search */}
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search integrations..."
        />

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <Pressable
            style={[
              styles.categoryChip,
              !selectedCategory && { backgroundColor: colors.primary },
              selectedCategory && { backgroundColor: `${colors.text}08` },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(null);
            }}
          >
            <Ionicons
              name="apps"
              size={18}
              color={!selectedCategory ? colors.textOnPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: !selectedCategory ? colors.textOnPrimary : colors.text },
              ]}
            >
              All
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && { backgroundColor: colors.primary },
                selectedCategory !== cat.id && { backgroundColor: `${colors.text}08` },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat.id);
              }}
            >
              <Ionicons
                name={cat.icon as any}
                size={18}
                color={selectedCategory === cat.id ? colors.textOnPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  { color: selectedCategory === cat.id ? colors.textOnPrimary : colors.text },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Integrations by Category */}
        {Object.entries(groupedIntegrations).map(([categoryId, items], catIndex) => {
          const category = categories.find(c => c.id === categoryId);
          return (
            <View key={categoryId}>
              <SectionHeader
                title={category?.label || categoryId}
                count={items.length}
                icon={category?.icon as any}
                delay={catIndex * 50}
              />

              {items.map((integration, index) => {
                const statusConfig = getStatusConfig(integration.status);
                return (
                  <Animated.View
                    key={integration.id}
                    entering={FadeInRight.delay(100 + catIndex * 50 + index * 30).springify()}
                  >
                    <Pressable
                      style={[styles.integrationCard, { backgroundColor: colors.surface }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      disabled={integration.status === 'coming_soon'}
                    >
                      <View style={styles.integrationContent}>
                        <View
                          style={[
                            styles.integrationIcon,
                            { backgroundColor: `${integration.iconColor}15` },
                          ]}
                        >
                          <Ionicons
                            name={integration.icon as any}
                            size={24}
                            color={integration.iconColor}
                          />
                        </View>
                        <View style={styles.integrationDetails}>
                          <View style={styles.integrationHeader}>
                            <Text style={[styles.integrationName, { color: colors.text }]}>
                              {integration.name}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: `${statusConfig.color}15` },
                              ]}
                            >
                              <Ionicons
                                name={statusConfig.icon as any}
                                size={12}
                                color={statusConfig.color}
                              />
                              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[styles.integrationDesc, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {integration.description}
                          </Text>
                          {integration.lastSync && (
                            <Text style={[styles.syncTime, { color: colors.textTertiary }]}>
                              Last sync: {integration.lastSync}
                            </Text>
                          )}
                        </View>
                      </View>

                      {integration.status === 'connected' && (
                        <View style={styles.integrationActions}>
                          <Switch
                            value={integration.isEnabled}
                            onValueChange={() => {}}
                            trackColor={{ false: colors.border, true: `${colors.success}50` }}
                            thumbColor={integration.isEnabled ? colors.success : colors.textSecondary}
                          />
                        </View>
                      )}

                      {integration.status === 'available' && (
                        <Pressable
                          style={[styles.connectBtn, { backgroundColor: `${colors.primary}10` }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        >
                          <Text style={[styles.connectText, { color: colors.primary }]}>
                            Connect
                          </Text>
                        </Pressable>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  integrationCard: {
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  integrationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationDetails: {
    flex: 1,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  integrationDesc: {
    fontSize: 13,
    marginTop: 3,
  },
  syncTime: {
    fontSize: 11,
    marginTop: 4,
  },
  integrationActions: {
    marginLeft: 12,
  },
  connectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  connectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
