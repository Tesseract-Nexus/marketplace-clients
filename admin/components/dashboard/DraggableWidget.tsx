'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardLayoutContext } from '@/contexts/DashboardLayoutContext';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  gridSpan: 'full' | 'half';
}

export function DraggableWidget({ id, children, gridSpan }: DraggableWidgetProps) {
  const { isEditMode } = useDashboardLayoutContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        gridSpan === 'full' && 'lg:col-span-2',
        gridSpan === 'half' && 'col-span-1',
        isDragging && 'z-50 opacity-90',
      )}
    >
      {/* Drag Handle - visible in edit mode */}
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-2 sm:-left-3 top-3 sm:top-4 z-20',
            'p-1 sm:p-1.5 rounded-lg cursor-grab active:cursor-grabbing',
            'bg-card border border-primary/30 shadow-md',
            'opacity-70 group-hover:opacity-100 transition-all duration-200',
            'hover:bg-primary/10 hover:border-primary/50',
            isDragging && 'opacity-100 cursor-grabbing bg-primary/20 border-primary',
          )}
          aria-label={`Drag to reorder widget`}
        >
          <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
        </div>
      )}

      {/* Edit mode indicator border - always visible in edit mode */}
      {isEditMode && (
        <div
          className={cn(
            'absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200',
            'border-2 border-dashed',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-primary/40 group-hover:border-primary/60 group-hover:bg-primary/5',
          )}
        />
      )}

      {/* Widget Content */}
      <div
        className={cn(
          'transition-all duration-200',
          isDragging && 'scale-[1.02] shadow-2xl rounded-2xl',
          isEditMode && 'cursor-default',
        )}
      >
        {children}
      </div>
    </div>
  );
}
