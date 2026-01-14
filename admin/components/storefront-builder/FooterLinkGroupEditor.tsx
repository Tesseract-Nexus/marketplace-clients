'use client';

import React, { useState } from 'react';
import { Trash2, Plus, GripVertical, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorefrontNavLink, StorefrontFooterLinkGroup } from '@/lib/api/types';

interface FooterLinkEditorProps {
  link: StorefrontNavLink;
  onUpdate: (updates: Partial<StorefrontNavLink>) => void;
  onDelete: () => void;
}

function FooterLinkEditor({ link, onUpdate, onDelete }: FooterLinkEditorProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-card rounded border border-border">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

      <input
        type="text"
        value={link.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Link text"
        className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
      />

      <input
        type="text"
        value={link.href}
        onChange={(e) => onUpdate({ href: e.target.value })}
        placeholder="/page or https://..."
        className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
      />

      <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <input
          type="checkbox"
          checked={link.isExternal}
          onChange={(e) => onUpdate({ isExternal: e.target.checked })}
          className="rounded border-border text-purple-600 focus:ring-purple-500"
        />
        <ExternalLink className="h-3 w-3" />
      </label>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface FooterLinkGroupEditorProps {
  group: StorefrontFooterLinkGroup;
  onUpdate: (updates: Partial<StorefrontFooterLinkGroup>) => void;
  onDelete: () => void;
}

export function FooterLinkGroupEditor({ group, onUpdate, onDelete }: FooterLinkGroupEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const addLink = () => {
    const newLink: StorefrontNavLink = {
      id: `link-${Date.now()}`,
      label: '',
      href: '',
      isExternal: false,
      position: group.links.length,
    };
    onUpdate({ links: [...group.links, newLink] });
  };

  const updateLink = (index: number, updates: Partial<StorefrontNavLink>) => {
    const updatedLinks = [...group.links];
    updatedLinks[index] = { ...updatedLinks[index], ...updates };
    onUpdate({ links: updatedLinks });
  };

  const deleteLink = (index: number) => {
    onUpdate({ links: group.links.filter((_, i) => i !== index) });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-muted border-b border-border">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

        <input
          type="text"
          value={group.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Column Title"
          className="flex-1 px-3 py-1.5 text-sm font-medium border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
        />

        <span className="text-xs text-muted-foreground shrink-0">
          {group.links.length} link{group.links.length !== 1 ? 's' : ''}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 w-7 p-0 shrink-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2 bg-muted/50">
          {group.links.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No links in this column
            </div>
          ) : (
            group.links.map((link, index) => (
              <FooterLinkEditor
                key={link.id}
                link={link}
                onUpdate={(updates) => updateLink(index, updates)}
                onDelete={() => deleteLink(index)}
              />
            ))
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={addLink}
            className="w-full mt-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Link
          </Button>
        </div>
      )}
    </div>
  );
}

interface FooterLinkGroupsManagerProps {
  linkGroups: StorefrontFooterLinkGroup[];
  onChange: (groups: StorefrontFooterLinkGroup[]) => void;
}

export function FooterLinkGroupsManager({ linkGroups, onChange }: FooterLinkGroupsManagerProps) {
  const addGroup = () => {
    const newGroup: StorefrontFooterLinkGroup = {
      id: `group-${Date.now()}`,
      title: 'New Column',
      links: [],
    };
    onChange([...linkGroups, newGroup]);
  };

  const updateGroup = (index: number, updates: Partial<StorefrontFooterLinkGroup>) => {
    const updated = [...linkGroups];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteGroup = (index: number) => {
    onChange(linkGroups.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {linkGroups.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">No footer columns added yet</p>
          <Button variant="outline" size="sm" onClick={addGroup}>
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
        </div>
      ) : (
        <>
          {linkGroups.map((group, index) => (
            <FooterLinkGroupEditor
              key={group.id}
              group={group}
              onUpdate={(updates) => updateGroup(index, updates)}
              onDelete={() => deleteGroup(index)}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addGroup} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
        </>
      )}
    </div>
  );
}
