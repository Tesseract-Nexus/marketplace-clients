'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Truck,
  RotateCcw,
  Award,
  CheckCircle2,
  Star,
  ThumbsUp,
  ThumbsDown,
  BadgeCheck,
  Lock,
  CreditCard,
  Clock,
  Package,
  Gift,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface TrustBadge {
  id: string;
  type: 'verified' | 'certified' | 'award' | 'partner' | 'security';
  name: string;
  image?: string;
  description?: string;
  link?: string;
}

export interface PolicySnippet {
  type: 'shipping' | 'returns' | 'warranty' | 'payment' | 'support';
  title: string;
  summary: string;
  details?: string;
  icon?: React.ReactNode;
  link?: string;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedPurchases: number;
  recommendPercentage: number;
  highlights: ReviewHighlight[];
}

export interface ReviewHighlight {
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  count: number;
  phrases: string[];
}

// =============================================================================
// TRUST SIGNALS STRIP
// =============================================================================

interface TrustSignalsStripProps {
  badges?: TrustBadge[];
  policies?: PolicySnippet[];
  compact?: boolean;
  className?: string;
}

export function TrustSignalsStrip({
  badges = [],
  policies = [],
  compact = false,
  className,
}: TrustSignalsStripProps) {
  if (compact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-4 text-sm text-muted-foreground', className)}>
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="w-4 h-4" />
          <span>Free Shipping</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" />
          <span>Easy Returns</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {policies.map((policy) => (
        <PolicyCard key={policy.type} policy={policy} />
      ))}
      {badges.length > 0 && (
        <div className="col-span-full mt-4">
          <BadgesRow badges={badges} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// POLICY CARD
// =============================================================================

function PolicyCard({ policy }: { policy: PolicySnippet }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const icons = {
    shipping: <Truck className="w-5 h-5" />,
    returns: <RotateCcw className="w-5 h-5" />,
    warranty: <Shield className="w-5 h-5" />,
    payment: <CreditCard className="w-5 h-5" />,
    support: <Clock className="w-5 h-5" />,
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          {policy.icon || icons[policy.type]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{policy.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{policy.summary}</p>
          {policy.details && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
              >
                Learn more
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-xs text-muted-foreground mt-2 overflow-hidden"
                  >
                    {policy.details}
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// BADGES ROW
// =============================================================================

function BadgesRow({ badges }: { badges: TrustBadge[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-4 border-t border-b">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center gap-2 text-sm text-muted-foreground"
          title={badge.description}
        >
          {badge.image ? (
            <Image
              src={badge.image}
              alt={badge.name}
              width={32}
              height={32}
              className="object-contain"
            />
          ) : (
            <BadgeCheck className="w-5 h-5 text-primary" />
          )}
          <span>{badge.name}</span>
          {badge.link && (
            <Link href={badge.link} className="text-primary">
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// REVIEW SUMMARY COMPONENT
// =============================================================================

interface ReviewSummaryCardProps {
  summary: ReviewSummary;
  productName: string;
  className?: string;
}

export function ReviewSummaryCard({
  summary,
  productName,
  className,
}: ReviewSummaryCardProps) {
  const maxCount = Math.max(...Object.values(summary.distribution));

  return (
    <div className={cn('p-6 bg-muted/30 rounded-2xl', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Rating Overview */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <div className="text-5xl font-bold">{summary.averageRating.toFixed(1)}</div>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-5 h-5',
                      star <= Math.round(summary.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {summary.totalReviews.toLocaleString()} reviews
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <ThumbsUp className="w-4 h-4" />
            {summary.recommendPercentage}% recommend this product
          </div>

          {/* Verified Badge */}
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center md:justify-start gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            {summary.verifiedPurchases.toLocaleString()} verified purchases
          </p>
        </div>

        {/* Right: Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = summary.distribution[rating as keyof typeof summary.distribution];
            const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-8 text-sm font-medium">{rating}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-muted-foreground text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Highlights */}
      {summary.highlights.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-semibold mb-4">What customers are saying</h4>
          <div className="flex flex-wrap gap-2">
            {summary.highlights.map((highlight) => (
              <div
                key={highlight.category}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                  highlight.sentiment === 'positive' && 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400',
                  highlight.sentiment === 'neutral' && 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
                  highlight.sentiment === 'negative' && 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                )}
              >
                {highlight.sentiment === 'positive' && <ThumbsUp className="w-3 h-3" />}
                {highlight.sentiment === 'negative' && <ThumbsDown className="w-3 h-3" />}
                <span>{highlight.category}</span>
                <span className="text-xs opacity-70">({highlight.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SECURITY BADGES
// =============================================================================

export function SecurityBadges({ className }: { className?: string }) {
  const badges = [
    { icon: Lock, label: 'SSL Encrypted' },
    { icon: CreditCard, label: 'Secure Payment' },
    { icon: Shield, label: 'Buyer Protection' },
  ];

  return (
    <div className={cn('flex items-center gap-4 text-xs text-muted-foreground', className)}>
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1">
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// BRAND AUTHENTICITY BADGE
// =============================================================================

interface BrandAuthenticityProps {
  brand: {
    name: string;
    logo?: string;
    verified: boolean;
    authorizedSeller?: boolean;
  };
  className?: string;
}

export function BrandAuthenticityBadge({ brand, className }: BrandAuthenticityProps) {
  if (!brand.verified && !brand.authorizedSeller) return null;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg text-sm',
      className
    )}>
      <BadgeCheck className="w-4 h-4" />
      <span>
        {brand.authorizedSeller ? 'Authorized' : 'Verified'} {brand.name} Seller
      </span>
    </div>
  );
}

// =============================================================================
// DELIVERY PROMISE
// =============================================================================

interface DeliveryPromiseProps {
  estimatedDate: string;
  freeShipping?: boolean;
  expressAvailable?: boolean;
  storePickup?: {
    available: boolean;
    storeName?: string;
    readyIn?: string;
  };
  className?: string;
}

export function DeliveryPromise({
  estimatedDate,
  freeShipping,
  expressAvailable,
  storePickup,
  className,
}: DeliveryPromiseProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Standard Delivery */}
      <div className="flex items-start gap-3">
        <Truck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">
            {freeShipping ? 'FREE Delivery' : 'Standard Delivery'}
          </p>
          <p className="text-sm text-muted-foreground">
            Get it by <span className="font-medium text-foreground">{estimatedDate}</span>
          </p>
        </div>
      </div>

      {/* Express Delivery */}
      {expressAvailable && (
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Express Delivery Available</p>
            <p className="text-sm text-muted-foreground">
              Order within 2 hours for next-day delivery
            </p>
          </div>
        </div>
      )}

      {/* Store Pickup */}
      {storePickup?.available && (
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Store Pickup</p>
            <p className="text-sm text-muted-foreground">
              {storePickup.storeName && `${storePickup.storeName} • `}
              {storePickup.readyIn || 'Ready in 2 hours'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// WARRANTY INFO
// =============================================================================

interface WarrantyInfoProps {
  warranty: {
    duration: string;
    type: 'manufacturer' | 'extended' | 'lifetime';
    coverage: string[];
    extendedAvailable?: boolean;
  };
  className?: string;
}

export function WarrantyInfo({ warranty, className }: WarrantyInfoProps) {
  return (
    <div className={cn('p-4 bg-muted/50 rounded-lg', className)}>
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">
            {warranty.duration} {warranty.type === 'manufacturer' ? 'Manufacturer' :
             warranty.type === 'lifetime' ? 'Lifetime' : 'Extended'} Warranty
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {warranty.coverage.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
          {warranty.extendedAvailable && (
            <button className="mt-3 text-sm text-primary hover:underline flex items-center gap-1">
              <Info className="w-3 h-3" />
              Add extended protection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DEFAULT POLICIES
// =============================================================================

export const DEFAULT_POLICIES: PolicySnippet[] = [
  {
    type: 'shipping',
    title: 'Free Shipping',
    summary: 'On orders over $50',
    details: 'Standard shipping takes 3-5 business days. Express options available at checkout.',
  },
  {
    type: 'returns',
    title: 'Easy Returns',
    summary: '30-day return policy',
    details: 'Return any unused item within 30 days for a full refund. Free returns on all orders.',
  },
  {
    type: 'warranty',
    title: 'Warranty Included',
    summary: '1-year manufacturer warranty',
    details: 'All products include a 1-year warranty against defects. Extended protection available.',
  },
  {
    type: 'payment',
    title: 'Secure Payment',
    summary: 'Multiple payment options',
    details: 'We accept all major credit cards, PayPal, and buy-now-pay-later options.',
  },
];

export default TrustSignalsStrip;
