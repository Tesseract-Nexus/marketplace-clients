'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  blockSchemaRegistry,
  BlockSchema,
  BLOCK_CATEGORIES,
} from '@/lib/block-schema';

// =============================================================================
// TYPES
// =============================================================================

interface BlockTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string, variant?: string) => void;
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
// BLOCK TYPE CARD
// =============================================================================

interface BlockTypeCardProps {
  schema: BlockSchema;
  onSelect: (type: string, variant?: string) => void;
}

function BlockTypeCard({ schema, onSelect }: BlockTypeCardProps) {
  const [showVariants, setShowVariants] = useState(false);
  const hasVariants = schema.variants && schema.variants.length > 1;

  const handleClick = () => {
    if (hasVariants) {
      setShowVariants(!showVariants);
    } else {
      onSelect(schema.type, schema.defaultVariant);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'w-full p-4 text-left border rounded-lg transition-all',
          'hover:border-primary hover:bg-primary/5',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          showVariants && 'border-primary bg-primary/5'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <DynamicIcon name={schema.icon} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{schema.name}</h4>
              {hasVariants && (
                <span className="text-xs text-muted-foreground">
                  {schema.variants!.length} variants
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {schema.description}
            </p>
          </div>
        </div>
      </button>

      {/* Variants */}
      {showVariants && schema.variants && (
        <div className="grid grid-cols-2 gap-2 pl-4">
          {schema.variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(schema.type, variant.id)}
              className={cn(
                'p-3 text-left border rounded-lg transition-all',
                'hover:border-primary hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            >
              <h5 className="font-medium text-sm">{variant.name}</h5>
              {variant.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {variant.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// BLOCK TYPE PICKER
// =============================================================================

export function BlockTypePicker({ open, onOpenChange, onSelect }: BlockTypePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const schemas = useMemo(() => {
    return blockSchemaRegistry.getAllSchemas();
  }, []);

  const filteredSchemas = useMemo(() => {
    let filtered = schemas;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [schemas, selectedCategory, searchQuery]);

  const schemasByCategory = useMemo(() => {
    const grouped = new Map<string, BlockSchema[]>();

    filteredSchemas.forEach((schema) => {
      const category = schema.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(schema);
    });

    return grouped;
  }, [filteredSchemas]);

  const handleSelect = (type: string, variant?: string) => {
    onSelect(type, variant);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>
            Choose a block type to add to your page layout
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex gap-4 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocks..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 py-2 overflow-x-auto">
          <Button
            variant={selectedCategory === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {BLOCK_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="shrink-0"
            >
              <DynamicIcon name={category.icon} className="w-4 h-4 mr-1.5" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* Block Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {filteredSchemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LucideIcons.Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No blocks found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or category
              </p>
            </div>
          ) : selectedCategory || searchQuery ? (
            // Flat list when filtered
            <div className="grid gap-3 pb-4">
              {filteredSchemas.map((schema) => (
                <BlockTypeCard
                  key={schema.type}
                  schema={schema}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            // Grouped by category
            <div className="space-y-6 pb-4">
              {Array.from(schemasByCategory.entries()).map(([categoryId, categorySchemas]) => {
                const category = BLOCK_CATEGORIES.find((c) => c.id === categoryId);
                if (!category) return null;

                return (
                  <div key={categoryId}>
                    <div className="flex items-center gap-2 mb-3">
                      <DynamicIcon name={category.icon} className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({categorySchemas.length})
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {categorySchemas.map((schema) => (
                        <BlockTypeCard
                          key={schema.type}
                          schema={schema}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default BlockTypePicker;
