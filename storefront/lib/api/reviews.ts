// ========================================
// Review Types
// ========================================

export type ReviewStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'ARCHIVED';

export interface ReviewRating {
  aspect: string;
  score: number;
  maxScore: number;
}

export interface ReviewReaction {
  type: 'HELPFUL' | 'NOT_HELPFUL';
  count: number;
  userReacted?: boolean;
}

export interface ReviewMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  uploadedAt: string;
}

export interface ReviewComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  tenantId: string;
  targetId: string;
  targetType: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  title?: string;
  content: string;
  status: ReviewStatus;
  ratings?: ReviewRating[];
  media?: ReviewMedia[];
  comments?: ReviewComment[] | Record<string, ReviewComment>;
  helpfulCount: number;
  reportCount: number;
  featured: boolean;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
}

export interface CreateReviewRequest {
  targetId: string;
  targetType: 'PRODUCT';
  type?: 'PRODUCT' | 'SERVICE' | 'VENDOR' | 'EXPERIENCE';
  title?: string;
  content: string;
  ratings?: ReviewRating[];
}

// ========================================
// Reviews API Functions
// ========================================

export async function getProductReviews(
  tenantId: string,
  storefrontId: string,
  productId: string,
  options?: { page?: number; limit?: number; status?: string }
): Promise<ReviewsResponse> {
  const params = new URLSearchParams({
    targetId: productId,
    targetType: 'PRODUCT',
    status: options?.status || 'APPROVED',
    page: String(options?.page || 1),
    limit: String(options?.limit || 10),
  });

  const response = await fetch(
    `/api/reviews?${params}`,
    {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return {
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }
    throw new Error('Failed to fetch reviews');
  }

  const data = await response.json();
  return {
    reviews: data.data || data.reviews || [],
    pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    summary: data.summary,
  };
}

export async function createReview(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  review: CreateReviewRequest,
  userId?: string,
  userName?: string
): Promise<Review> {
  const response = await fetch(
    `/api/reviews`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        ...(userId && { 'X-User-Id': userId }),
        ...(userName && { 'X-User-Name': userName }),
      },
      body: JSON.stringify(review),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit review');
  }

  const data = await response.json();
  return data.data || data;
}

export async function addReviewReaction(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  reviewId: string,
  reactionType: 'HELPFUL' | 'NOT_HELPFUL'
): Promise<void> {
  const response = await fetch(
    `/api/reviews/${reviewId}/reactions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify({ type: reactionType }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add reaction');
  }
}

export async function checkVerifiedPurchase(
  _tenantId: string,
  _storefrontId: string,
  _accessToken: string,
  _productId: string
): Promise<boolean> {
  // TODO: Implement orders API route for verified purchase check
  return false;
}

// ========================================
// Review Media Functions
// ========================================

export interface UploadMediaResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    fileSize: number;
    contentType: string;
  };
  error?: string;
}

export async function uploadReviewMedia(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  reviewId: string,
  file: File,
  caption?: string
): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('review_id', reviewId);
  formData.append('media_type', file.type.startsWith('image/') ? 'image' : 'video');
  formData.append('isPublic', 'true');
  if (caption) {
    formData.append('caption', caption);
  }

  const response = await fetch(
    `/api/reviews/media/upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to upload image');
  }

  return response.json();
}

export async function getReviewMedia(
  tenantId: string,
  storefrontId: string,
  reviewId: string
): Promise<ReviewMedia[]> {
  const response = await fetch(
    `/api/reviews/${reviewId}/media`,
    {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.data || [];
}
