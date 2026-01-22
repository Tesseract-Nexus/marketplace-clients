'use client';

import React from 'react';
import { Smile, Star, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';
import { useAdminTranslatedText } from '@/hooks/useAdminTranslatedText';

interface CustomerSatisfactionWidgetProps {
  data: DashboardData;
}

export function CustomerSatisfactionWidget({ data }: CustomerSatisfactionWidgetProps) {
  const { satisfaction } = data;

  // Determine if we have rating data or just review count
  const hasRatingData = satisfaction.avgRating > 0;
  const hasReviews = satisfaction.totalReviews > 0;

  // Translated status texts
  const { translatedText: noRatingsText } = useAdminTranslatedText('No Ratings');
  const { translatedText: noReviewsText } = useAdminTranslatedText('No Reviews');
  const { translatedText: excellentText } = useAdminTranslatedText('Excellent');
  const { translatedText: greatText } = useAdminTranslatedText('Great');
  const { translatedText: goodText } = useAdminTranslatedText('Good');
  const { translatedText: needsWorkText } = useAdminTranslatedText('Needs Work');

  // Get status text and color based on rating
  const getStatus = () => {
    if (!hasRatingData) {
      return { text: hasReviews ? noRatingsText : noReviewsText, color: 'text-muted-foreground' };
    }
    if (satisfaction.avgRating >= 4.5) return { text: excellentText, color: 'text-emerald-600' };
    if (satisfaction.avgRating >= 4) return { text: greatText, color: 'text-primary' };
    if (satisfaction.avgRating >= 3) return { text: goodText, color: 'text-warning' };
    return { text: needsWorkText, color: 'text-orange-600' };
  };

  const status = getStatus();

  return (
    <DashboardCard className="border-border/50 hover:border-warning/40/50 transition-all duration-300">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg ring-4 ring-amber-500/20">
              <Smile className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                <AdminUIText text="Customer Satisfaction" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Based on customer reviews" /></DashboardCardDescription>
            </div>
          </div>
          <Link href="/reviews">
            <Button variant="outline" className="text-foreground hover:text-warning-foreground hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-xs h-8 bg-card border border-border hover:border-warning/40 shadow-sm hover:shadow transition-all">
              <Eye className="h-3 w-3 mr-1" />
              <AdminUIText text="View All" />
            </Button>
          </Link>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-8 w-8 transition-colors",
                    hasRatingData && star <= Math.round(satisfaction.avgRating)
                      ? "text-amber-400 fill-amber-400"
                      : hasRatingData && star - 0.5 <= satisfaction.avgRating
                      ? "text-amber-400 fill-amber-200"
                      : "text-gray-200 fill-gray-100"
                  )}
                />
              ))}
            </div>
            <span className="text-3xl font-bold text-foreground ml-2">
              {hasRatingData ? satisfaction.avgRating.toFixed(1) : '—'}
            </span>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>

          {!hasRatingData && hasReviews && (
            <p className="text-xs text-muted-foreground italic"><AdminUIText text="Reviews without star ratings" /></p>
          )}

          <div className="grid grid-cols-3 gap-6 w-full pt-4 border-t border-border mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{satisfaction.totalReviews}</p>
              <p className="text-xs text-muted-foreground"><AdminUIText text="Total Reviews" /></p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold", hasRatingData ? "text-emerald-600" : "text-muted-foreground")}>
                {hasRatingData ? `${satisfaction.satisfactionRate}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground"><AdminUIText text="Satisfied" /></p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold", status.color)}>{status.text}</p>
              <p className="text-xs text-muted-foreground"><AdminUIText text="Status" /></p>
            </div>
          </div>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
