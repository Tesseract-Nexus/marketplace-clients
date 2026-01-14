'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  AlertCircle,
  Store,
  Search,
  CheckCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdPlacement } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface StorefrontWithPlacements {
  id: string;
  name: string;
  slug: string;
  placements: AdPlacement[];
  totalPlacements: number;
  activePlacements: number;
  avgCpm: number;
  avgCtr: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function StorefrontCard({ storefront }: { storefront: StorefrontWithPlacements }) {
  return (
    <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{storefront.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {storefront.slug}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
            <div className="text-right">
              <p className="text-sm font-medium">{storefront.totalPlacements} placements</p>
              <p className="text-xs text-muted-foreground">{storefront.activePlacements} active</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StorefrontsPage() {
  const [storefronts, setStorefronts] = useState<StorefrontWithPlacements[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [storefrontsRes, placementsRes] = await Promise.all([
        adManagerService.getEligibleStorefronts(),
        adManagerService.getPlacements(),
      ]);

      if (storefrontsRes.success && placementsRes.success) {
        // Group placements by storefront
        const storefrontMap = new Map<string, StorefrontWithPlacements>();

        storefrontsRes.data.forEach((sf) => {
          storefrontMap.set(sf.id, {
            ...sf,
            placements: [],
            totalPlacements: 0,
            activePlacements: 0,
            avgCpm: 0,
            avgCtr: 0,
          });
        });

        placementsRes.data.forEach((placement) => {
          const sf = storefrontMap.get(placement.storefrontId);
          if (sf) {
            sf.placements.push(placement);
            sf.totalPlacements++;
            if (placement.isActive) {
              sf.activePlacements++;
            }
          }
        });

        // Calculate averages
        storefrontMap.forEach((sf) => {
          if (sf.placements.length > 0) {
            sf.avgCpm =
              sf.placements.reduce((sum, p) => sum + p.baseCpm, 0) / sf.placements.length;
            sf.avgCtr =
              sf.placements.reduce((sum, p) => sum + (p.avgCtr || 0), 0) / sf.placements.length;
          }
        });

        setStorefronts(Array.from(storefrontMap.values()));
      }
    } catch (err) {
      console.error('Failed to fetch storefronts:', err);
      setError('Failed to load storefronts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStorefronts = storefronts.filter(
    (sf) =>
      sf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sf.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PermissionGate permission={Permissions.ADS_PLACEMENTS_VIEW} fallback="styled">
      <div className="min-h-screen bg-background p-8">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Storefronts"
            description="View available storefronts for ad placement"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Ad Manager', href: '/ad-manager' },
              { label: 'Storefronts' },
            ]}
            actions={
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
            }
          />

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search storefronts by name or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Storefronts List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStorefronts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {searchQuery ? 'No storefronts match your search' : 'No storefronts available'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'There are no storefronts available for advertising at the moment.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStorefronts.map((storefront) => (
                <StorefrontCard key={storefront.id} storefront={storefront} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
