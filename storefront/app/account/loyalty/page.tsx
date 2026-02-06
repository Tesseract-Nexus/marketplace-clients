'use client';

import { useEffect, useState } from 'react';
import { Star, TrendingUp, Gift, Clock, Loader2, ChevronRight, Trophy, Sparkles, ArrowUpRight, ArrowDownRight, Award, Copy, Check, Share2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useTenant, useCurrency } from '@/context/TenantContext';
import { useLoyalty } from '@/hooks/useLoyalty';
import { formatPoints, getTierColor } from '@/lib/api/loyalty';
import { cn } from '@/lib/utils';

export default function LoyaltyPage() {
  const { tenant } = useTenant();
  const { symbol: currencySymbol } = useCurrency();
  const {
    program,
    customerLoyalty,
    transactions,
    pointsBalance,
    lifetimePoints,
    currentTier,
    pointsValue,
    tierBenefits,
    isEnrolled,
    isProgramActive,
    isLoading,
    isLoadingTransactions,
    isEnrolling,
    error,
    loadTransactions,
    enrollInProgram,
  } = useLoyalty();

  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isEnrolled) {
      loadTransactions();
    }
  }, [isEnrolled, loadTransactions]);

  const handleEnroll = async () => {
    setEnrollError(null);
    try {
      await enrollInProgram(referralCodeInput || undefined);
    } catch (error) {
      setEnrollError(error instanceof Error ? error.message : 'Failed to enroll');
    }
  };

  const copyReferralCode = async () => {
    if (customerLoyalty?.referralCode) {
      try {
        await navigator.clipboard.writeText(customerLoyalty.referralCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const shareReferralCode = async () => {
    if (customerLoyalty?.referralCode && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${program?.name || 'our rewards program'}!`,
          text: `Use my referral code ${customerLoyalty.referralCode} to get ${program?.referralBonus || 0} bonus points when you sign up!`,
          url: window.location.origin,
        });
      } catch (err) {
        // User cancelled or share failed
        console.error('Share failed:', err);
      }
    } else {
      copyReferralCode();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
      </div>
    );
  }

  if (!isProgramActive || !program) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Loyalty Program Coming Soon</h2>
        <p className="text-muted-foreground">
          We're working on an exciting loyalty program for our valued customers.
          Stay tuned for rewards and exclusive benefits!
        </p>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Hero Section */}
        <div className="relative p-8 md:p-12 bg-gradient-to-br from-tenant-primary/20 to-tenant-secondary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-tenant-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tenant-primary/10 text-tenant-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{program.name}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Join Our Rewards Program
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {program.description || `Earn ${program.pointsPerDollar} point${program.pointsPerDollar !== 1 ? 's' : ''} for every ${currencySymbol}1 you spend and unlock exclusive rewards.`}
            </p>

            {enrollError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {enrollError}
              </div>
            )}

            {/* Referral Code Input */}
            {program.referralBonus > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Have a referral code?
                </label>
                <div className="flex gap-2 max-w-sm">
                  <Input
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    className="uppercase tracking-wider"
                    maxLength={10}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Get an extra {program.referralBonus} bonus points!
                </p>
              </div>
            )}

            <Button
              variant="tenant-glow"
              size="lg"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Join Now - Earn {program.signupBonus + (referralCodeInput ? program.referralBonus : 0)} Bonus Points
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-8">
          <h2 className="text-xl font-bold mb-6 text-foreground">Program Benefits</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-tenant-primary/5 border border-tenant-primary/10 hover:border-tenant-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-tenant-primary/10 flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-tenant-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Earn Points</h3>
              <p className="text-sm text-muted-foreground">
                Get {program.pointsPerDollar} point{program.pointsPerDollar !== 1 ? 's' : ''} for every {currencySymbol}1 spent
              </p>
            </div>
            <div className="p-5 rounded-xl bg-tenant-primary/5 border border-tenant-primary/10 hover:border-tenant-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-tenant-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-tenant-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Unlock Tiers</h3>
              <p className="text-sm text-muted-foreground">
                {program.tiers.length} exclusive tiers with increasing benefits
              </p>
            </div>
            <div className="p-5 rounded-xl bg-tenant-primary/5 border border-tenant-primary/10 hover:border-tenant-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-tenant-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-tenant-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Bonus Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Birthday bonus, referral rewards & more
              </p>
            </div>
          </div>

          {/* Tiers Preview */}
          {program.tiers.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Membership Tiers</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {program.tiers.map((tier, index) => (
                  <div
                    key={tier.name}
                    className="p-4 rounded-xl border border-border bg-card hover:border-tenant-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-tenant-primary/10 flex items-center justify-center">
                        <Award className="h-4 w-4 text-tenant-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{tier.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {tier.minimumPoints.toLocaleString()}+ points required
                    </p>
                    <Badge className="bg-tenant-primary/10 text-tenant-primary border-0 hover:bg-tenant-primary/20">
                      {tier.discountPercent}% discount
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enrolled view
  const nextTier = program.tiers.find(t => t.minimumPoints > lifetimePoints);
  const currentTierData = program.tiers.find(t => t.name === currentTier) ?? program.tiers[0];
  const tierProgress = nextTier && currentTierData
    ? ((lifetimePoints - currentTierData.minimumPoints) / (nextTier.minimumPoints - currentTierData.minimumPoints)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Points Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-tenant-primary to-tenant-secondary rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-white font-medium mb-1">Available Points</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-white">
                  {formatPoints(pointsBalance)}
                </span>
                <span className="text-white font-medium">pts</span>
              </div>
              <p className="text-sm text-white mt-2">
                Worth {currencySymbol}{pointsValue.toFixed(2)} in rewards
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <Badge className="px-3 py-1.5 bg-white text-tenant-primary font-semibold border-0 shadow-lg">
                <Trophy className="h-3.5 w-3.5 mr-1.5" />
                {currentTier}
              </Badge>
              <p className="text-sm text-white font-medium">
                Lifetime: {formatPoints(lifetimePoints)} pts
              </p>
            </div>
          </div>

          {/* Tier Progress */}
          {nextTier && (
            <div className="mt-6 pt-6 border-t border-white/30">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white font-medium">Progress to {nextTier.name}</span>
                <span className="font-semibold text-white">
                  {customerLoyalty?.pointsToNextTier?.toLocaleString() || 0} pts to go
                </span>
              </div>
              <Progress value={tierProgress} className="h-2.5 bg-white/30" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border p-4 hover:border-tenant-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center mb-3">
            <Gift className="h-5 w-5 text-tenant-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{program.pointsPerDollar}x</p>
          <p className="text-sm text-muted-foreground">Points per {currencySymbol}1</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl border p-4 hover:border-tenant-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-tenant-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{currentTierData?.discountPercent || 0}%</p>
          <p className="text-sm text-muted-foreground">Tier Discount</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border p-4 hover:border-tenant-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-tenant-secondary/10 flex items-center justify-center mb-3">
            <Star className="h-5 w-5 text-tenant-secondary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{program.signupBonus}</p>
          <p className="text-sm text-muted-foreground">Signup Bonus</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-4 hover:border-tenant-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-tenant-secondary/10 flex items-center justify-center mb-3">
            <Gift className="h-5 w-5 text-tenant-secondary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{program.birthdayBonus}</p>
          <p className="text-sm text-muted-foreground">Birthday Bonus</p>
        </motion.div>
      </div>

      {/* Referral Section */}
      {customerLoyalty?.referralCode && program.referralBonus > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-gradient-to-r from-tenant-primary/5 to-tenant-secondary/5 rounded-xl border border-tenant-primary/20 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-tenant-primary" />
                <h2 className="font-semibold text-foreground">Refer Friends & Earn</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Share your referral code and you both earn {program.referralBonus} bonus points when they join!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-xs bg-background border rounded-lg px-4 py-2.5 font-mono text-lg tracking-widest text-foreground">
                  {customerLoyalty.referralCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyReferralCode}
                  className="shrink-0"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="tenant-primary"
                  size="icon"
                  onClick={shareReferralCode}
                  className="shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Points History
          </h2>
        </div>

        <div className="divide-y">
          {isLoadingTransactions ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Make a purchase to start earning points!</p>
            </div>
          ) : (
            transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      tx.type === 'EARN' || tx.type === 'BONUS'
                        ? 'bg-tenant-primary/10'
                        : 'bg-destructive/10'
                    )}
                  >
                    {tx.type === 'EARN' || tx.type === 'BONUS' ? (
                      <ArrowUpRight className="h-5 w-5 text-tenant-primary" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                      {tx.orderNumber && ` - Order #${tx.orderNumber}`}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    tx.type === 'EARN' || tx.type === 'BONUS' ? 'text-tenant-primary' : 'text-destructive'
                  )}
                >
                  {tx.type === 'EARN' || tx.type === 'BONUS' ? '+' : '-'}
                  {tx.points.toLocaleString()} pts
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Program Tiers */}
      {program.tiers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border"
        >
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              Membership Tiers
            </h2>
          </div>
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {program.tiers.map((tier) => {
              const isCurrentTier = tier.name === currentTier;
              const isUnlocked = lifetimePoints >= tier.minimumPoints;

              return (
                <div
                  key={tier.name}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    isCurrentTier ? 'border-tenant-primary bg-tenant-primary/5' : 'border-transparent bg-muted/50',
                    !isUnlocked && 'opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className={cn('h-5 w-5', getTierColor(tier.name).split(' ')[0])} />
                      <span className="font-semibold">{tier.name}</span>
                    </div>
                    {isCurrentTier && (
                      <Badge className="bg-tenant-primary text-on-tenant-primary">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {tier.minimumPoints.toLocaleString()} lifetime points
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-tenant-primary">{tier.discountPercent}% discount</p>
                    {tier.benefits && (
                      <p className="text-muted-foreground">{tier.benefits}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
