'use client';

import { useState, useMemo } from 'react';
import { Star, Loader2, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useLoyalty } from '@/hooks/useLoyalty';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';

interface LoyaltyPointsRedemptionProps {
  orderSubtotal: number;
  appliedPoints: number;
  onApplyPoints: (points: number, dollarValue: number) => void;
  onRemovePoints: () => void;
  disabled?: boolean;
}

export function LoyaltyPointsRedemption({
  orderSubtotal,
  appliedPoints,
  onApplyPoints,
  onRemovePoints,
  disabled = false,
}: LoyaltyPointsRedemptionProps) {
  const {
    program,
    pointsBalance,
    pointsValue: totalPointsValue,
    isEnrolled,
    isProgramActive,
    isLoading,
  } = useLoyalty();
  const { formatDisplayPrice } = usePriceFormatting();

  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  // Calculate redemption rate (points per $1)
  const redemptionRate = program?.pointsRedemptionRate || 100;
  const minimumRedemption = program?.minimumRedemption || 100;

  // Calculate max redeemable points (can't exceed order subtotal or available balance)
  const maxRedeemableByOrder = Math.floor(orderSubtotal * redemptionRate);
  const maxRedeemable = Math.min(pointsBalance, maxRedeemableByOrder);

  // Calculate dollar value for current selection
  const dollarValue = pointsToRedeem / redemptionRate;

  // Check if minimum is met
  const meetsMinimum = pointsToRedeem >= minimumRedemption || pointsToRedeem === 0;

  // Points that will be earned from this order (after discount)
  const earnablePoints = program
    ? Math.floor((orderSubtotal - dollarValue) * program.pointsPerDollar)
    : 0;

  const handleApply = async () => {
    if (pointsToRedeem < minimumRedemption) return;
    setIsApplying(true);
    try {
      onApplyPoints(pointsToRedeem, dollarValue);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemove = () => {
    setPointsToRedeem(0);
    onRemovePoints();
  };

  // Don't render if not enrolled or program inactive
  if (!isEnrolled || !isProgramActive || !program) {
    return null;
  }

  // Don't render if no points available
  if (pointsBalance === 0 && appliedPoints === 0) {
    return null;
  }

  const isApplied = appliedPoints > 0;

  return (
    <div className="bg-gradient-to-br from-yellow-50/50 to-amber-50/50 rounded-xl border border-yellow-200/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Loyalty Points</h3>
            <p className="text-xs text-muted-foreground">
              {pointsBalance.toLocaleString()} pts available ({formatDisplayPrice(totalPointsValue)})
            </p>
          </div>
        </div>
        {isApplied && (
          <Badge className="bg-green-100 text-green-700">
            <Check className="h-3 w-3 mr-1" />
            Applied
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isApplied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div>
                <p className="font-medium text-green-700">
                  -{appliedPoints.toLocaleString()} points
                </p>
                <p className="text-xs text-muted-foreground">
                  Saving {formatDisplayPrice(appliedPoints / redemptionRate)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="selector"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Points Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Points to redeem</span>
                <span className="font-semibold">
                  {pointsToRedeem.toLocaleString()} pts
                  {pointsToRedeem > 0 && (
                    <span className="text-green-600 ml-1">
                      (-{formatDisplayPrice(dollarValue)})
                    </span>
                  )}
                </span>
              </div>

              <Slider
                value={[pointsToRedeem]}
                onValueChange={([value]) => setPointsToRedeem(value)}
                max={maxRedeemable}
                step={minimumRedemption > 0 ? minimumRedemption : 10}
                disabled={disabled || maxRedeemable < minimumRedemption}
                className="w-full"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxRedeemable.toLocaleString()} max</span>
              </div>
            </div>

            {/* Quick Select Buttons */}
            {maxRedeemable >= minimumRedemption && (
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100].map((percent) => {
                  const points = Math.floor((maxRedeemable * percent) / 100);
                  if (points < minimumRedemption) return null;
                  return (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      onClick={() => setPointsToRedeem(points)}
                      disabled={disabled}
                      className={cn(
                        'text-xs',
                        pointsToRedeem === points && 'border-yellow-500 bg-yellow-50'
                      )}
                    >
                      {percent}%
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsToRedeem(maxRedeemable)}
                  disabled={disabled}
                  className={cn(
                    'text-xs',
                    pointsToRedeem === maxRedeemable && 'border-yellow-500 bg-yellow-50'
                  )}
                >
                  Max
                </Button>
              </div>
            )}

            {/* Minimum Warning */}
            {!meetsMinimum && pointsToRedeem > 0 && (
              <div className="flex items-start gap-2 p-2 bg-yellow-100/50 rounded-lg text-xs text-yellow-700">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Minimum {minimumRedemption.toLocaleString()} points required for redemption</span>
              </div>
            )}

            {/* Apply Button */}
            <Button
              variant="tenant-primary"
              size="sm"
              className="w-full"
              onClick={handleApply}
              disabled={disabled || pointsToRedeem < minimumRedemption || isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  Apply {pointsToRedeem.toLocaleString()} Points
                  {pointsToRedeem > 0 && ` (-${formatDisplayPrice(dollarValue)})`}
                </>
              )}
            </Button>

            {/* Points You'll Earn */}
            {earnablePoints > 0 && (
              <div className="text-center text-xs text-muted-foreground">
                You'll earn <span className="font-medium text-yellow-600">{earnablePoints.toLocaleString()} points</span> from this order
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
