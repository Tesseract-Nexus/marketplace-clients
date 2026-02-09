'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, Tag, Percent, ArrowRight, Clock, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant, useMarketingConfig } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface PersonalizedOffer {
  id: string;
  type: 'COUPON' | 'PRODUCT' | 'CATEGORY' | 'BUNDLE';
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
  code?: string;
  expiresAt?: string;
  priority: number;
}

interface PersonalizedOffersProps {
  limit?: number;
  title?: string;
  className?: string;
}

// ========================================
// Component
// ========================================

export function PersonalizedOffers({
  limit = 4,
  title = 'Offers for You',
  className,
}: PersonalizedOffersProps) {
  const { tenant } = useTenant();
  const marketingConfig = useMarketingConfig();
  const { customer, isAuthenticated } = useAuthStore();
  const [offers, setOffers] = useState<PersonalizedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Don't render if personalized offers are disabled
  if (!marketingConfig.enablePersonalizedOffers) {
    return null;
  }

  useEffect(() => {
    const fetchOffers = async () => {
      if (!tenant) return;

      setIsLoading(true);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant.id,
          'X-Storefront-ID': tenant.storefrontId,
        };

        const response = await fetch(`/api/offers?limit=${limit}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          // Return sample offers if endpoint not available
          setOffers(getSampleOffers());
          return;
        }

        const data = await response.json();
        setOffers(data.offers || data || []);
      } catch (error) {
        console.error('Failed to fetch personalized offers:', error);
        setOffers(getSampleOffers());
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [tenant, isAuthenticated, limit]);

  if (offers.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={cn('', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tenant-primary to-tenant-secondary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated
                ? 'Curated just for you'
                : 'Sign in for personalized recommendations'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/offers" className="gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer, index) => (
            <OfferCard key={offer.id} offer={offer} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// Offer Card
// ========================================

function OfferCard({ offer, index }: { offer: PersonalizedOffer; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (offer.code) {
      navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getOfferIcon = () => {
    switch (offer.type) {
      case 'COUPON':
        return Percent;
      case 'BUNDLE':
        return Gift;
      default:
        return Tag;
    }
  };

  const Icon = getOfferIcon();
  const hasExpiry = offer.expiresAt && new Date(offer.expiresAt) > new Date();
  const daysUntilExpiry = hasExpiry
    ? Math.ceil((new Date(offer.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Image */}
      {offer.imageUrl ? (
        <Link href={offer.linkUrl} className="block relative aspect-[16/10] overflow-hidden">
          <Image
            src={offer.imageUrl}
            alt={offer.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {offer.discountValue && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`}
            </Badge>
          )}
        </Link>
      ) : (
        <div className="relative aspect-[16/10] bg-gradient-to-br from-tenant-primary/10 to-tenant-secondary/10 flex items-center justify-center">
          <Icon className="h-12 w-12 text-tenant-primary/50" />
          {offer.discountValue && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`}
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <Link href={offer.linkUrl}>
          <h3 className="font-semibold mb-1 group-hover:text-tenant-primary transition-colors line-clamp-1">
            {offer.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {offer.description}
        </p>

        {/* Coupon Code */}
        {offer.code && (
          <button
            onClick={handleCopyCode}
            className={cn(
              'w-full py-2 px-3 rounded-lg border-2 border-dashed text-sm font-mono font-semibold transition-all',
              copied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-tenant-primary/30 hover:border-tenant-primary hover:bg-tenant-primary/5'
            )}
          >
            {copied ? 'Copied!' : offer.code}
          </button>
        )}

        {/* Expiry */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-600">
            <Clock className="h-3.5 w-3.5" />
            {daysUntilExpiry === 0
              ? 'Expires today'
              : daysUntilExpiry === 1
              ? 'Expires tomorrow'
              : `${daysUntilExpiry} days left`}
          </div>
        )}

        {/* CTA */}
        {!offer.code && (
          <Button
            asChild
            variant="tenant-outline"
            size="sm"
            className="w-full mt-3"
          >
            <Link href={offer.linkUrl}>
              View Offer
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ========================================
// Sample Offers (fallback)
// ========================================

function getSampleOffers(): PersonalizedOffer[] {
  return [
    {
      id: 'sample-1',
      type: 'COUPON',
      title: 'New Customer Discount',
      description: 'Get 10% off your first order',
      discountValue: 10,
      discountType: 'percentage',
      code: 'WELCOME10',
      linkUrl: '/products',
      priority: 1,
    },
    {
      id: 'sample-2',
      type: 'CATEGORY',
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50',
      linkUrl: '/products',
      priority: 2,
    },
    {
      id: 'sample-3',
      type: 'BUNDLE',
      title: 'Bundle & Save',
      description: 'Buy 2 get 1 free on selected items',
      discountValue: 33,
      discountType: 'percentage',
      linkUrl: '/products',
      priority: 3,
    },
    {
      id: 'sample-4',
      type: 'PRODUCT',
      title: 'Flash Sale',
      description: 'Up to 40% off trending products',
      discountValue: 40,
      discountType: 'percentage',
      linkUrl: '/products',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 4,
    },
  ];
}
