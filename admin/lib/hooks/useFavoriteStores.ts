'use client';

import { useState, useEffect, useCallback } from 'react';

const MAX_FAVORITES = 3;
const STORAGE_KEY = 'favoriteStores';

export interface UseFavoriteStoresReturn {
  favorites: string[]; // Array of store IDs
  isFavorite: (storeId: string) => boolean;
  toggleFavorite: (storeId: string) => boolean; // Returns success
  canAddMore: boolean;
  maxFavorites: number;
}

export function useFavoriteStores(vendorId?: string): UseFavoriteStoresReturn {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Storage key per vendor
  const storageKey = vendorId ? `${STORAGE_KEY}_${vendorId}` : STORAGE_KEY;

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.slice(0, MAX_FAVORITES));
        }
      }
    } catch (error) {
      console.error('Failed to load favorite stores:', error);
    }
  }, [storageKey]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorite stores:', error);
    }
  }, [favorites, storageKey]);

  const isFavorite = useCallback(
    (storeId: string) => favorites.includes(storeId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (storeId: string): boolean => {
      const isCurrentlyFavorite = favorites.includes(storeId);

      if (isCurrentlyFavorite) {
        // Remove from favorites
        setFavorites((prev) => prev.filter((id) => id !== storeId));
        return true;
      } else {
        // Add to favorites (if under limit)
        if (favorites.length >= MAX_FAVORITES) {
          return false; // Cannot add more
        }
        setFavorites((prev) => [...prev, storeId]);
        return true;
      }
    },
    [favorites]
  );

  const canAddMore = favorites.length < MAX_FAVORITES;

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    canAddMore,
    maxFavorites: MAX_FAVORITES,
  };
}

export default useFavoriteStores;
