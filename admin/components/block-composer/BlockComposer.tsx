'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BlockItem, SortableBlockItem } from './BlockItem';
import { BlockTypePicker } from './BlockTypePicker';
import { BlockSettingsModal } from './BlockSettingsModal';
import {
  blockSchemaRegistry,
  createBlock,
  duplicateBlock,
  getBlockName,
} from '@/lib/block-schema';

// =============================================================================
// TYPES
// =============================================================================

export interface BlockConfig {
  id: string;
  type: string;
  variant?: string;
  enabled: boolean;
  [key: string]: unknown;
}

export interface SectionConfig {
  id: string;
  name?: string;
  blocks: BlockConfig[];
  enabled: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
}

interface BlockComposerProps {
  sections: SectionConfig[];
  onChange: (sections: SectionConfig[]) => void;
  disabled?: boolean;
}

// =============================================================================
// BLOCK COMPOSER
// =============================================================================

export function BlockComposer({ sections, onChange, disabled = false }: BlockComposerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{ sectionId: string; block: BlockConfig } | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all blocks with section info for DnD
  const allBlocks = sections.flatMap((section) =>
    section.blocks.map((block) => ({
      ...block,
      sectionId: section.id,
      compositeId: `${section.id}:${block.id}`,
    }))
  );

  const activeBlock = activeId
    ? allBlocks.find((b) => b.compositeId === activeId)
    : null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const activeCompositeId = active.id as string;
      const overCompositeId = over.id as string;

      const [activeSectionId, activeBlockId] = activeCompositeId.split(':');
      const [overSectionId, overBlockId] = overCompositeId.split(':');

      const newSections = [...sections];

      if (activeSectionId === overSectionId) {
        // Same section reorder
        const sectionIndex = newSections.findIndex((s) => s.id === activeSectionId);
        if (sectionIndex === -1) return;

        const section = newSections[sectionIndex];
        const oldIndex = section.blocks.findIndex((b) => b.id === activeBlockId);
        const newIndex = section.blocks.findIndex((b) => b.id === overBlockId);

        if (oldIndex !== -1 && newIndex !== -1) {
          newSections[sectionIndex] = {
            ...section,
            blocks: arrayMove(section.blocks, oldIndex, newIndex),
          };
          onChange(newSections);
        }
      } else {
        // Cross-section move
        const fromSectionIndex = newSections.findIndex((s) => s.id === activeSectionId);
        const toSectionIndex = newSections.findIndex((s) => s.id === overSectionId);

        if (fromSectionIndex === -1 || toSectionIndex === -1) return;

        const fromSection = newSections[fromSectionIndex];
        const toSection = newSections[toSectionIndex];

        const blockIndex = fromSection.blocks.findIndex((b) => b.id === activeBlockId);
        if (blockIndex === -1) return;

        const [block] = fromSection.blocks.splice(blockIndex, 1);
        const insertIndex = toSection.blocks.findIndex((b) => b.id === overBlockId);

        if (insertIndex === -1) {
          toSection.blocks.push(block);
        } else {
          toSection.blocks.splice(insertIndex, 0, block);
        }

        newSections[fromSectionIndex] = { ...fromSection };
        newSections[toSectionIndex] = { ...toSection };
        onChange(newSections);
      }
    },
    [sections, onChange]
  );

  const handleAddBlock = useCallback(
    (type: string, variant?: string) => {
      const sectionId = targetSectionId || sections[0]?.id;
      if (!sectionId) return;

      const newBlock = createBlock(type, variant) as BlockConfig;
      const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: [...section.blocks, newBlock],
          };
        }
        return section;
      });

      onChange(newSections);
      setShowTypePicker(false);
      setTargetSectionId(null);

      // Open settings for new block
      setEditingBlock({ sectionId, block: newBlock });
    },
    [sections, targetSectionId, onChange]
  );

  const handleDeleteBlock = useCallback(
    (sectionId: string, blockId: string) => {
      const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: section.blocks.filter((b) => b.id !== blockId),
          };
        }
        return section;
      });
      onChange(newSections);
    },
    [sections, onChange]
  );

  const handleDuplicateBlock = useCallback(
    (sectionId: string, block: BlockConfig) => {
      const duplicated = duplicateBlock(block) as BlockConfig;
      const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          const blockIndex = section.blocks.findIndex((b) => b.id === block.id);
          const newBlocks = [...section.blocks];
          newBlocks.splice(blockIndex + 1, 0, duplicated);
          return { ...section, blocks: newBlocks };
        }
        return section;
      });
      onChange(newSections);
    },
    [sections, onChange]
  );

  const handleToggleBlock = useCallback(
    (sectionId: string, blockId: string) => {
      const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: section.blocks.map((b) =>
              b.id === blockId ? { ...b, enabled: !b.enabled } : b
            ),
          };
        }
        return section;
      });
      onChange(newSections);
    },
    [sections, onChange]
  );

  const handleUpdateBlock = useCallback(
    (sectionId: string, blockId: string, updates: Partial<BlockConfig>) => {
      const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: section.blocks.map((b) =>
              b.id === blockId ? { ...b, ...updates } : b
            ),
          };
        }
        return section;
      });
      onChange(newSections);
    },
    [sections, onChange]
  );

  const handleBlockSave = useCallback(
    (block: BlockConfig) => {
      if (!editingBlock) return;

      handleUpdateBlock(editingBlock.sectionId, editingBlock.block.id, block);
      setEditingBlock(null);
    },
    [editingBlock, handleUpdateBlock]
  );

  const handleAddSection = useCallback(() => {
    const newSection: SectionConfig = {
      id: `section-${Date.now()}`,
      name: `Section ${sections.length + 1}`,
      blocks: [],
      enabled: true,
    };
    onChange([...sections, newSection]);
  }, [sections, onChange]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              'rounded-lg border bg-card',
              !section.enabled && 'opacity-60'
            )}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{section.name || 'Section'}</span>
                <span className="text-sm text-muted-foreground">
                  ({section.blocks.length} blocks)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTargetSectionId(section.id);
                  setShowTypePicker(true);
                }}
                disabled={disabled}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Block
              </Button>
            </div>

            {/* Blocks */}
            <div className="p-4">
              {section.blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
                  <Layers className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No blocks yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setTargetSectionId(section.id);
                      setShowTypePicker(true);
                    }}
                    disabled={disabled}
                  >
                    Add your first block
                  </Button>
                </div>
              ) : (
                <SortableContext
                  items={section.blocks.map((b) => `${section.id}:${b.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {section.blocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        id={`${section.id}:${block.id}`}
                        block={block}
                        disabled={disabled}
                        onEdit={() => setEditingBlock({ sectionId: section.id, block })}
                        onDelete={() => handleDeleteBlock(section.id, block.id)}
                        onDuplicate={() => handleDuplicateBlock(section.id, block)}
                        onToggle={() => handleToggleBlock(section.id, block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>
        ))}

        <DragOverlay>
          {activeBlock && (
            <BlockItem
              block={activeBlock}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Add Section Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAddSection}
        disabled={disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Section
      </Button>

      {/* Block Type Picker Modal */}
      <BlockTypePicker
        open={showTypePicker}
        onOpenChange={setShowTypePicker}
        onSelect={handleAddBlock}
      />

      {/* Block Settings Modal */}
      {editingBlock && (
        <BlockSettingsModal
          open={!!editingBlock}
          onOpenChange={(open) => !open && setEditingBlock(null)}
          block={editingBlock.block}
          onSave={handleBlockSave}
        />
      )}
    </div>
  );
}

export default BlockComposer;
