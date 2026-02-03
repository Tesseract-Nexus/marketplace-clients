'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogIn, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavPath } from '@/context/TenantContext';

interface GuestCheckoutBannerProps {
  onContinueAsGuest?: () => void;
}

export function GuestCheckoutBanner({ onContinueAsGuest }: GuestCheckoutBannerProps) {
  const getNavPath = useNavPath();
  const [showBenefits, setShowBenefits] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
              Sign in for faster checkout
            </p>
            <button
              onClick={() => setShowBenefits(!showBenefits)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {showBenefits ? 'Hide' : 'View'} benefits
              {showBenefits ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button asChild variant="default" size="sm" className="btn-tenant-primary h-8 text-xs">
            <Link href={getNavPath('/login?redirect=/checkout')}>
              <LogIn className="h-3 w-3 mr-1" />
              Sign In
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onContinueAsGuest}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Guest
          </Button>
        </div>
      </div>

      {/* Collapsible benefits */}
      <AnimatePresence>
        {showBenefits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 text-xs text-gray-600 dark:text-gray-400">
              <span>✓ Track orders</span>
              <span>✓ Save addresses</span>
              <span>✓ Earn rewards</span>
              <span>✓ Faster checkout</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
