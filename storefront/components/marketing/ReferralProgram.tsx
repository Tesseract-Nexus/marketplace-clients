'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Gift,
  Copy,
  CheckCircle2,
  Share2,
  Loader2,
  Star,
  ChevronRight,
  Twitter,
  Facebook,
  Mail as MailIcon,
  LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTenant, useMarketingConfig } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { useLoyaltyStore } from '@/store/loyalty';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  pointsEarned: number;
}

interface ReferralProgramProps {
  variant?: 'full' | 'compact' | 'card';
  className?: string;
}

// ========================================
// Main Component
// ========================================

export function ReferralProgram({ variant = 'full', className }: ReferralProgramProps) {
  const { tenant } = useTenant();
  const marketingConfig = useMarketingConfig();
  const { isAuthenticated, accessToken, customer } = useAuthStore();
  const { customerLoyalty, program, fetchCustomerLoyalty, isLoadingCustomer } = useLoyaltyStore();

  // Don't render if referral program is disabled
  if (!marketingConfig.enableReferralProgram) {
    return null;
  }

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Fetch customer loyalty data if not available
  useEffect(() => {
    if (tenant && isAuthenticated && customer?.id && !customerLoyalty) {
      fetchCustomerLoyalty(tenant.id, tenant.storefrontId, customer.id);
    }
  }, [tenant, isAuthenticated, customer?.id, customerLoyalty, fetchCustomerLoyalty]);

  // Fetch referral stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!tenant || !isAuthenticated || !accessToken) return;

      setIsLoadingStats(true);
      try {
        const response = await fetch('/api/loyalty/referrals/stats', {
          headers: {
            'X-Tenant-ID': tenant.id,
            'X-Storefront-ID': tenant.storefrontId,
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch referral stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [tenant, isAuthenticated, accessToken]);

  const referralCode = customerLoyalty?.referralCode || '';
  const referralBonus = program?.referralBonus || 500;
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${referralCode}`
    : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'email') => {
    const message = `Join me on ${tenant?.name || 'this store'} and get ${referralBonus} bonus points! Use my referral code: ${referralCode}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedLink = encodeURIComponent(referralLink);

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`Join ${tenant?.name || 'our store'}!`)}&body=${encodedMessage}%0A%0A${encodedLink}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setShowShareOptions(false);
  };

  if (!isAuthenticated) {
    return (
      <div className={cn('bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200', className)}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Refer Friends, Earn Rewards</h3>
            <p className="text-sm text-gray-600">
              Sign in to get your referral code and start earning {referralBonus} points per referral!
            </p>
          </div>
          <Button variant="tenant-primary" asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingCustomer) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!customerLoyalty) {
    return null;
  }

  // Compact variant for sidebar or footer
  if (variant === 'compact') {
    return (
      <div className={cn('bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white', className)}>
        <div className="flex items-center gap-3 mb-3">
          <Gift className="h-5 w-5" />
          <span className="font-semibold">Refer & Earn {referralBonus} pts</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-1.5 bg-white/20 rounded text-sm font-mono">
            {referralCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Card variant for dashboard
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('bg-white rounded-xl border shadow-sm overflow-hidden', className)}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <h3 className="font-bold">Referral Program</h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono font-semibold text-purple-600">
                {referralCode}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Earn per referral</span>
            <Badge className="bg-purple-100 text-purple-700">{referralBonus} points</Badge>
          </div>
          {stats && (
            <div className="pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">Total referrals</span>
              <span className="font-semibold">{stats.successfulReferrals}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Refer Friends, Earn Rewards</h2>
              <p className="text-white/80">Share your code and earn {referralBonus} points for each friend who joins!</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <p className="text-sm text-white/70 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-2xl font-bold font-mono tracking-wider">
                {referralCode}
              </code>
              <Button
                onClick={handleCopyCode}
                className={cn(
                  'shrink-0',
                  copied ? 'bg-green-500 hover:bg-green-600' : 'bg-white/20 hover:bg-white/30'
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="flex items-center gap-3">
            <Input
              value={referralLink}
              readOnly
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
            />
            <div className="relative">
              <Button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="bg-white/20 hover:bg-white/30"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {/* Share options dropdown */}
              {showShareOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border p-2 min-w-[160px] z-10"
                >
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Facebook className="h-4 w-4 text-[#1877F2]" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MailIcon className="h-4 w-4 text-gray-600" />
                    Email
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LinkIcon className="h-4 w-4 text-gray-600" />
                    Copy Link
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
            <p className="text-sm text-gray-500">Total Referrals</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.successfulReferrals}</p>
            <p className="text-sm text-gray-500">Successful</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingReferrals}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-pink-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pointsEarned.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Points Earned</p>
          </motion.div>
        </div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border p-6"
      >
        <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-purple-600">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Share Your Code</p>
              <p className="text-sm text-gray-500">Send your unique referral code to friends</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-purple-600">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Friend Signs Up</p>
              <p className="text-sm text-gray-500">They register using your referral code</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-purple-600">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Both Earn Points</p>
              <p className="text-sm text-gray-500">You both get {referralBonus} bonus points!</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
