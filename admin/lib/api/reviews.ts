import { apiClient } from './client';
import type { Review, CreateReviewRequest, UpdateReviewRequest, UpdateReviewStatusRequest, ApiResponse, ApiListResponse } from './types';

// Use the singleton apiClient to ensure tenant context is shared

export class ReviewsService {
  async getReviews(params?: { page?: number; limit?: number; status?: string; type?: string; featured?: boolean }): Promise<ApiListResponse<Review>> {
    return apiClient.get<ApiListResponse<Review>>('/reviews', params);
  }

  async getReview(id: string): Promise<ApiResponse<Review>> {
    return apiClient.get<ApiResponse<Review>>(`/reviews/${id}`);
  }

  async createReview(data: CreateReviewRequest): Promise<ApiResponse<Review>> {
    return apiClient.post<ApiResponse<Review>>('/reviews', data);
  }

  async updateReview(id: string, data: UpdateReviewRequest): Promise<ApiResponse<Review>> {
    return apiClient.put<ApiResponse<Review>>(`/reviews/${id}`, data);
  }

  async updateReviewStatus(id: string, data: UpdateReviewStatusRequest): Promise<ApiResponse<Review>> {
    return apiClient.put<ApiResponse<Review>>(`/reviews/${id}/status`, data);
  }

  async addComment(id: string, content: string, isInternal: boolean = false): Promise<ApiResponse<Review>> {
    return apiClient.post<ApiResponse<Review>>(`/reviews/${id}/comments`, { content, isInternal });
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/reviews/${id}`);
  }
}

export const reviewsService = new ReviewsService();
