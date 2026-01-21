'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export interface RecentlyViewedProduct {
  id: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  viewedAt: string;
}

/**
 * Hook for managing recently viewed products
 * Stores product IDs in localStorage and provides methods to add/retrieve them
 */
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedProduct[];
        setRecentlyViewed(parsed);
      }
    } catch (error) {
      console.error('Failed to load recently viewed products:', error);
    }
    setIsLoaded(true);
  }, []);

  // Add a product to recently viewed
  const addProduct = useCallback((product: Omit<RecentlyViewedProduct, 'viewedAt'>) => {
    if (typeof window === 'undefined') return;

    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.productId !== product.productId);

      // Add to beginning with timestamp
      const updated = [
        { ...product, viewedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recently viewed products:', error);
      }

      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearAll = useCallback(() => {
    if (typeof window === 'undefined') return;

    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recently viewed products:', error);
    }
  }, []);

  // Get product IDs only
  const getProductIds = useCallback(() => {
    return recentlyViewed.map((p) => p.productId);
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    isLoaded,
    addProduct,
    clearAll,
    getProductIds,
    hasItems: recentlyViewed.length > 0,
  };
}

export default useRecentlyViewed;
