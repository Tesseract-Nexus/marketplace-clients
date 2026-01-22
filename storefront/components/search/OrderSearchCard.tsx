'use client';

import Link from 'next/link';
import { Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderSearchCardProps {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  itemCount: number;
  itemsSummary?: string;
  href: string;
  isSelected?: boolean;
  formatPrice: (price: number) => string;
  onClick?: () => void;
}

const statusConfig: Record<string, { icon: typeof Package; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  CONFIRMED: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmed' },
  PROCESSING: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Processing' },
  SHIPPED: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
  REFUNDED: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Refunded' },
};

export function OrderSearchCard({
  id,
  orderNumber,
  status,
  totalAmount,
  createdAt,
  itemCount,
  itemsSummary,
  href,
  isSelected,
  formatPrice,
  onClick,
}: OrderSearchCardProps) {
  const defaultStatus = statusConfig.PENDING!;
  const statusInfo = statusConfig[status] ?? defaultStatus;
  const StatusIcon = statusInfo.icon;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={href}
      data-id={id}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 transition-all duration-200 group',
        isSelected
          ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-l-2 border-blue-500'
          : 'hover:bg-gray-50/80 border-l-2 border-transparent'
      )}
    >
      {/* Order Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0 ring-1 ring-blue-200/50 group-hover:ring-blue-300 transition-all">
        <Package className="w-5 h-5 text-blue-600" />
      </div>

      {/* Order Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            #{orderNumber}
          </p>
          <span className={cn(
            'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
            statusInfo.bg,
            statusInfo.color
          )}>
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span>{formattedDate}</span>
          <span className="text-gray-300">•</span>
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          {itemsSummary && (
            <>
              <span className="text-gray-300">•</span>
              <span className="truncate max-w-[150px]">{itemsSummary}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(totalAmount)}
        </p>
      </div>

      {/* Arrow Indicator */}
      <div className={cn(
        'shrink-0 transition-all duration-200',
        isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
      )}>
        <ChevronRight className="w-5 h-5 text-blue-500" />
      </div>
    </Link>
  );
}
