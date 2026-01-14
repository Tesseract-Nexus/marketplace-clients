'use client';

import { Search, Package, FolderTree, ShoppingBag, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateType = 'initial' | 'min-chars' | 'no-results' | 'no-orders' | 'no-payments' | 'loading';

interface SearchEmptyStateProps {
  type: EmptyStateType;
  query?: string;
  tab?: string;
  className?: string;
}

const emptyStates: Record<EmptyStateType, {
  icon: typeof Search;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string | ((query?: string) => string);
}> = {
  initial: {
    icon: Sparkles,
    iconColor: 'text-[var(--tenant-primary)]',
    iconBg: 'bg-[var(--tenant-primary)]/10',
    title: 'Start searching',
    description: 'Type to search products, categories, and more...',
  },
  'min-chars': {
    icon: Search,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-100',
    title: 'Keep typing...',
    description: 'Enter at least 2 characters to search',
  },
  'no-results': {
    icon: Search,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-100',
    title: 'No results found',
    description: (query) => `We couldn't find anything matching "${query}"`,
  },
  'no-orders': {
    icon: ShoppingBag,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    title: 'No orders found',
    description: (query) => query
      ? `No orders matching "${query}"`
      : 'You haven\'t placed any orders yet',
  },
  'no-payments': {
    icon: CreditCard,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    title: 'No payments found',
    description: (query) => query
      ? `No payments matching "${query}"`
      : 'No payment history available',
  },
  loading: {
    icon: Search,
    iconColor: 'text-[var(--tenant-primary)]',
    iconBg: 'bg-[var(--tenant-primary)]/10',
    title: 'Searching...',
    description: 'Looking for results...',
  },
};

export function SearchEmptyState({ type, query, className }: SearchEmptyStateProps) {
  const state = emptyStates[type];
  const Icon = state.icon;
  const description = typeof state.description === 'function'
    ? state.description(query)
    : state.description;

  return (
    <div className={cn('py-12 px-4 text-center', className)}>
      <div className={cn(
        'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center',
        state.iconBg
      )}>
        <Icon className={cn('w-8 h-8', state.iconColor)} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {state.title}
      </h3>
      <p className="text-sm text-gray-500 max-w-[300px] mx-auto">
        {description}
      </p>
    </div>
  );
}

// Loading skeleton for search results
export function SearchResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse space-y-1 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-14 h-14 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
          <div className="w-16 h-6 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}
