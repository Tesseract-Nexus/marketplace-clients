'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, LogIn, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavPath } from '@/context/TenantContext';

interface GuestCheckoutBannerProps {
  onContinueAsGuest?: () => void;
}

export function GuestCheckoutBanner({ onContinueAsGuest }: GuestCheckoutBannerProps) {
  const getNavPath = useNavPath();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-5 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Sign in for a better experience
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Track your orders, save addresses, and access exclusive member benefits.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" size="sm" className="btn-tenant-primary gap-2">
              <Link href={getNavPath('/login?redirect=/checkout')}>
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={getNavPath('/register?redirect=/checkout')}>
                <Gift className="h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <button
              onClick={onContinueAsGuest}
              className="text-sm font-medium text-tenant-primary hover:underline"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Benefits list */}
      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '📦', text: 'Track orders easily' },
            { icon: '🏠', text: 'Save addresses' },
            { icon: '🎁', text: 'Earn rewards' },
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <span>{benefit.icon}</span>
              <span>{benefit.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
