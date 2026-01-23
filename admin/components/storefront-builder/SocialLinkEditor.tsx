'use client';

import React from 'react';
import { Trash2, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorefrontSocialLink } from '@/lib/api/types';

interface SocialLinkEditorProps {
  social: StorefrontSocialLink;
  onUpdate: (updates: Partial<StorefrontSocialLink>) => void;
  onDelete: () => void;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/yourhandle' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/yourcompany' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
  { value: 'tiktok', label: 'TikTok', icon: null, placeholder: 'https://tiktok.com/@yourhandle' },
  { value: 'pinterest', label: 'Pinterest', icon: null, placeholder: 'https://pinterest.com/yourprofile' },
] as const;

export function SocialLinkEditor({ social, onUpdate, onDelete }: SocialLinkEditorProps) {
  const platformInfo = SOCIAL_PLATFORMS.find(p => p.value === social.platform);
  const Icon = platformInfo?.icon;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
      <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
        {Icon ? (
          <Icon className="h-5 w-5 text-muted-foreground" />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {social.platform.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 grid grid-cols-3 gap-3">
        <select
          value={social.platform}
          onChange={(e) => onUpdate({ platform: e.target.value as StorefrontSocialLink['platform'] })}
          className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
        >
          {SOCIAL_PLATFORMS.map((platform) => (
            <option key={platform.value} value={platform.value}>
              {platform.label}
            </option>
          ))}
        </select>

        <input
          type="url"
          value={social.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder={platformInfo?.placeholder || 'https://...'}
          className="col-span-2 w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SocialLinksManagerProps {
  socialLinks: StorefrontSocialLink[];
  onChange: (links: StorefrontSocialLink[]) => void;
}

export function SocialLinksManager({ socialLinks, onChange }: SocialLinksManagerProps) {
  const addSocialLink = () => {
    const usedPlatforms = socialLinks.map(s => s.platform);
    const availablePlatform = SOCIAL_PLATFORMS.find(p => !usedPlatforms.includes(p.value));

    if (!availablePlatform) return;

    onChange([
      ...socialLinks,
      {
        id: `social-${Date.now()}`,
        platform: availablePlatform.value as StorefrontSocialLink['platform'],
        url: '',
      },
    ]);
  };

  const updateSocialLink = (index: number, updates: Partial<StorefrontSocialLink>) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteSocialLink = (index: number) => {
    onChange(socialLinks.filter((_, i) => i !== index));
  };

  const canAddMore = socialLinks.length < SOCIAL_PLATFORMS.length;

  return (
    <div className="space-y-3">
      {socialLinks.length === 0 ? (
        <div className="text-center py-6 bg-muted rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">No social links added yet</p>
          <Button variant="outline" size="sm" onClick={addSocialLink}>
            Add Social Link
          </Button>
        </div>
      ) : (
        <>
          {socialLinks.map((social, index) => (
            <SocialLinkEditor
              key={social.id}
              social={social}
              onUpdate={(updates) => updateSocialLink(index, updates)}
              onDelete={() => deleteSocialLink(index)}
            />
          ))}
          {canAddMore && (
            <Button variant="outline" size="sm" onClick={addSocialLink} className="w-full">
              Add Another Social Link
            </Button>
          )}
        </>
      )}
    </div>
  );
}
