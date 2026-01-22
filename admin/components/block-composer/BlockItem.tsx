'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Settings,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  Monitor,
  Calendar,
  Users,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getBlockIcon, getBlockName, blockSchemaRegistry } from '@/lib/block-schema';

// =============================================================================
// TYPES
// =============================================================================

interface BlockConfig {
  id: string;
  type: string;
  variant?: string;
  enabled: boolean;
  adminLabel?: string;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
  schedule?: { enabled: boolean };
  personalization?: { enabled: boolean };
  [key: string]: unknown;
}

interface BlockItemProps {
  block: BlockConfig;
  disabled?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggle?: () => void;
}

interface SortableBlockItemProps extends BlockItemProps {
  id: string;
}

// =============================================================================
// DYNAMIC ICON
// =============================================================================

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[name];
  if (!IconComponent || typeof IconComponent !== 'function') {
    return <LucideIcons.Box className={className} />;
  }
  return <IconComponent className={className} />;
}

// =============================================================================
// BLOCK ITEM
// =============================================================================

export function BlockItem({
  block,
  disabled = false,
  isDragging = false,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
}: BlockItemProps) {
  const schema = blockSchemaRegistry.getSchema(block.type);
  const iconName = schema?.icon || 'Box';
  const blockName = block.adminLabel || getBlockName(block.type);
  const variantName = block.variant
    ? schema?.variants?.find((v) => v.id === block.variant)?.name
    : undefined;

  const showOnMobile = block.showOnMobile !== false;
  const showOnTablet = block.showOnTablet !== false;
  const showOnDesktop = block.showOnDesktop !== false;
  const hasSchedule = block.schedule?.enabled;
  const hasPersonalization = block.personalization?.enabled;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 bg-background border rounded-lg transition-all',
        isDragging && 'shadow-lg ring-2 ring-primary/50 opacity-90',
        !block.enabled && 'opacity-50 bg-muted/50',
        disabled && 'pointer-events-none'
      )}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md',
          block.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <DynamicIcon name={iconName} className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{blockName}</span>
          {variantName && (
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
              {variantName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Device visibility indicators */}
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'p-0.5 rounded',
                      showOnMobile ? 'text-primary' : 'text-muted-foreground/30'
                    )}
                  >
                    <Smartphone className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {showOnMobile ? 'Visible on mobile' : 'Hidden on mobile'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'p-0.5 rounded',
                      showOnTablet ? 'text-primary' : 'text-muted-foreground/30'
                    )}
                  >
                    <Tablet className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {showOnTablet ? 'Visible on tablet' : 'Hidden on tablet'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'p-0.5 rounded',
                      showOnDesktop ? 'text-primary' : 'text-muted-foreground/30'
                    )}
                  >
                    <Monitor className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {showOnDesktop ? 'Visible on desktop' : 'Hidden on desktop'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Schedule indicator */}
            {hasSchedule && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-0.5 rounded text-warning">
                    <Calendar className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Scheduled visibility</TooltipContent>
              </Tooltip>
            )}

            {/* Personalization indicator */}
            {hasPersonalization && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-0.5 rounded text-primary">
                    <Users className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Audience targeted</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Enabled Toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Switch
                checked={block.enabled}
                onCheckedChange={onToggle}
                disabled={disabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {block.enabled ? 'Disable block' : 'Enable block'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
                disabled={disabled}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit block</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
              <LucideIcons.MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// =============================================================================
// SORTABLE BLOCK ITEM
// =============================================================================

export function SortableBlockItem({ id, ...props }: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: props.disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'z-50')}
    >
      <BlockItem {...props} isDragging={isDragging} />
    </div>
  );
}

export default BlockItem;
