'use client';

import Link from 'next/link';
import { FolderTree, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySearchCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  href: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CategorySearchCard({
  id,
  name,
  description,
  productCount = 0,
  href,
  isSelected,
  onClick,
}: CategorySearchCardProps) {
  return (
    <Link
      href={href}
      data-id={id}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 transition-all duration-200 group',
        isSelected
          ? 'bg-gradient-to-r from-purple-500/10 to-transparent border-l-2 border-purple-500'
          : 'hover:bg-gray-50/80 border-l-2 border-transparent'
      )}
    >
      {/* Category Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shrink-0 ring-1 ring-purple-200/50 group-hover:ring-purple-300 transition-all">
        <FolderTree className="w-5 h-5 text-purple-600" />
      </div>

      {/* Category Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
          {name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {description ? (
            <span className="truncate block">{description}</span>
          ) : (
            <span>Browse {productCount} products</span>
          )}
        </p>
      </div>

      {/* Arrow Indicator */}
      <div className={cn(
        'shrink-0 transition-all duration-200',
        isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
      )}>
        <ChevronRight className="w-5 h-5 text-purple-500" />
      </div>
    </Link>
  );
}
