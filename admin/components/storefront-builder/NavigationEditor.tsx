'use client';

import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Plus,
  ExternalLink,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { StorefrontNavLink } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface NavigationEditorProps {
  links: StorefrontNavLink[];
  onChange: (links: StorefrontNavLink[]) => void;
  disabled?: boolean;
  maxLinks?: number;
}

export function NavigationEditor({
  links,
  onChange,
  disabled,
  maxLinks = 8,
}: NavigationEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setEditingId(newLink.id);
  };

  const handleUpdateLink = (linkId: string, updates: Partial<StorefrontNavLink>) => {
    const updated = links.map((l) =>
      l.id === linkId ? { ...l, ...updates } : l
    );
    onChange(updated);
  };

  const handleDeleteLink = (linkId: string) => {
    const updated = links.filter((l) => l.id !== linkId);
    // Re-calculate positions
    const reordered = updated.map((l, index) => ({ ...l, position: index }));
    onChange(reordered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...links];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reordered = updated.map((l, i) => ({ ...l, position: i }));
    onChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === links.length - 1) return;
    const updated = [...links];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reordered = updated.map((l, i) => ({ ...l, position: i }));
    onChange(reordered);
  };

  // Sort links by position
  const sortedLinks = [...links].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">Navigation Links</h4>
          <p className="text-sm text-muted-foreground">
            {links.length} of {maxLinks} links used
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddLink}
          disabled={disabled || links.length >= maxLinks}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
            'bg-muted hover:bg-muted transition-colors',
            (disabled || links.length >= maxLinks) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus className="h-4 w-4" />
          Add Link
        </button>
      </div>

      {/* Links list */}
      <div className="space-y-2">
        {sortedLinks.length === 0 ? (
          <div className="text-center py-8 bg-muted rounded-lg border-2 border-dashed border-border">
            <LinkIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No navigation links</p>
          </div>
        ) : (
          sortedLinks.map((link, index) => (
            <div
              key={link.id}
              className={cn(
                'flex items-center gap-3 p-3 bg-card rounded-lg border border-border',
                'hover:border-border transition-all',
                editingId === link.id && 'ring-2 ring-purple-500/20 border-purple-500'
              )}
            >
              {/* Drag handle */}
              <div className="text-gray-300 cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Link fields */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleUpdateLink(link.id, { label: e.target.value })}
                  onFocus={() => setEditingId(link.id)}
                  onBlur={() => setEditingId(null)}
                  disabled={disabled}
                  placeholder="Link label"
                  className={cn(
                    'px-3 py-1.5 rounded-lg border border-border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
                    disabled && 'opacity-50 cursor-not-allowed bg-muted'
                  )}
                />
                <div className="relative">
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => handleUpdateLink(link.id, { href: e.target.value })}
                    onFocus={() => setEditingId(link.id)}
                    onBlur={() => setEditingId(null)}
                    disabled={disabled}
                    placeholder="/path or https://..."
                    className={cn(
                      'w-full px-3 py-1.5 rounded-lg border border-border text-sm pr-8',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
                      disabled && 'opacity-50 cursor-not-allowed bg-muted'
                    )}
                  />
                  {link.isExternal && (
                    <ExternalLink className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* External link toggle */}
              <button
                type="button"
                onClick={() => handleUpdateLink(link.id, { isExternal: !link.isExternal })}
                disabled={disabled}
                title={link.isExternal ? 'Opens in new tab' : 'Opens in same tab'}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  link.isExternal
                    ? 'bg-purple-50 text-purple-500'
                    : 'hover:bg-muted text-muted-foreground',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ExternalLink className="h-4 w-4" />
              </button>

              {/* Reorder buttons */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
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
                  onClick={() => handleMoveDown(index)}
                  disabled={disabled || index === links.length - 1}
                  className={cn(
                    'p-0.5 hover:bg-muted rounded transition-colors',
                    (disabled || index === links.length - 1) && 'opacity-30 cursor-not-allowed'
                  )}
                >
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDeleteLink(link.id)}
                disabled={disabled}
                className={cn(
                  'p-1.5 rounded-lg hover:bg-red-50 transition-colors',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NavigationEditor;
