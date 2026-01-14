'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSearchCardProps {
  id: string;
  name: string;
  brand?: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  inStock?: boolean;
  href: string;
  isSelected?: boolean;
  formatPrice: (price: number) => string;
  onClick?: () => void;
}

export function ProductSearchCard({
  id,
  name,
  brand,
  price,
  salePrice,
  imageUrl,
  inStock = true,
  href,
  isSelected,
  formatPrice,
  onClick,
}: ProductSearchCardProps) {
  const hasDiscount = salePrice && salePrice < price;
  const displayPrice = salePrice || price;

  return (
    <Link
      href={href}
      data-id={id}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 transition-all duration-200 group',
        isSelected
          ? 'bg-gradient-to-r from-[var(--tenant-primary)]/10 to-transparent border-l-2 border-[var(--tenant-primary)]'
          : 'hover:bg-gray-50/80 border-l-2 border-transparent'
      )}
    >
      {/* Product Image */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-200/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
        {/* Sale badge */}
        {hasDiscount && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
            SALE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[var(--tenant-primary)] transition-colors">
          {name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {brand && (
            <span className="text-xs text-gray-500">{brand}</span>
          )}
          {brand && <span className="text-gray-300">•</span>}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-sm font-semibold",
              hasDiscount ? "text-red-600" : "text-[var(--tenant-primary)]"
            )}>
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stock Status */}
      <div className="shrink-0">
        {inStock ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            In Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <X className="w-3 h-3" />
            Out of Stock
          </span>
        )}
      </div>
    </Link>
  );
}
