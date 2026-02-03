'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface MobileOrderSummaryProps {
  itemCount: number;
  total: number;
  formatPrice: (price: number) => string;
  children?: React.ReactNode;
}

export function MobileOrderSummary({
  itemCount,
  total,
  formatPrice,
  children,
}: MobileOrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* Expandable summary panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card border-t shadow-2xl overflow-hidden"
          >
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always visible summary bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-card border-t shadow-lg p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-5 w-5 text-tenant-primary" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-tenant-primary text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {itemCount}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {isExpanded ? <TranslatedUIText text="Hide order summary" /> : <TranslatedUIText text="View order summary" />}
          </span>
          <ChevronUp className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
        <div className="text-right">
          <span className="font-bold text-lg">{formatPrice(total)}</span>
        </div>
      </button>
    </div>
  );
}

export default MobileOrderSummary;
