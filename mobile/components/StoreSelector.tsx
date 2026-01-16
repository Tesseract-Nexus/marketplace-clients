import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth-store';
import { useColors } from '@/providers/ThemeProvider';
import type { Tenant } from '@/types/entities';

interface StoreSelectorProps {
  variant?: 'default' | 'compact';
}

export function StoreSelector({ variant = 'default' }: StoreSelectorProps) {
  const router = useRouter();
  const colors = useColors();
  const { tenants, currentTenant, setCurrentTenant, refreshTenants } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh tenants when modal opens
  const handleOpenModal = async () => {
    setShowModal(true);
    setIsRefreshing(true);
    try {
      await refreshTenants();
    } catch (e) {
      console.log('[StoreSelector] Failed to refresh tenants:', e);
    }
    setIsRefreshing(false);
  };

  const handleSelectStore = async (tenant: Tenant) => {
    await setCurrentTenant(tenant.id);
    setShowModal(false);
  };

  const handleCreateStore = () => {
    setShowModal(false);
    router.push('/store-setup');
  };

  if (!currentTenant) {
    return null;
  }

  return (
    <>
      <Pressable
        style={[
          styles.selector,
          { backgroundColor: colors.surface, borderColor: colors.border },
          variant === 'compact' && styles.selectorCompact,
        ]}
        onPress={handleOpenModal}
      >
        <View style={[styles.storeLogo, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.storeLogoText, { color: colors.primary }]}>
            {currentTenant.name.charAt(0).toUpperCase()}
          </Text>
          {/* Badge showing number of stores */}
          {tenants.length > 1 ? (
            <View style={[styles.storeBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.storeBadgeText}>{tenants.length}</Text>
            </View>
          ) : null}
        </View>
        {variant === 'default' ? (
          <View style={styles.storeInfo}>
            <Text numberOfLines={1} style={[styles.storeName, { color: colors.text }]}>
              {currentTenant.name}
            </Text>
            <Text numberOfLines={1} style={[styles.storeUrl, { color: colors.textSecondary }]}>
              {currentTenant.slug}.tesserix.app
            </Text>
          </View>
        ) : null}
        <Ionicons color={colors.textSecondary} name="chevron-down" size={20} />
      </Pressable>

      <Modal
        transparent
        animationType="none"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            exiting={FadeOut.duration(150)}
            style={[styles.modal, { backgroundColor: colors.background }]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Store {tenants.length > 0 ? `(${tenants.length})` : null}
            </Text>

            {isRefreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading stores...
                </Text>
              </View>
            ) : null}

            <FlatList
              contentContainerStyle={styles.listContent}
              data={tenants}
              keyExtractor={(item) => item.id}
              ListFooterComponent={() => (
                <Pressable
                  style={[styles.createButton, { borderColor: colors.primary }]}
                  onPress={handleCreateStore}
                >
                  <View style={[styles.createIcon, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons color={colors.primary} name="add" size={24} />
                  </View>
                  <Text style={[styles.createText, { color: colors.primary }]}>
                    Create New Store
                  </Text>
                </Pressable>
              )}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.storeItem,
                    { borderColor: colors.border },
                    item.id === currentTenant.id && {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleSelectStore(item)}
                >
                  <View style={[styles.storeItemLogo, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.storeItemLogoText, { color: colors.primary }]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.storeItemInfo}>
                    <Text style={[styles.storeItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.storeItemUrl, { color: colors.textSecondary }]}>
                      {item.slug}.tesserix.app
                    </Text>
                  </View>
                  {item.id === currentTenant.id ? (
                    <Ionicons color={colors.primary} name="checkmark-circle" size={24} />
                  ) : null}
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectorCompact: {
    padding: 8,
    gap: 8,
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  storeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeUrl: {
    fontSize: 13,
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  storeItemLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeItemLogoText: {
    fontSize: 20,
    fontWeight: '700',
  },
  storeItemInfo: {
    flex: 1,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeItemUrl: {
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
    marginTop: 8,
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
