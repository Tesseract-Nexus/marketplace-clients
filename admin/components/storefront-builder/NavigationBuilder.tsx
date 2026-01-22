'use client';

import { useState, useCallback } from 'react';
import {
  GripVertical,
  Trash2,
  Plus,
  ExternalLink,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Settings2,
  Badge,
  Image as ImageIcon,
  LayoutGrid,
  X,
} from 'lucide-react';
import { StorefrontNavLink } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavigationBuilderProps {
  links: StorefrontNavLink[];
  onChange: (links: StorefrontNavLink[]) => void;
  disabled?: boolean;
  maxLinks?: number;
  maxDepth?: number;
}

// Available icons for navigation items
const AVAILABLE_ICONS = [
  'Home', 'ShoppingBag', 'Tag', 'Heart', 'Star', 'Sparkles', 'Gift',
  'Percent', 'Zap', 'Crown', 'Award', 'Flame', 'TrendingUp', 'Package',
];

// Badge presets
const BADGE_PRESETS = [
  { label: 'New', color: '#22c55e' },
  { label: 'Sale', color: '#ef4444' },
  { label: 'Hot', color: '#f97316' },
  { label: 'Popular', color: '#8b5cf6' },
];

interface NavItemEditorProps {
  link: StorefrontNavLink;
  depth: number;
  index: number;
  totalItems: number;
  maxDepth: number;
  onUpdate: (updates: Partial<StorefrontNavLink>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddChild: () => void;
  disabled?: boolean;
}

function NavItemEditor({
  link,
  depth,
  index,
  totalItems,
  maxDepth,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddChild,
  disabled,
}: NavItemEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hasChildren = link.children && link.children.length > 0;
  const canAddChildren = depth < maxDepth;

  const handleChildUpdate = (childIndex: number, updates: Partial<StorefrontNavLink>) => {
    if (!link.children) return;
    const updatedChildren = [...link.children];
    updatedChildren[childIndex] = { ...updatedChildren[childIndex], ...updates };
    onUpdate({ children: updatedChildren });
  };

  const handleChildDelete = (childIndex: number) => {
    if (!link.children) return;
    const updatedChildren = link.children.filter((_, i) => i !== childIndex);
    onUpdate({ children: updatedChildren.map((c, i) => ({ ...c, position: i })) });
  };

  const handleChildMove = (childIndex: number, direction: 'up' | 'down') => {
    if (!link.children) return;
    const newIndex = direction === 'up' ? childIndex - 1 : childIndex + 1;
    if (newIndex < 0 || newIndex >= link.children.length) return;

    const updatedChildren = [...link.children];
    [updatedChildren[childIndex], updatedChildren[newIndex]] = [updatedChildren[newIndex], updatedChildren[childIndex]];
    onUpdate({ children: updatedChildren.map((c, i) => ({ ...c, position: i })) });
  };

  const handleAddNestedChild = (childIndex: number) => {
    if (!link.children) return;
    const child = link.children[childIndex];
    const newChild: StorefrontNavLink = {
      id: crypto.randomUUID(),
      label: 'New Item',
      href: '/',
      isExternal: false,
      position: (child.children?.length || 0),
    };
    const updatedChildren = [...link.children];
    updatedChildren[childIndex] = {
      ...child,
      children: [...(child.children || []), newChild],
    };
    onUpdate({ children: updatedChildren });
  };

  return (
    <div className={cn('relative', depth > 0 && 'ml-6 border-l-2 border-border pl-4')}>
      <div
        className={cn(
          'flex items-center gap-2 p-3 bg-card rounded-lg border border-border',
          'hover:border-primary/30 transition-all group',
          showSettings && 'ring-2 ring-purple-500/20 border-primary'
        )}
      >
        {/* Drag handle */}
        <div className="text-muted-foreground cursor-grab hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Expand/collapse for items with children */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Icon indicator */}
        {link.icon && (
          <span className="text-primary text-sm">{link.icon}</span>
        )}

        {/* Link fields */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={link.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            disabled={disabled}
            placeholder="Link label"
            className={cn(
              'px-3 py-1.5 rounded-lg border border-border text-sm',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary',
              disabled && 'opacity-50 cursor-not-allowed bg-muted'
            )}
          />
          <input
            type="text"
            value={link.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
            disabled={disabled}
            placeholder="/path or https://..."
            className={cn(
              'px-3 py-1.5 rounded-lg border border-border text-sm',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary',
              disabled && 'opacity-50 cursor-not-allowed bg-muted'
            )}
          />
        </div>

        {/* Badge indicator */}
        {link.badge && (
          <span
            className="px-2 py-0.5 text-xs font-medium text-white rounded-full"
            style={{ backgroundColor: link.badgeColor || '#8b5cf6' }}
          >
            {link.badge}
          </span>
        )}

        {/* Mega menu indicator */}
        {link.isMegaMenu && depth === 0 && (
          <span className="px-2 py-0.5 text-xs bg-accent text-primary rounded">
            Mega
          </span>
        )}

        {/* External link toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ isExternal: !link.isExternal })}
          disabled={disabled}
          title={link.isExternal ? 'Opens in new tab' : 'Opens in same tab'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            link.isExternal ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ExternalLink className="h-4 w-4" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            showSettings ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <Settings2 className="h-4 w-4" />
        </button>

        {/* Reorder buttons */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disabled || index === 0}
            className={cn(
              'p-0.5 hover:bg-muted rounded transition-colors',
              (disabled || index === 0) && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disabled || index === totalItems - 1}
            className={cn(
              'p-0.5 hover:bg-muted rounded transition-colors',
              (disabled || index === totalItems - 1) && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {/* Add child button */}
        {canAddChildren && (
          <button
            type="button"
            onClick={onAddChild}
            disabled={disabled}
            title="Add sub-item"
            className={cn(
              'p-1.5 rounded-lg hover:bg-success-muted hover:text-success transition-colors text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className={cn(
            'p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-2 p-4 bg-muted/50 rounded-lg border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Item Settings</h4>
            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Badge */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Badge</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={link.badge || ''}
                  onChange={(e) => onUpdate({ badge: e.target.value || undefined })}
                  placeholder="e.g., New, Sale"
                  className="flex-1 px-2 py-1 text-sm border border-border rounded"
                />
                <input
                  type="color"
                  value={link.badgeColor || '#8b5cf6'}
                  onChange={(e) => onUpdate({ badgeColor: e.target.value })}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
              </div>
              <div className="flex gap-1 mt-1">
                {BADGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onUpdate({ badge: preset.label, badgeColor: preset.color })}
                    className="px-2 py-0.5 text-xs text-white rounded"
                    style={{ backgroundColor: preset.color }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Icon</label>
              <select
                value={link.icon || ''}
                onChange={(e) => onUpdate({ icon: e.target.value || undefined })}
                className="w-full px-2 py-1 text-sm border border-border rounded"
              >
                <option value="">No icon</option>
                {AVAILABLE_ICONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mega Menu Settings (only for top-level items) */}
          {depth === 0 && (
            <div className="pt-4 border-t border-border">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={link.isMegaMenu || false}
                  onChange={(e) => onUpdate({ isMegaMenu: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                <span className="text-sm font-medium">Enable Mega Menu</span>
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </label>

              {link.isMegaMenu && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Columns</label>
                    <select
                      value={link.megaMenuColumns || 3}
                      onChange={(e) => onUpdate({ megaMenuColumns: parseInt(e.target.value) as 2 | 3 | 4 })}
                      className="w-full px-2 py-1 text-sm border border-border rounded"
                    >
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Featured Image</label>
                    <input
                      type="text"
                      value={link.megaMenuImage || ''}
                      onChange={(e) => onUpdate({ megaMenuImage: e.target.value || undefined })}
                      placeholder="Image URL"
                      className="w-full px-2 py-1 text-sm border border-border rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {link.children!.map((child, childIndex) => (
            <NavItemEditor
              key={child.id}
              link={child}
              depth={depth + 1}
              index={childIndex}
              totalItems={link.children!.length}
              maxDepth={maxDepth}
              onUpdate={(updates) => handleChildUpdate(childIndex, updates)}
              onDelete={() => handleChildDelete(childIndex)}
              onMoveUp={() => handleChildMove(childIndex, 'up')}
              onMoveDown={() => handleChildMove(childIndex, 'down')}
              onAddChild={() => handleAddNestedChild(childIndex)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavigationBuilder({
  links,
  onChange,
  disabled,
  maxLinks = 10,
  maxDepth = 2,
}: NavigationBuilderProps) {
  const handleAddLink = () => {
    if (links.length >= maxLinks) return;

    const newLink: StorefrontNavLink = {
      id: crypto.randomUUID(),
      label: 'New Link',
      href: '/',
      isExternal: false,
      position: links.length,
    };
    onChange([...links, newLink]);
  };

  const handleUpdateLink = (index: number, updates: Partial<StorefrontNavLink>) => {
    const updated = [...links];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleDeleteLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    onChange(updated.map((l, i) => ({ ...l, position: i })));
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const updated = [...links];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((l, i) => ({ ...l, position: i })));
  };

  const handleAddChild = (parentIndex: number) => {
    const parent = links[parentIndex];
    const newChild: StorefrontNavLink = {
      id: crypto.randomUUID(),
      label: 'Sub Item',
      href: '/',
      isExternal: false,
      position: (parent.children?.length || 0),
    };
    const updated = [...links];
    updated[parentIndex] = {
      ...parent,
      children: [...(parent.children || []), newChild],
    };
    onChange(updated);
  };

  const sortedLinks = [...links].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">Navigation Menu</h4>
          <p className="text-sm text-muted-foreground">
            {links.length} of {maxLinks} items. Supports up to {maxDepth} levels of nesting.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLink}
          disabled={disabled || links.length >= maxLinks}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Links list */}
      <div className="space-y-2">
        {sortedLinks.length === 0 ? (
          <div className="text-center py-8 bg-muted rounded-lg border-2 border-dashed border-border">
            <LinkIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No navigation items</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add Item" to get started</p>
          </div>
        ) : (
          sortedLinks.map((link, index) => (
            <NavItemEditor
              key={link.id}
              link={link}
              depth={0}
              index={index}
              totalItems={sortedLinks.length}
              maxDepth={maxDepth}
              onUpdate={(updates) => handleUpdateLink(index, updates)}
              onDelete={() => handleDeleteLink(index)}
              onMoveUp={() => handleMoveLink(index, 'up')}
              onMoveDown={() => handleMoveLink(index, 'down')}
              onAddChild={() => handleAddChild(index)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {/* Help text */}
      <div className="bg-accent rounded-lg p-3 text-sm text-primary">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li>Click the <Settings2 className="h-3 w-3 inline" /> icon to add badges, icons, or enable mega menus</li>
          <li>Click <Plus className="h-3 w-3 inline" /> on an item to add sub-items</li>
          <li>Enable mega menu on top-level items for rich dropdown layouts</li>
        </ul>
      </div>
    </div>
  );
}

export default NavigationBuilder;
