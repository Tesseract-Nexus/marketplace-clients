import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const REVIEWS_SERVICE_URL = getServiceUrl('REVIEWS');

interface ReviewRating {
  aspect?: string;
  score?: number;
  maxScore?: number;
  max_score?: number;
}

interface Review {
  id: string;
  rating?: number;
  average_rating?: number;
  averageRating?: number;
  ratings?: ReviewRating[];
  status?: string;
}

interface ReviewStatistics {
  totalReviews: number;
  avgRating: number;
  satisfactionRate: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviewsWithRatings: number;
  reviewsWithoutRatings: number;
}

/**
 * Calculate the rating for a single review
 * Handles multiple formats: direct rating, pre-calculated average, or ratings array
 */
function calculateReviewRating(review: Review): number {
  // Direct rating field (1-5 scale)
  if (typeof review.rating === 'number' && review.rating > 0) {
    return review.rating;
  }

  // Pre-calculated average (camelCase)
  if (typeof review.averageRating === 'number' && review.averageRating > 0) {
    return review.averageRating;
  }

  // Pre-calculated average (snake_case from Go backend)
  if (typeof review.average_rating === 'number' && review.average_rating > 0) {
    return review.average_rating;
  }

  // Calculate from ratings array
  if (review.ratings && Array.isArray(review.ratings) && review.ratings.length > 0) {
    const totalScore = review.ratings.reduce((sum, r) => sum + (r?.score ?? 0), 0);
    const totalMaxScore = review.ratings.reduce((sum, r) => {
      // Handle both camelCase and snake_case
      const maxScore = r?.maxScore ?? r?.max_score ?? 5;
      return sum + maxScore;
    }, 0);

    // Normalize to 5-point scale
    if (totalMaxScore > 0) {
      return (totalScore / totalMaxScore) * 5;
    }
  }

  return 0;
}

/**
 * GET /api/reviews/statistics
 *
 * Returns aggregated review statistics including:
 * - Total reviews count
 * - Average rating (calculated from all reviews)
 * - Satisfaction rate (% of reviews with 4+ stars)
 * - Rating distribution
 */
export async function GET(request: NextRequest) {
  try {
    const headers = await getProxyHeaders(request);

    // Fetch all reviews (or a reasonable sample for statistics)
    // Using a higher limit to get accurate statistics
    const response = await fetch(`${REVIEWS_SERVICE_URL}/reviews?limit=1000&status=APPROVED`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      // If reviews service fails, return empty statistics
      console.error('Reviews service error:', response.status);
      return NextResponse.json({
        success: true,
        data: {
          totalReviews: 0,
          avgRating: 0,
          satisfactionRate: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviewsWithRatings: 0,
          reviewsWithoutRatings: 0,
        } as ReviewStatistics,
      });
    }

    const result = await response.json();
    const reviews: Review[] = result.reviews || result.data || [];
    const totalReviews = result.pagination?.total || reviews.length;

    // Calculate statistics
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    let reviewsWithRatings = 0;
    let satisfiedCount = 0;

    reviews.forEach((review) => {
      const rating = calculateReviewRating(review);

      if (rating > 0) {
        reviewsWithRatings++;
        totalRating += rating;

        // Count satisfied (4+ stars)
        if (rating >= 4) {
          satisfiedCount++;
        }

        // Update distribution (round to nearest integer for bucketing)
        const bucket = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
        ratingDistribution[bucket]++;
      }
    });

    const statistics: ReviewStatistics = {
      totalReviews,
      avgRating: reviewsWithRatings > 0 ? Math.round((totalRating / reviewsWithRatings) * 10) / 10 : 0,
      satisfactionRate: reviewsWithRatings > 0 ? Math.round((satisfiedCount / reviewsWithRatings) * 100) : 0,
      ratingDistribution,
      reviewsWithRatings,
      reviewsWithoutRatings: totalReviews - reviewsWithRatings,
    };

    return NextResponse.json({
      success: true,
      data: statistics,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'Vary': 'Accept-Encoding, X-Tenant-ID',
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET reviews/statistics');
  }
}
