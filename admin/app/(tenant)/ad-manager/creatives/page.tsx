'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  List,
  Search,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { useDialog } from '@/contexts/DialogContext';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdCreative } from '@/lib/api/types';
import { cn } from '@/lib/utils';

// Type options for filter
const typeOptions = [
  { value: 'ALL', label: 'All Types' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'NATIVE', label: 'Native' },
];

// Status options for filter
const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const typeIcons: Record<string, React.ElementType> = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  CAROUSEL: LayoutGrid,
  BANNER: ImageIcon,
  NATIVE: ImageIcon,
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success-muted text-success-foreground',
  DRAFT: 'bg-muted text-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function CreativeCard({
  creative,
  onDelete,
  viewMode,
}: {
  creative: AdCreative;
  onDelete: (id: string) => void;
  viewMode: 'grid' | 'list';
}) {
  const TypeIcon = typeIcons[creative.type] || ImageIcon;

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow group">
        <div className="w-24 h-16 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {creative.primaryImageUrl ? (
            <Image
              src={creative.primaryImageUrl}
              alt={creative.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{creative.name}</h3>
          <p className="text-sm text-muted-foreground">
            {creative.width} x {creative.height}px
          </p>
        </div>
        <Badge className={cn(statusColors[creative.status] || statusColors.DRAFT)}>
          {creative.status}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{creative.type}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/ad-manager/creatives/${creative.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/ad-manager/creatives/${creative.id}/edit`}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(creative.id)}
                className="text-error focus:text-error"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative aspect-video bg-muted">
        {creative.primaryImageUrl ? (
          <Image
            src={creative.primaryImageUrl}
            alt={creative.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={cn(statusColors[creative.status] || statusColors.DRAFT)}>
            {creative.status}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/ad-manager/creatives/${creative.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Link>
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/ad-manager/creatives/${creative.id}/edit`}>
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{creative.name}</h3>
            <p className="text-sm text-muted-foreground">
              {creative.width} x {creative.height}px
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TypeIcon className="w-4 h-4" />
            <span className="text-xs">{creative.type}</span>
          </div>
        </div>
        {creative.headline && (
          <p className="text-sm text-muted-foreground mt-2 truncate">{creative.headline}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Created {formatDate(creative.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}

export default function CreativesPage() {
  const { showAlert, showConfirm } = useDialog();
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchCreatives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adManagerService.getCreatives({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      if (response.success) {
        let filtered = response.data;
        if (searchQuery) {
          const search = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(search) ||
              c.headline?.toLowerCase().includes(search)
          );
        }
        setCreatives(filtered);
      } else {
        throw new Error('Failed to fetch creatives');
      }
    } catch (err) {
      console.error('Failed to fetch creatives:', err);
      setError('Failed to load creatives. Please try again.');
      setCreatives([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Creative',
      message: 'Are you sure you want to delete this creative? This action cannot be undone.',
    });

    if (!confirmed) return;

    try {
      const response = await adManagerService.deleteCreative(id);
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Creative deleted successfully!' });
        fetchCreatives();
      }
    } catch (err) {
      console.error('Failed to delete creative:', err);
      await showAlert({ title: 'Error', message: 'Failed to delete creative. Please try again.' });
    }
  };

  return (
    <PermissionGate permission={Permissions.ADS_CREATIVES_VIEW} fallback="styled">
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Creative Library"
            description="Manage your advertising creative assets"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Ad Manager', href: '/ad-manager' },
              { label: 'Creatives' },
            ]}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchCreatives} disabled={loading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                  Refresh
                </Button>
                <Button asChild>
                  <Link href="/ad-manager/creatives/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Creative
                  </Link>
                </Button>
              </div>
            }
          />

          <div>
          {/* Error Banner */}
          {error && (
            <div className="bg-error-muted border border-error/30 rounded-lg p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
              <p className="text-error">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCreatives} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search creatives..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-40">
                  <Select value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
                </div>
                <div className="w-full md:w-40">
                  <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                </div>
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creatives */}
          {loading ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-3'
            )}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : creatives.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No creatives match your filters'
                  : 'No creatives yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Upload your first creative asset to start building campaigns.'}
              </p>
              {!(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <Button asChild>
                  <Link href="/ad-manager/creatives/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Creative
                  </Link>
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creatives.map((creative) => (
                <CreativeCard
                  key={creative.id}
                  creative={creative}
                  onDelete={handleDelete}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {creatives.map((creative) => (
                <CreativeCard
                  key={creative.id}
                  creative={creative}
                  onDelete={handleDelete}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
