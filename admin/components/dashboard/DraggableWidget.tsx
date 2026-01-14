'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  gridSpan: 'full' | 'half';
  isEditMode?: boolean;
}

export function DraggableWidget({ id, children, gridSpan, isEditMode = false }: DraggableWidgetProps) {
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
      {/* Drag Handle - appears on hover when in edit mode */}
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-3 top-4 z-20',
            'p-1.5 rounded-lg cursor-grab active:cursor-grabbing',
            'bg-card border border-border shadow-md',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'hover:bg-muted hover:border-border',
            isDragging && 'opacity-100 cursor-grabbing bg-primary/10 border-primary/50',
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Edit mode indicator border */}
      {isEditMode && (
        <div
          className={cn(
            'absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200',
            'border-2 border-dashed',
            isDragging
              ? 'border-primary/70 bg-primary/10/30'
              : 'border-transparent group-hover:border-primary/30',
          )}
        />
      )}

      {/* Widget Content */}
      <div
        className={cn(
          'transition-all duration-200',
          isDragging && 'scale-[1.02] shadow-2xl rounded-2xl',
        )}
      >
        {children}
      </div>
    </div>
  );
}
