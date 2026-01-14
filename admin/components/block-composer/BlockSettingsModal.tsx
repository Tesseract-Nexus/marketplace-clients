'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Save, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BlockFormRenderer } from './BlockFormRenderer';
import {
  blockSchemaRegistry,
  getBlockName,
  BlockFieldSchema,
  DEFAULT_FIELD_GROUPS,
} from '@/lib/block-schema';

// =============================================================================
// TYPES
// =============================================================================

interface BlockConfig {
  id: string;
  type: string;
  variant?: string;
  enabled: boolean;
  adminLabel?: string;
  [key: string]: unknown;
}

interface BlockSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: BlockConfig;
  onSave: (block: BlockConfig) => void;
}

// =============================================================================
// DYNAMIC ICON
// =============================================================================

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) {
    return <LucideIcons.Box className={className} />;
  }
  return <IconComponent className={className} />;
}

// =============================================================================
// BLOCK SETTINGS MODAL
// =============================================================================

export function BlockSettingsModal({
  open,
  onOpenChange,
  block,
  onSave,
}: BlockSettingsModalProps) {
  const [localBlock, setLocalBlock] = useState<BlockConfig>(block);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = useMemo(() => {
    return blockSchemaRegistry.getSchema(block.type);
  }, [block.type]);

  const fields = useMemo(() => {
    return blockSchemaRegistry.getFieldsForBlock(localBlock.type, localBlock.variant as string);
  }, [localBlock.type, localBlock.variant]);

  // Group fields by tab
  const fieldsByGroup = useMemo(() => {
    const groups: Record<string, BlockFieldSchema[]> = {
      content: [],
      layout: [],
      visibility: [],
      styling: [],
      animation: [],
      schedule: [],
      targeting: [],
      analytics: [],
      admin: [],
    };

    fields.forEach((field) => {
      const group = field.group || 'content';
      if (groups[group]) {
        groups[group].push(field);
      } else {
        groups.content.push(field);
      }
    });

    return groups;
  }, [fields]);

  // Available tabs (only show tabs with fields)
  const availableTabs = useMemo(() => {
    return DEFAULT_FIELD_GROUPS.filter(
      (group) => fieldsByGroup[group.id]?.length > 0
    );
  }, [fieldsByGroup]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setLocalBlock((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleSave = useCallback(() => {
    // Validate
    const validationErrors = blockSchemaRegistry.validateBlockConfig(
      localBlock.type,
      localBlock as Record<string, unknown>
    );

    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((error) => {
        // Try to extract field name from error
        const match = error.match(/^(.+?) (is required|requires)/);
        if (match) {
          const fieldLabel = match[1];
          const field = fields.find((f) => f.label === fieldLabel);
          if (field) {
            errorMap[field.name] = error;
          }
        }
      });
      setErrors(errorMap);
      return;
    }

    onSave(localBlock);
  }, [localBlock, fields, onSave]);

  const handleCancel = useCallback(() => {
    setLocalBlock(block);
    setErrors({});
    onOpenChange(false);
  }, [block, onOpenChange]);

  // Update local block when prop changes
  React.useEffect(() => {
    setLocalBlock(block);
    setErrors({});
  }, [block]);

  if (!schema) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <DynamicIcon name={schema.icon} className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>
                {localBlock.adminLabel || getBlockName(localBlock.type)}
              </DialogTitle>
              <DialogDescription>
                {schema.description}
                {localBlock.variant && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-muted rounded">
                    {schema.variants?.find((v) => v.id === localBlock.variant)?.name}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(availableTabs.length, 6)}, 1fr)` }}>
            {availableTabs.slice(0, 6).map((group) => (
              <TabsTrigger key={group.id} value={group.id} className="text-sm">
                <DynamicIcon name={group.icon || 'FileText'} className="w-4 h-4 mr-1.5" />
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Show remaining tabs if more than 6 */}
          {availableTabs.length > 6 && (
            <TabsList className="grid w-full mt-1" style={{ gridTemplateColumns: `repeat(${availableTabs.length - 6}, 1fr)` }}>
              {availableTabs.slice(6).map((group) => (
                <TabsTrigger key={group.id} value={group.id} className="text-sm">
                  <DynamicIcon name={group.icon || 'FileText'} className="w-4 h-4 mr-1.5" />
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <ScrollArea className="flex-1 mt-4">
            {availableTabs.map((group) => (
              <TabsContent key={group.id} value={group.id} className="mt-0 pr-4">
                <div className="space-y-1 mb-4">
                  <h3 className="font-medium">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </div>
                <BlockFormRenderer
                  fields={fieldsByGroup[group.id] || []}
                  values={localBlock as Record<string, unknown>}
                  onChange={handleChange}
                  errors={errors}
                />
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BlockSettingsModal;
