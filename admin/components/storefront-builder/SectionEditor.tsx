'use client';

import { useState } from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  LayoutGrid,
  Image,
  Mail,
  Quote,
  Code,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { StorefrontSection } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface SectionEditorProps {
  sections: StorefrontSection[];
  onChange: (sections: StorefrontSection[]) => void;
  disabled?: boolean;
}

const SECTION_TYPES: {
  type: StorefrontSection['type'];
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    type: 'featured_products',
    label: 'Featured Products',
    icon: ShoppingBag,
    description: 'Showcase your best-selling or new products',
  },
  {
    type: 'categories',
    label: 'Categories',
    icon: LayoutGrid,
    description: 'Display category cards with images',
  },
  {
    type: 'banner',
    label: 'Banner',
    icon: Image,
    description: 'Full-width promotional banner',
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: Mail,
    description: 'Email subscription form',
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: Quote,
    description: 'Customer reviews and testimonials',
  },
  {
    type: 'custom_html',
    label: 'Custom HTML',
    icon: Code,
    description: 'Add your own HTML content',
  },
];

export function SectionEditor({ sections, onChange, disabled }: SectionEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleToggleEnabled = (sectionId: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    onChange(updated);
  };

  const handleUpdateTitle = (sectionId: string, title: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, title } : s
    );
    onChange(updated);
  };

  const handleDelete = (sectionId: string) => {
    const updated = sections.filter((s) => s.id !== sectionId);
    // Re-calculate positions
    const reordered = updated.map((s, index) => ({ ...s, position: index }));
    onChange(reordered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reordered = updated.map((s, i) => ({ ...s, position: i }));
    onChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reordered = updated.map((s, i) => ({ ...s, position: i }));
    onChange(reordered);
  };

  const handleAddSection = (type: StorefrontSection['type']) => {
    const sectionType = SECTION_TYPES.find((t) => t.type === type);
    const newSection: StorefrontSection = {
      id: crypto.randomUUID(),
      type,
      title: sectionType?.label || 'New Section',
      enabled: true,
      position: sections.length,
    };
    onChange([...sections, newSection]);
    setShowAddMenu(false);
  };

  // Sort sections by position
  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Homepage Sections</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder, toggle visibility, or add new sections
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-primary/100 text-white hover:bg-primary transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Section
          </button>

          {/* Add section dropdown */}
          {showAddMenu && !disabled && (
            <div className="absolute right-0 mt-2 w-72 bg-card rounded-xl shadow-xl border border-border z-10">
              <div className="p-2">
                {SECTION_TYPES.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddSection(type)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg',
                      'hover:bg-muted transition-colors text-left'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-2">
        {sortedSections.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-xl border-2 border-dashed border-border">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sections added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Section" to get started
            </p>
          </div>
        ) : (
          sortedSections.map((section, index) => {
            const sectionType = SECTION_TYPES.find((t) => t.type === section.type);
            const Icon = sectionType?.icon || LayoutGrid;

            return (
              <div
                key={section.id}
                className={cn(
                  'flex items-center gap-3 p-4 bg-card rounded-xl border',
                  'transition-all duration-200',
                  section.enabled
                    ? 'border-border hover:border-border'
                    : 'border-border bg-muted opacity-60'
                )}
              >
                {/* Drag handle */}
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Section icon */}
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    section.enabled ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      section.enabled ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>

                {/* Section info */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={section.title || ''}
                    onChange={(e) => handleUpdateTitle(section.id, e.target.value)}
                    disabled={disabled}
                    className={cn(
                      'w-full font-medium bg-transparent border-0 p-0',
                      'focus:outline-none focus:ring-0',
                      section.enabled ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    placeholder="Section title"
                  />
                  <p className="text-xs text-muted-foreground capitalize">
                    {section.type.replace('_', ' ')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={disabled || index === 0}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-muted transition-colors',
                      (disabled || index === 0) && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={disabled || index === sections.length - 1}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-muted transition-colors',
                      (disabled || index === sections.length - 1) &&
                        'opacity-30 cursor-not-allowed'
                    )}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(section.id)}
                    disabled={disabled}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-muted transition-colors',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {section.enabled ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(section.id)}
                    disabled={disabled}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-destructive/10 transition-colors',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SectionEditor;
