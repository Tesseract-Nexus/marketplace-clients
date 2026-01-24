'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  PageTourState,
  PageTourContextValue,
  TourStep,
  PageTourConfig,
  PAGE_TOUR_STORAGE_KEY,
} from './types';
import { getTourConfigById, getTourConfigByPath, ALL_PAGE_TOURS } from './tourConfigs';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';

const PageTourContext = createContext<PageTourContextValue | undefined>(undefined);

const INITIAL_STATE: PageTourState = {
  isActive: false,
  currentPageId: null,
  currentStepIndex: 0,
  completedTours: [],
  skippedTours: [],
};

interface PageTourProviderProps {
  children: ReactNode;
}

export function PageTourProvider({ children }: PageTourProviderProps) {
  const pathname = usePathname();
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const [state, setState] = useState<PageTourState>(INITIAL_STATE);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Generate storage key for persistence
  const getStorageKey = useCallback(() => {
    const tenantPart = currentTenant?.id || 'default';
    const userPart = user?.id || 'anonymous';
    return `${PAGE_TOUR_STORAGE_KEY}_${tenantPart}_${userPart}`;
  }, [currentTenant?.id, user?.id]);

  // Load state from localStorage
  useEffect(() => {
    if (!currentTenant?.id || !user?.id) return;

    const storageKey = getStorageKey();
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          completedTours: parsed.completedTours || [],
          skippedTours: parsed.skippedTours || [],
          // Don't restore active state - start fresh each session
          isActive: false,
          currentPageId: null,
          currentStepIndex: 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load page tour state:', error);
    }
    setHasInitialized(true);
  }, [currentTenant?.id, user?.id, getStorageKey]);

  // Save state to localStorage when completed/skipped tours change
  useEffect(() => {
    if (!currentTenant?.id || !user?.id || !hasInitialized) return;

    const storageKey = getStorageKey();
    try {
      const stateToSave = {
        completedTours: state.completedTours,
        skippedTours: state.skippedTours,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save page tour state:', error);
    }
  }, [state.completedTours, state.skippedTours, currentTenant?.id, user?.id, hasInitialized, getStorageKey]);

  // Get current tour configuration
  const getCurrentTourConfig = useCallback((): PageTourConfig | null => {
    if (!state.currentPageId) return null;
    return getTourConfigById(state.currentPageId);
  }, [state.currentPageId]);

  // Get current step
  const getCurrentStep = useCallback((): TourStep | null => {
    const config = getCurrentTourConfig();
    if (!config) return null;
    return config.steps[state.currentStepIndex] || null;
  }, [getCurrentTourConfig, state.currentStepIndex]);

  // Check if page tour is available (not completed or skipped)
  const isPageTourAvailable = useCallback((pageId: string): boolean => {
    return !state.completedTours.includes(pageId) && !state.skippedTours.includes(pageId);
  }, [state.completedTours, state.skippedTours]);

  // Start a tour for a specific page
  const startTour = useCallback((pageId: string) => {
    const config = getTourConfigById(pageId);
    if (!config) {
      console.warn(`No tour configuration found for page: ${pageId}`);
      return;
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      currentPageId: pageId,
      currentStepIndex: 0,
    }));
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    const config = getCurrentTourConfig();
    if (!config) return;

    setState(prev => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= config.steps.length) {
        // Tour completed
        return {
          ...prev,
          isActive: false,
          currentPageId: null,
          currentStepIndex: 0,
          completedTours: [...prev.completedTours, config.pageId],
        };
      }
      return {
        ...prev,
        currentStepIndex: nextIndex,
      };
    });
  }, [getCurrentTourConfig]);

  // Go to previous step
  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, []);

  // Skip current tour
  const skipTour = useCallback(() => {
    setState(prev => {
      const pageId = prev.currentPageId;
      return {
        ...prev,
        isActive: false,
        currentPageId: null,
        currentStepIndex: 0,
        skippedTours: pageId ? [...prev.skippedTours, pageId] : prev.skippedTours,
      };
    });
  }, []);

  // Complete current tour
  const completeTour = useCallback(() => {
    setState(prev => {
      const pageId = prev.currentPageId;
      return {
        ...prev,
        isActive: false,
        currentPageId: null,
        currentStepIndex: 0,
        completedTours: pageId ? [...prev.completedTours, pageId] : prev.completedTours,
      };
    });
  }, []);

  // Reset all tours
  const resetTours = useCallback(() => {
    setState(INITIAL_STATE);
    if (currentTenant?.id && user?.id) {
      const storageKey = getStorageKey();
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Failed to reset page tour state:', error);
      }
    }
  }, [currentTenant?.id, user?.id, getStorageKey]);

  // Auto-start tour when navigating to a new page (if not completed)
  useEffect(() => {
    if (!hasInitialized || state.isActive) return;

    const config = getTourConfigByPath(pathname);
    if (config && isPageTourAvailable(config.pageId)) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        startTour(config.pageId);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname, hasInitialized, state.isActive, isPageTourAvailable, startTour]);

  const contextValue = useMemo<PageTourContextValue>(
    () => ({
      ...state,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      completeTour,
      resetTours,
      isPageTourAvailable,
      getCurrentTourConfig,
      getCurrentStep,
    }),
    [
      state,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      completeTour,
      resetTours,
      isPageTourAvailable,
      getCurrentTourConfig,
      getCurrentStep,
    ]
  );

  return (
    <PageTourContext.Provider value={contextValue}>
      {children}
    </PageTourContext.Provider>
  );
}

export function usePageTour() {
  const context = useContext(PageTourContext);
  if (context === undefined) {
    throw new Error('usePageTour must be used within a PageTourProvider');
  }
  return context;
}
