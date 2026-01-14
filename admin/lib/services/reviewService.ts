import { reviewsService as reviewsApiService } from '../api/reviews';
import { apiClient } from '../api/client';
import {
  CreateReviewRequest,
  UpdateReviewRequest,
  UpdateReviewStatusRequest,
} from '../api/types';

/**
 * Review statistics response from the API
 */
export interface ReviewStatistics {
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
 * Unified review service that switches between mock and API
 */
export const reviewService = {
  getReviews: async (params?: { page?: number; limit?: number; status?: string; type?: string; featured?: boolean }) => {
    return reviewsApiService.getReviews(params);
  },

  getReview: async (id: string) => {
    return reviewsApiService.getReview(id);
  },

  createReview: async (data: CreateReviewRequest) => {
    return reviewsApiService.createReview(data);
  },

  updateReview: async (id: string, data: UpdateReviewRequest) => {
    return reviewsApiService.updateReview(id, data);
  },

  updateReviewStatus: async (id: string, data: UpdateReviewStatusRequest) => {
    return reviewsApiService.updateReviewStatus(id, data);
  },

  addComment: async (id: string, content: string, isInternal: boolean = false) => {
    return reviewsApiService.addComment(id, content, isInternal);
  },

  deleteReview: async (id: string) => {
    return reviewsApiService.deleteReview(id);
  },

  /**
   * Get aggregated review statistics
   * - Total reviews count
   * - Average rating (calculated from all reviews)
   * - Satisfaction rate (% of reviews with 4+ stars)
   * - Rating distribution
   */
  getStatistics: async (): Promise<{ success: boolean; data: ReviewStatistics }> => {
    return apiClient.get<{ success: boolean; data: ReviewStatistics }>('/reviews/statistics');
  },

  isMockMode: () => false,
};
