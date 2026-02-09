import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface ListItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  notes?: string;
  addedAt: string;
}

export interface List {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  itemCount: number;
  items?: ListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  image?: string;
  price: number;
}

interface ListsState {
  lists: List[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;

  // Actions — auth is handled by session cookies, no accessToken needed
  fetchLists: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  getList: (tenantId: string, storefrontId: string, customerId: string, listIdOrSlug: string) => Promise<List | null>;
  createList: (tenantId: string, storefrontId: string, customerId: string, name: string, description?: string) => Promise<List>;
  updateList: (tenantId: string, storefrontId: string, customerId: string, listId: string, name: string, description?: string) => Promise<List>;
  deleteList: (tenantId: string, storefrontId: string, customerId: string, listId: string) => Promise<void>;
  addToList: (tenantId: string, storefrontId: string, customerId: string, listId: string, product: Product) => Promise<ListItem>;
  addToDefaultList: (tenantId: string, storefrontId: string, customerId: string, product: Product) => Promise<ListItem>;
  removeFromList: (tenantId: string, storefrontId: string, customerId: string, listId: string, itemId: string) => Promise<void>;
  removeProductFromList: (tenantId: string, storefrontId: string, customerId: string, listId: string, productId: string) => Promise<void>;
  moveItem: (tenantId: string, storefrontId: string, customerId: string, listId: string, itemId: string, toListId: string) => Promise<void>;
  checkProduct: (tenantId: string, storefrontId: string, customerId: string, productId: string) => Promise<{ inAnyList: boolean; lists: List[] }>;
  isInAnyList: (productId: string) => boolean;
  getListsContainingProduct: (productId: string) => List[];
  clearLists: () => void;
}

const API_BASE = '/api/lists';

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: [],
      isLoading: false,
      error: null,
      lastFetchedAt: null,

      fetchLists: async (tenantId, storefrontId, customerId) => {
        set({ isLoading: true, error: null });
        try {
          const headers: Record<string, string> = {
            'X-Tenant-ID': tenantId,
            'X-Storefront-ID': storefrontId,
          };
          const response = await fetch(API_BASE, { headers, credentials: 'include' });

          if (!response.ok) {
            throw new Error('Failed to fetch lists');
          }

          const data = await response.json();
          const summaries: List[] = data.lists || [];

          // Fetch full details (with items) for each list in parallel
          const enriched = await Promise.all(
            summaries.map(async (list) => {
              try {
                const detailRes = await fetch(`${API_BASE}/${list.id}`, { headers, credentials: 'include' });
                if (detailRes.ok) {
                  const fullList = await detailRes.json();
                  return { ...list, items: fullList.items || [] } as List;
                }
              } catch {
                // Fall back to summary without items
              }
              return list;
            })
          );

          set({
            lists: enriched,
            lastFetchedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to fetch lists:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch lists' });
        } finally {
          set({ isLoading: false });
        }
      },

      getList: async (tenantId, storefrontId, customerId, listIdOrSlug) => {
        try {
          const headers: Record<string, string> = {
            'X-Tenant-ID': tenantId,
            'X-Storefront-ID': storefrontId,
          };
          const response = await fetch(`${API_BASE}/${listIdOrSlug}`, { headers, credentials: 'include' });

          if (!response.ok) {
            throw new Error('Failed to fetch list');
          }

          return await response.json();
        } catch (error) {
          console.error('Failed to fetch list:', error);
          return null;
        }
      },

      createList: async (tenantId, storefrontId, customerId, name, description) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(API_BASE, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name, description }),
        });

        if (!response.ok) {
          throw new Error('Failed to create list');
        }

        const list = await response.json();
        set((state) => ({
          lists: [...state.lists, list],
        }));
        return list;
      },

      updateList: async (tenantId, storefrontId, customerId, listId, name, description) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/${listId}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name, description }),
        });

        if (!response.ok) {
          throw new Error('Failed to update list');
        }

        const updatedList = await response.json();
        set((state) => ({
          lists: state.lists.map((l) => (l.id === listId ? updatedList : l)),
        }));
        return updatedList;
      },

      deleteList: async (tenantId, storefrontId, customerId, listId) => {
        const headers: Record<string, string> = {
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/${listId}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to delete list');
        }

        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
        }));
      },

      addToList: async (tenantId, storefrontId, customerId, listId, product) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/${listId}/items`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            productImage: product.image || '',
            productPrice: product.price,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add to list');
        }

        const item = await response.json();

        // Update local state
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id === listId) {
              return {
                ...l,
                itemCount: l.itemCount + 1,
                items: l.items ? [...l.items, item] : [item],
              };
            }
            return l;
          }),
        }));

        return item;
      },

      addToDefaultList: async (tenantId, storefrontId, customerId, product) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/default/items`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            productImage: product.image || '',
            productPrice: product.price,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add to default list');
        }

        const item = await response.json();

        // Optimistic local update (like addToList) instead of fetchLists which loses items
        set((state) => {
          const defaultList = state.lists.find((l) => l.isDefault);
          if (!defaultList) {
            // No default list in state yet — fall back to refetch
            get().fetchLists(tenantId, storefrontId, customerId);
            return state;
          }
          return {
            lists: state.lists.map((l) => {
              if (l.id === defaultList.id) {
                return {
                  ...l,
                  itemCount: l.itemCount + 1,
                  items: l.items ? [...l.items, item] : [item],
                };
              }
              return l;
            }),
          };
        });

        return item;
      },

      removeFromList: async (tenantId, storefrontId, customerId, listId, itemId) => {
        const headers: Record<string, string> = {
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/${listId}/items/${itemId}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to remove from list');
        }

        // Update local state
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id === listId) {
              return {
                ...l,
                itemCount: Math.max(0, l.itemCount - 1),
                items: l.items?.filter((i) => i.id !== itemId),
              };
            }
            return l;
          }),
        }));
      },

      removeProductFromList: async (tenantId, storefrontId, customerId, listId, productId) => {
        const headers: Record<string, string> = {
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/${listId}/products/${productId}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to remove from list');
        }

        // Update local state
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id === listId) {
              return {
                ...l,
                itemCount: Math.max(0, l.itemCount - 1),
                items: l.items?.filter((i) => i.productId !== productId),
              };
            }
            return l;
          }),
        }));
      },

      moveItem: async (tenantId, storefrontId, customerId, listId, itemId, toListId) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/${listId}/items/${itemId}/move`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ toListId }),
        });

        if (!response.ok) {
          throw new Error('Failed to move item');
        }

        // Refresh lists to get updated state (await to prevent stale reads)
        await get().fetchLists(tenantId, storefrontId, customerId);
      },

      checkProduct: async (tenantId, storefrontId, customerId, productId) => {
        const headers: Record<string, string> = {
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        };
        const response = await fetch(`${API_BASE}/check/${productId}`, { headers, credentials: 'include' });

        if (!response.ok) {
          throw new Error('Failed to check product');
        }

        return await response.json();
      },

      isInAnyList: (productId) => {
        const { lists } = get();
        return lists.some((list) =>
          list.items?.some((item) => item.productId === productId)
        );
      },

      getListsContainingProduct: (productId) => {
        const { lists } = get();
        return lists.filter((list) =>
          list.items?.some((item) => item.productId === productId)
        );
      },

      clearLists: () => {
        set({ lists: [], lastFetchedAt: null, error: null });
      },
    }),
    {
      name: 'storefront-lists',
      partialize: (state) => ({ lists: state.lists, lastFetchedAt: state.lastFetchedAt }),
    }
  )
);
