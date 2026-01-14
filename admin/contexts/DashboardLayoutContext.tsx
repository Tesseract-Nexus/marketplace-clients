'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/lib/hooks/useDashboardLayout';
import { DashboardWidget } from '@/lib/types/dashboard';

interface DashboardLayoutContextType {
  widgets: DashboardWidget[];
  allWidgets: DashboardWidget[];
  isLoaded: boolean;
  isSaving: boolean;
  activeId: string | null;
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  resetLayout: () => void;
  toggleWidget: (id: string) => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | null>(null);

interface DashboardLayoutProviderProps {
  children: React.ReactNode;
  renderDragOverlay?: (widget: DashboardWidget) => React.ReactNode;
}

export function DashboardLayoutProvider({
  children,
  renderDragOverlay,
}: DashboardLayoutProviderProps) {
  const {
    widgets,
    allWidgets,
    isLoaded,
    isSaving,
    reorderWidgets,
    resetLayout,
    toggleWidget,
  } = useDashboardLayout();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditMode, setEditMode] = useState(false);

  // Configure sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press to start dragging on touch
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      reorderWidgets(active.id as string, over.id as string);
    }
  }, [reorderWidgets]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

  return (
    <DashboardLayoutContext.Provider
      value={{
        widgets,
        allWidgets,
        isLoaded,
        isSaving,
        activeId,
        isEditMode,
        setEditMode,
        resetLayout,
        toggleWidget,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={widgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          {children}
        </SortableContext>

        {/* Drag overlay for smooth visual feedback */}
        <DragOverlay>
          {activeWidget && renderDragOverlay ? (
            <div className="opacity-95 scale-105 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-500 ring-offset-2 rounded-2xl">
              {renderDragOverlay(activeWidget)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayoutContext() {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error('useDashboardLayoutContext must be used within DashboardLayoutProvider');
  }
  return context;
}
