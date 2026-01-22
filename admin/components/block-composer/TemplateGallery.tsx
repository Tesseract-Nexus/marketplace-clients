'use client';

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Copy, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// =============================================================================
// TEMPLATE DATA
// =============================================================================

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fashion' | 'electronics' | 'sports' | 'luxury' | 'marketplace' | 'content';
  thumbnail: string;
  blockCount: number;
  recommendedFor: string[];
  features: string[];
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'myntra-editorial',
    name: 'Myntra Editorial',
    description: 'Fashion-forward editorial layout with collection stories, lookbooks, and curated shopping experiences',
    category: 'fashion',
    thumbnail: '/thumbnails/templates/myntra-editorial.png',
    blockCount: 8,
    recommendedFor: ['Fashion', 'Apparel', 'Lifestyle'],
    features: ['Collection Stories', 'Lookbook Grid', 'Editorial Cards', 'Influencer Section'],
  },
  {
    id: 'flipkart-deals',
    name: 'Flipkart Deals',
    description: 'Deal-focused layout with countdown timers, flash sales, and campaign rails',
    category: 'electronics',
    thumbnail: '/thumbnails/templates/flipkart-deals.png',
    blockCount: 10,
    recommendedFor: ['Electronics', 'Multi-category', 'Flash Sales'],
    features: ['Deals Carousel', 'Countdown Timers', 'Campaign Rails', 'Stock Progress'],
  },
  {
    id: 'decathlon-activity',
    name: 'Decathlon Activity',
    description: 'Activity-based navigation for sports and outdoor retailers',
    category: 'sports',
    thumbnail: '/thumbnails/templates/decathlon-activity.png',
    blockCount: 7,
    recommendedFor: ['Sports', 'Outdoor', 'Fitness'],
    features: ['Activity Hub', 'Service Promos', 'Quiz Integration', 'Store Locator'],
  },
  {
    id: 'minimal-modern',
    name: 'Minimal Modern',
    description: 'Clean, minimal design focusing on product imagery and typography',
    category: 'luxury',
    thumbnail: '/thumbnails/templates/minimal-modern.png',
    blockCount: 5,
    recommendedFor: ['Luxury', 'Minimal Brands', 'Designer'],
    features: ['Full-bleed Hero', 'Minimal Grid', 'Clean Typography', 'White Space'],
  },
  {
    id: 'luxury-immersive',
    name: 'Luxury Immersive',
    description: 'High-end immersive experience with video heroes and parallax effects',
    category: 'luxury',
    thumbnail: '/thumbnails/templates/luxury-immersive.png',
    blockCount: 6,
    recommendedFor: ['High Fashion', 'Jewelry', 'Premium Brands'],
    features: ['Video Hero', 'Parallax Sections', 'Editorial Stories', 'Brand Showcase'],
  },
  {
    id: 'marketplace-dense',
    name: 'Marketplace Dense',
    description: 'Dense product-focused layout for large catalogs and marketplaces',
    category: 'marketplace',
    thumbnail: '/thumbnails/templates/marketplace-dense.png',
    blockCount: 9,
    recommendedFor: ['Marketplace', 'Large Catalogs', 'Multi-vendor'],
    features: ['Category Grid', 'Product Carousels', 'Banner Strips', 'Brand Showcase'],
  },
  {
    id: 'content-commerce',
    name: 'Content Commerce',
    description: 'Editorial-first approach with embedded product recommendations',
    category: 'content',
    thumbnail: '/thumbnails/templates/content-commerce.png',
    blockCount: 7,
    recommendedFor: ['Content Marketing', 'Blogs', 'Education'],
    features: ['Editorial Cards', 'UGC Gallery', 'Testimonials', 'Newsletter'],
  },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  fashion: { label: 'Fashion', icon: 'Shirt' },
  electronics: { label: 'Electronics', icon: 'Laptop' },
  sports: { label: 'Sports', icon: 'Dumbbell' },
  luxury: { label: 'Luxury', icon: 'Gem' },
  marketplace: { label: 'Marketplace', icon: 'Store' },
  content: { label: 'Content', icon: 'FileText' },
};

// =============================================================================
// TYPES
// =============================================================================

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateId: string) => void;
  currentTemplateId?: string;
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
// TEMPLATE CARD
// =============================================================================

interface TemplateCardProps {
  template: LayoutTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const categoryInfo = CATEGORY_LABELS[template.category];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-muted rounded-t-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-muted-foreground/30" />
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 p-1.5 bg-primary text-primary-foreground rounded-full">
            <Check className="w-4 h-4" />
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="gap-1">
            <DynamicIcon name={categoryInfo.icon} className="w-3 h-3" />
            {categoryInfo.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {template.blockCount} blocks
          </span>
        </div>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {template.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="text-xs px-2 py-0.5 bg-muted rounded-full"
            >
              {feature}
            </span>
          ))}
          {template.features.length > 3 && (
            <span className="text-xs px-2 py-0.5 text-muted-foreground">
              +{template.features.length - 3} more
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// TEMPLATE GALLERY
// =============================================================================

export function TemplateGallery({
  open,
  onOpenChange,
  onSelect,
  currentTemplateId,
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    currentTemplateId || null
  );

  const filteredTemplates = useMemo(() => {
    let filtered = LAYOUT_TEMPLATES;

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.features.some((f) => f.toLowerCase().includes(query)) ||
          t.recommendedFor.some((r) => r.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const selectedTemplate = selectedTemplateId
    ? LAYOUT_TEMPLATES.find((t) => t.id === selectedTemplateId)
    : null;

  const handleApply = () => {
    if (selectedTemplateId) {
      onSelect(selectedTemplateId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-designed layout and customize it to fit your brand
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex gap-4 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
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
          {Object.entries(CATEGORY_LABELS).map(([id, info]) => (
            <Button
              key={id}
              variant={selectedCategory === id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(id)}
              className="shrink-0"
            >
              <DynamicIcon name={info.icon} className="w-4 h-4 mr-1.5" />
              {info.label}
            </Button>
          ))}
        </div>

        {/* Template Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={() => setSelectedTemplateId(template.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedTemplate ? (
                <>
                  Selected: <span className="font-medium">{selectedTemplate.name}</span>
                </>
              ) : (
                'Select a template to continue'
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!selectedTemplateId}>
                <Copy className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateGallery;
