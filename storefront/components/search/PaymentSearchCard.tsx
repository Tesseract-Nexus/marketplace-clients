'use client';

import Link from 'next/link';
import { CreditCard, CheckCircle2, Clock, XCircle, RefreshCw, ChevronRight, Smartphone, Wallet, Building2, Banknote, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentSearchCardProps {
  id: string;
  orderId: string;
  orderNumber: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  href: string;
  isSelected?: boolean;
  formatPrice: (price: number) => string;
  onClick?: () => void;
}

const statusConfig: Record<string, { icon: typeof CreditCard; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  COMPLETED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Paid' },
  FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
  REFUNDED: { icon: RefreshCw, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Refunded' },
};

// Payment method icons using Lucide icons instead of emojis
const methodIcons: Record<string, LucideIcon> = {
  card: CreditCard,
  stripe: CreditCard,
  razorpay: CreditCard,
  upi: Smartphone,
  wallet: Wallet,
  bank: Building2,
  cod: Banknote,
};

export function PaymentSearchCard({
  id,
  orderNumber,
  transactionId,
  status,
  amount,
  paymentMethod,
  createdAt,
  href,
  isSelected,
  formatPrice,
  onClick,
}: PaymentSearchCardProps) {
  const defaultStatus = statusConfig.PENDING!;
  const statusInfo = statusConfig[status] ?? defaultStatus;
  const StatusIcon = statusInfo.icon;
  const MethodIcon = methodIcons[paymentMethod?.toLowerCase()] || CreditCard;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Mask transaction ID for display
  const maskedTxnId = transactionId
    ? transactionId.length > 12
      ? `${transactionId.slice(0, 8)}...${transactionId.slice(-4)}`
      : transactionId
    : 'N/A';

  return (
    <Link
      href={href}
      data-id={id}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 transition-all duration-200 group',
        isSelected
          ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500'
          : 'hover:bg-gray-50/80 border-l-2 border-transparent'
      )}
    >
      {/* Payment Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shrink-0 ring-1 ring-emerald-200/50 group-hover:ring-emerald-300 transition-all">
        <CreditCard className="w-5 h-5 text-emerald-600" />
      </div>

      {/* Payment Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MethodIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
            {maskedTxnId}
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
          <span>Order #{orderNumber}</span>
          <span className="text-gray-300">•</span>
          <span>{formattedDate}</span>
          <span className="text-gray-300">•</span>
          <span className="capitalize">{paymentMethod}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(amount)}
        </p>
      </div>

      {/* Arrow Indicator */}
      <div className={cn(
        'shrink-0 transition-all duration-200',
        isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
      )}>
        <ChevronRight className="w-5 h-5 text-emerald-500" />
      </div>
    </Link>
  );
}
