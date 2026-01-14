import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardWidget, DEFAULT_WIDGET_ORDER } from '@/lib/types/dashboard';

const STORAGE_KEY = 'dashboard-widget-order';

// Helper to move array items
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}

// Merge stored layout with defaults to handle new widgets
function mergeWithDefaults(stored: DashboardWidget[], defaults: DashboardWidget[]): DashboardWidget[] {
  const storedIds = new Set(stored.map(w => w.id));
  const newWidgets = defaults.filter(w => !storedIds.has(w.id));
  return [
    ...stored,
    ...newWidgets.map((w, i) => ({ ...w, position: stored.length + i })),
  ];
}

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGET_ORDER);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from API on mount, with localStorage as fallback
  useEffect(() => {
    const loadLayout = async () => {
      try {
        // First, try to load from localStorage for immediate display
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const merged = mergeWithDefaults(parsed, DEFAULT_WIDGET_ORDER);
            setWidgets(merged);
          } catch {
            // Invalid localStorage data, ignore
          }
        }

        // Then fetch from API for the authoritative state
        const response = await fetch('/api/user/preferences', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.dashboardLayout) {
            const merged = mergeWithDefaults(data.data.dashboardLayout, DEFAULT_WIDGET_ORDER);
            setWidgets(merged);
            // Update localStorage with API data
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
        // Keep using localStorage or defaults
      } finally {
        setIsLoaded(true);
      }
    };

    loadLayout();
  }, []);

  // Save to API with debounce
  const saveToApi = useCallback(async (newWidgets: DashboardWidget[]) => {
    try {
      setIsSaving(true);
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashboardLayout: newWidgets,
        }),
      });
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced save - waits 1 second after last change before saving
  const debouncedSave = useCallback((newWidgets: DashboardWidget[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToApi(newWidgets);
    }, 1000);
  }, [saveToApi]);

  // Reorder widgets
  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setWidgets((items) => {
      const oldIndex = items.findIndex((w) => w.id === activeId);
      const newIndex = items.findIndex((w) => w.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return items;
      }

      const newItems = arrayMove(items, oldIndex, newIndex)
        .map((item, index) => ({ ...item, position: index }));

      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      // Debounce API save
      debouncedSave(newItems);

      return newItems;
    });
  }, [debouncedSave]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGET_ORDER);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGET_ORDER));
    saveToApi(DEFAULT_WIDGET_ORDER);
  }, [saveToApi]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets((items) => {
      const newItems = items.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      debouncedSave(newItems);
      return newItems;
    });
  }, [debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    widgets: widgets.filter(w => w.enabled).sort((a, b) => a.position - b.position),
    allWidgets: widgets.sort((a, b) => a.position - b.position),
    isLoaded,
    isSaving,
    reorderWidgets,
    resetLayout,
    toggleWidget,
  };
}
